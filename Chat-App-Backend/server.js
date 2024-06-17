const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const { ObjectId } = mongoose.Types;

const path = require("path");

mongoose.set("strictQuery", false);

if (process.env.NODE_ENV === "development") {
  // Development-specific code
  console.log("This is the development environment");
}
if (process.env.NODE_ENV === "production") {
  // Production-specific code
  console.log("This is the production environment");
}

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT Exception! Shutting down ...");
  process.exit(1); // Exit Code 1 indicates that a container shut down, either because of an application failure.
});

const app = require("./app");

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io"); // Add this
const { promisify } = require("util");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const OneToOneMessage = require("./models/OneToOneMessage");
const AudioCall = require("./models/audioCall");
const VideoCall = require("./models/videoCall");

// Add this
// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true, // The underlying MongoDB driver has deprecated their current connection string parser. Because this is a major change, they added the useNewUrlParser flag to allow users to fall back to the old parser if they find a bug in the new parser.
    // useCreateIndex: true, // Again previously MongoDB used an ensureIndex function call to ensure that Indexes exist and, if they didn't, to create one. This too was deprecated in favour of createIndex . the useCreateIndex option ensures that you are using the new function calls.
    // useFindAndModify: false, // findAndModify is deprecated. Use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead.
    useUnifiedTopology: true, // Set to true to opt in to using the MongoDB driver's new connection management engine. You should set this option to true , except for the unlikely case that it prevents you from maintaining a stable connection.
  })
  .then((con) => {
    console.log("DB Connection successful");
  });

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// Add this
// Listen for when the client connects via socket.io-client
io.on("connection", async (socket) => {
  console.log("connected", JSON.stringify(socket.handshake.query));
  // TODO jWT
  const user_id = socket.handshake.query["user_id"];

  console.log(`User connected ${socket.id}`);

  if (Boolean(user_id)) {
    try {
      console.log("user-id", user_id);
      const user = await User.findByIdAndUpdate(
        user_id,
        {
          socket_id: socket.id,
          status: "Online",
        },
        { new: true }
      ).populate("friends", "socket_id");

      if (user && user.friends) {
        // Broadcast to all friends that this user is Online
        user.friends.forEach((friend) => {
          if (friend.socket_id) {
            io.to(friend.socket_id).emit("friend_online", {
              user_id: user_id,
            });
          }
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  // We can write our socket event listeners in here...
  socket.on("friend_request", async (data, callback) => {
    console.log(data.to); //data.to is a user_id of the person that i want to send a friend request
    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    // create a friend request
    await FriendRequest.create({
      sender: data.from, //user_id
      recipient: data.to, //user_id
    });

    callback(); //it fires callBack defined at client side
    console.log("friend-request received from", from);
    // emit event request received to recipient
    io.to(to?.socket_id).emit("new_friend_request", {
      message: "New friend request received",
    });
    io.to(from?.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
    });
  });

  socket.on("accept_request", async (data) => {
    // accept friend request => add ref of each other in friends array
    console.log(data);
    const request_doc = await FriendRequest.findById(data.request_id);

    console.log(request_doc);

    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipient);

    sender.friends.push(request_doc.recipient);
    receiver.friends.push(request_doc.sender);

    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    // delete this request doc
    // emit event to both of them

    // emit event request accepted to both
    io.to(sender?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
    io.to(receiver?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    // *for chat list rendering
    const existing_conversations = await OneToOneMessage.find({
      participants: { $all: [user_id] },
    }).populate("participants", "firstName lastName avatar _id email status");

    // db.books.find({ authors: { $elemMatch: { name: "John Smith" } } })

    console.log(existing_conversations);

    callback(existing_conversations);
  });

  socket.on("start_conversation", async (data) => {
    //* new or exisiting conversation
    // data: {to: from:}

    const { to, from } = data;

    // check if there is any existing conversation

    const existing_conversations = await OneToOneMessage.find({
      participants: { $size: 2, $all: [to, from] },
    }).populate("participants", "firstName lastName _id email status");

    console.log(existing_conversations[0], "Existing Conversation");

    // if no => create a new OneToOneMessage doc & emit event "start_chat" & send conversation details as payload
    if (existing_conversations.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [to, from],
      });

      new_chat = await OneToOneMessage.findById(new_chat).populate(
        "participants",
        "firstName lastName _id email status"
      );

      console.log(new_chat);

      socket.emit("start_chat", new_chat);
    }
    // if yes => just emit event "start_chat" & send conversation details as payload
    else {
      //"open_chat"
      socket.emit("start_chat", existing_conversations[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      const result = await OneToOneMessage.findById(
        data.conversation_id
      ).select("messages");
      callback(result?.messages); //fire on frontend side
    } catch (error) {
      console.log(error);
    }
  });

  // Handle incoming text/link messages
  socket.on("text_message", async (data) => {
    console.log("Received message:", data);

    // data: {to, from, text/link}

    const { message, conversation_id, from, to, type } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // message => {to, from, type, created_at, text, file}

    let new_message=null;

    if(to_user?.status=="Online"){
      new_message = {
        to: to,
        from: from,
        type: type,
        created_at: Date.now(),
        text: message,
        status: "Delivered",
      };
    }else{
      new_message = {
        to: to,
        from: from,
        type: type,
        created_at: Date.now(),
        text: message,
        status: "Sent",
      };
    }

    

    // fetch OneToOneMessage Doc & push a new message to existing conversation
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    // save to db`
    await chat.save({ new: true, validateModifiedOnly: true });

    // TODO create a room and subsscribe the uses to that rooms and them when we emit an event it would fire to all user joined to that room

    // emit to t incoming_message -user

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

    // emit outgoing_message -> from user
    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });
  });

  // handle Media/Document Message
  socket.on("file_message", (data) => {
    console.log("Received message:", data);

    // data: {to, from, text, file}

    // Get the file extension
    const fileExtension = path.extname(data.file.name);

    // Generate a unique filename
    const filename = `${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}${fileExtension}`;

    // upload file to AWS s3

    // create a new conversation if its dosent exists yet or add a new message to existing conversation

    // save to db

    // emit incoming_message -> to user

    // emit outgoing_message -> from user
  });

  // Event to handle marking messages as delivered
  // socket.on("markMessagesDelivered", async ({ userId, conversationIds }) => {
  //   try {
  //     console.log("marking");
  //     for (let conversationId of conversationIds) {
  //       if (ObjectId.isValid(conversationId)) {
  //         try {
  //           conversationId = new ObjectId(conversationId);
  //         } catch (err) {
  //           console.error(`Invalid ObjectId: ${conversationId}`);
  //           continue; // Skip invalid ObjectId
  //         }
  //       }
  //       await OneToOneMessage.updateMany(
  //         {
  //           _id: conversationId,
  //           "messages.to": userId,
  //           "messages.status": "Sent",
  //         },
  //         { $set: { "messages.$.status": "Delivered" } }
  //       );

  //       // Emit the update to the sender
  //       const conversation = await OneToOneMessage.findById(
  //         conversationId
  //       ).populate("participants");
  //       const senderId = conversation.participants.find(
  //         (id) => id.toString() !== userId
  //       );
  //       const sender = await User.findById(senderId);

  //       if (sender && sender.socket_id) {
  //         io.to(sender.socket_id).emit("messagesDelivered", conversationId);
  //       }
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // });



  socket.on('markMessagesDelivered', async ( data ) => {
    let userId = data.current_id;
    console.log("userObjectId........",userId);
    
    // if (!ObjectId.isValid(data?.userId)) {
    //   console.error(`Invalid user ID: ${userId}`);
    //   return;
    // }

    // const userObjectId = new ObjectId(userId);


    try {
      // Find all messages where the user is a participant
      const conversations = await OneToOneMessage.find({
        participants: userId
      });

      for (let conversation of conversations) {
        let updateRequired = false; // Track if any message statuses are updated
        // let sendersToNotify = conversation.messages.from; // To collect unique sender IDs

        // Update message statuses and collect sender IDs
        for (let message of conversation.messages) {
          if (message.to.equals(userId) && message.status === 'Sent') {
            message.status = 'Delivered';
            updateRequired = true; // Mark that an update is needed
            // sendersToNotify.add(message.from.toString());
          }
        }

        // Save updates if necessary
        if (updateRequired) {
          await conversation.save(); // Save the conversation only if updates were made


        const senderId = conversation.participants.find(
            (id) => id.toString() !== userId
        );

        const sender = await User.findById(senderId);
        
          
          // Notify senders about the delivered status
          if (sender && sender.socket_id) {
            io.to(sender.socket_id).emit("messagesDelivered", conversation?._id);
          }
        }
      }
    } catch (err) {
      console.error(`Error updating message statuses: ${err.message}`);
    }
  });

  // -------------- HANDLE AUDIO CALL SOCKET EVENTS ----------------- //

  // handle start_audio_call event
  socket.on("start_audio_call", async (data) => {
    const { from, to, roomID } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    console.log("to_user", to_user);

    // send notification to receiver of call
    io.to(to_user?.socket_id).emit("audio_call_notification", {
      from: from_user,
      roomID,
      streamID: from,
      userID: to,
      userName: to,
    });
  });

  // handle audio_call_not_picked
  socket.on("audio_call_not_picked", async (data) => {
    console.log(data);
    // find and update call record
    const { to, from } = data;

    const to_user = await User.findById(to);

    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Missed", status: "Ended", endedAt: Date.now() }
    );

    // TODO => emit call_missed to receiver of call
    io.to(to_user?.socket_id).emit("audio_call_missed", {
      from,
      to,
    });
  });

  // handle audio_call_accepted
  socket.on("audio_call_accepted", async (data) => {
    const { to, from } = data;

    const from_user = await User.findById(from);

    // find and update call record
    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Accepted" }
    );

    // TODO => emit call_accepted to sender of call
    io.to(from_user?.socket_id).emit("audio_call_accepted", {
      from,
      to,
    });
  });

  // handle audio_call_denied
  socket.on("audio_call_denied", async (data) => {
    // find and update call record
    const { to, from } = data;

    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Denied", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit call_denied to sender of call

    io.to(from_user?.socket_id).emit("audio_call_denied", {
      from,
      to,
    });
  });

  // handle user_is_busy_audio_call
  socket.on("user_is_busy_audio_call", async (data) => {
    const { to, from } = data;
    // find and update call record
    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Busy", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit on_another_audio_call to sender of call
    io.to(from_user?.socket_id).emit("on_another_audio_call", {
      from,
      to,
    });
  });

  // --------------------- HANDLE VIDEO CALL SOCKET EVENTS ---------------------- //

  // handle start_video_call event
  socket.on("start_video_call", async (data) => {
    const { from, to, roomID } = data;

    console.log(data);

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    console.log("to_user", to_user);

    // send notification to receiver of call
    io.to(to_user?.socket_id).emit("video_call_notification", {
      from: from_user,
      roomID,
      streamID: from,
      userID: to,
      userName: to,
    });
  });

  // handle video_call_not_picked
  socket.on("video_call_not_picked", async (data) => {
    console.log(data);
    // find and update call record
    const { to, from } = data;

    const to_user = await User.findById(to);

    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Missed", status: "Ended", endedAt: Date.now() }
    );

    // TODO => emit call_missed to receiver of call
    io.to(to_user?.socket_id).emit("video_call_missed", {
      from,
      to,
    });
  });

  // handle video_call_accepted
  socket.on("video_call_accepted", async (data) => {
    const { to, from } = data;

    const from_user = await User.findById(from);

    // find and update call record
    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Accepted" }
    );

    // TODO => emit call_accepted to sender of call
    io.to(from_user?.socket_id).emit("video_call_accepted", {
      from,
      to,
    });
  });

  // handle video_call_denied
  socket.on("video_call_denied", async (data) => {
    // find and update call record
    const { to, from } = data;

    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Denied", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit call_denied to sender of call

    io.to(from_user?.socket_id).emit("video_call_denied", {
      from,
      to,
    });
  });

  // handle user_is_busy_video_call
  socket.on("user_is_busy_video_call", async (data) => {
    const { to, from } = data;
    // find and update call record
    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Busy", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit on_another_video_call to sender of call
    io.to(from_user?.socket_id).emit("on_another_video_call", {
      from,
      to,
    });
  });

  // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline

    // if (data.user_id) {
    //   await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    // }

    // //TODO broadcast to all conversation rooms of this user that this user is offline (disconnected)

    // console.log("closing connection user_id=",data.user_id);
    // socket.disconnect(0);

    if (data.user_id) {
      // Update the user's status to Offline in the database
      const user = await User.findByIdAndUpdate(
        data.user_id,
        { status: "Offline", lastSeen: new Date().toISOString() },
        { new: true }
      ).populate("friends", "socket_id");

      console.log("closing connection user_id=", data.user_id);

      if (user && user.friends) {
        // Broadcast to all friends that this user is offline
        user.friends.forEach((friend) => {
          if (friend.socket_id) {
            io.to(friend.socket_id).emit("friend_offline", {
              user_id: data.user_id,
            });
          }
        });
      }

      // Disconnect the socket
      socket.disconnect(0);
    } else {
      console.error('User ID is missing in the "end" event data.');
    }
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down ...");
  server.close(() => {
    process.exit(1); //  Exit Code 1 indicates that a container shut down, either because of an application failure.
  });
});
