const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const { cloudinaryConnect } = require("./config/cloudinary");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const oldMessages = new Map(); //store in reverse order//TODO store userid and obj of conversationID

module.exports = {
  oldMessages,
};

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
const { uploadImageToCloudinary } = require("./utils/imageUploader");
const { format, isToday, isYesterday } = require("date-fns");
const Status = require("./models/status");

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

// cloudinary connect
cloudinaryConnect();

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

const formatDate = (date) => {
  const messageDate = new Date(date);

  if (isToday(messageDate)) {
    return "Today";
  } else if (isYesterday(messageDate)) {
    return "Yesterday";
  } else {
    return format(messageDate, "MMMM dd, yyyy");
  }
};

const scheduledTasks = new Map();

const scheduleStatusRemoval = async (statusId, user_id) => {
  try {
    const status = await Status.findById(statusId);
    if (status) {
      if (status?.filePath) {
        if (fs.existsSync(status?.filePath)) {
          fs.unlink(status?.filePath, (err) => {
            if (err) {
              console.error("Error deleting status:", err);
            }
            console.log("deleted from server directory");
          });
        }
      } else {
        let options = {
          resource_type: "image",
        };

        if (status?.type == "video") {
          options.resource_type = "video";
        }
        //delete from cloudinary
        const ID = status?.content.split("/").pop().split(".")[0];
        if (ID.includes("?") && ID.includes("=")) {
          console.log(`no image uploaded to cloudinary`);
        } else {
          try {
            console.log(`Deleting from media server...`, ID);
            // not using await as it add wait the thread , we can delete in background
            cloudinary.uploader
              .destroy(
                `${process.env.FOLDER_NAME}-status-${user_id}/${ID}`,
                options
              )
              .then((res) => console.log(res));
          } catch (error) {
            console.log(`Unable to delete profile pic from cloudinary`);
            console.log(error.message);
          }
        }
      }

      await status.remove();

      const user = await User.findById(user_id).populate(
        "friends",
        "socket_id"
      );

      // Emit a socket event to the user
      io.to(user?.socket_id).emit("statusRemoved", statusId);

      // Emit a socket event to each friend
      if (user && user.friends) {
        // Broadcast to all friends
        user.friends.forEach((friend) => {
          if (friend.socket_id) {
            io.to(friend.socket_id).emit("friendStatusRemoved", {
              userId: user?._id,
              statusId: statusId,
            });
          }
        });
      }
    }

    const timeoutId = scheduledTasks.get(statusId.toString());
    clearTimeout(timeoutId);
  } catch (err) {
    console.error("Error removing status:", err);
  }
};

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

    const existing_FriendRequest = await FriendRequest.find({
      sender: data.from,
      recipient: data.to,
    });

    if (existing_FriendRequest.length > 0) {
      console.log(existing_FriendRequest);
      io.to(to?.socket_id).emit("new_friend_request", {
        message: "New friend request received",
      });
      io.to(from?.socket_id).emit("request_sent", {
        message: "Request Sent successfully!",
      });
      return;
    }

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

    const from = request_doc.sender;
    const to = request_doc.recipient;

    const inverse_request_doc = await FriendRequest.find({
      sender: request_doc.recipient,
      recipient: request_doc.sender,
    });

    if(inverse_request_doc.length > 0){
      console.log("haggi aw",inverse_request_doc)
      await FriendRequest.findByIdAndDelete(inverse_request_doc[0]._id);
    }

    await FriendRequest.findByIdAndDelete(data.request_id);

    // delete this request doc
    // emit event to both of them

    // emit event request accepted to both
    io.to(sender?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
      id: to,
    });
    io.to(receiver?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
      id: from,
    });
  });

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    // *for chat list rendering
    const existing_conversations = await OneToOneMessage.find({
      participants: { $all: [user_id] },
    }).populate({
      path: "participants",
      select:
        "firstName lastName avatar _id email status about location statuses",
      populate: {
        path: "statuses",
        model: "Status",
        // select: "content createdAt", // Add any other fields you want to select from the Status model
      },
    });

    // db.books.find({ authors: { $elemMatch: { name: "John Smith" } } })

    const user = await User.findById(user_id);
    const pinnedChats = user?.pinnedChats || [];
    const deletedChats = user?.deletedChats || [];

    // console.log(existing_conversations);

    callback(existing_conversations, pinnedChats, deletedChats);
  });

  socket.on("start_conversation", async (data) => {
    //* new or exisiting conversation
    // data: {to: from:}

    const { to, from } = data;

    // check if there is any existing conversation

    const existing_conversations = await OneToOneMessage.find({
      participants: { $size: 2, $all: [to, from] },
    }).populate(
      "participants",
      "firstName lastName avatar _id email status about location"
    );

    // console.log(existing_conversations[0], "Existing Conversation");

    // if no => create a new OneToOneMessage doc & emit event "start_chat" & send conversation details as payload
    if (existing_conversations.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [to, from],
      });

      new_chat = await OneToOneMessage.findById(new_chat).populate(
        "participants",
        "firstName lastName avatar _id email status about location"
      );

      console.log(new_chat);

      socket.emit("start_chat", new_chat);
    }
    // if yes => just emit event "start_chat" & send conversation details as payload
    else {
      await User.findByIdAndUpdate(
        from,
        { $pull: { deletedChats: existing_conversations[0]?._id } }, // Remove the conversation ID from pinnedChats
        { new: true }
      );

      socket.emit("start_chat", existing_conversations[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      // const result = await OneToOneMessage.findById(
      //   data.conversation_id
      // ).select("messages");
      const page = 1;
      const limit = 10;
      const skip = (page - 1) * limit;
      const chat = await OneToOneMessage.findById(data.conversation_id);

      // chat.messages.reverse();

      // get those messages that are not deleted for me

      if (chat?.messages.length > 0) {
        const notDeletedMessages = chat?.messages.filter(
          (msg) => !msg.deletedFor.get(data.user_id)
        );

        if (notDeletedMessages.length > 0) {
          // console.log("lol");
          const messagesWithTimeLine = [];
          let lastTimeline = "";

          notDeletedMessages.forEach((message) => {
            const timelineText = formatDate(message.created_at);

            if (timelineText !== lastTimeline) {
              messagesWithTimeLine.push({
                type: "divider",
                text: timelineText,
                created_at: new Date(),
              });
              lastTimeline = timelineText;
            }

            messagesWithTimeLine.push(message);
          });

          messagesWithTimeLine.reverse(); // so that the lasted msg come to first

          const innerMap = new Map();
          innerMap.set(data.conversation_id, messagesWithTimeLine);
          oldMessages.set(data.user_id, innerMap); //cache for the use of fetching prv msg's

          const result = messagesWithTimeLine.slice(skip).slice(0, limit);
          // console.log(result)

          // console.log(result);

          // result.reverse();

          callback(result); //fire on frontend side
        } else {
          callback([{ subtype: "new", type: "msg", text: "no messages" }]); //fire on frontend side
        }
      }
      callback([{ subtype: "new", type: "msg", text: "no messages" }]); //fire on frontend side
    } catch (error) {
      console.log(error);
    }
  });

  // Handle incoming text/link messages
  socket.on("text_message", async (data) => {
    console.log("Received message:", data);

    // data: {to, from, text/link}

    const {
      message,
      conversation_id,
      from,
      to,
      type,
      replyToMsg,
      latitude,
      longitude,
      replyToMsgId,
    } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // message => {to, from, type, created_at, text, file}

    let new_message = null;
    // let currentConversationIdOfTo_User=null;

    if (to_user?.status == "Online") {
      // Emit an event to the frontend to get the current conversation ID
      // io.to(to_user.socket_id).emit("isSeen");

      // socket.on("currentConversationId", ({ currentConversationid }) => {
      //   currentConversationIdOfTo_User = currentConversationid;
      //   console.log("Received currentConversationId:", currentConversationIdOfTo_User);
      // });

      // console.log("hi",currentConversationIdOfTo_User)

      // if (currentConversationIdOfTo_User === conversation_id) {
      // new_message = {
      //   to: to,
      //   from: from,
      //   type: type,
      //   created_at: Date.now(),
      //   text: message,
      //   status: "Seen", // Update the status to Seen if the conversation IDs match
      // };
      // } else {
      new_message = {
        to: to,
        from: from,
        type: type,
        created_at: Date.now(),
        text: message,
        status: "Delivered", // Update the status to Delivered if the conversation IDs do not match
        replyToMsg: replyToMsg,
        replyToMsgId: replyToMsgId,
      };
      // }
    } else {
      new_message = {
        to: to,
        from: from,
        type: type,
        created_at: Date.now(),
        text: message,
        status: "Sent",
        replyToMsg: replyToMsg,
        replyToMsgId: replyToMsgId,
      };
    }

    if (latitude !== undefined && longitude !== undefined && type == "loc") {
      new_message.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    // fetch OneToOneMessage Doc & push a new message to existing conversation
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    // Increment the unreadCount for the recipient
    chat.unreadCount.set(to, (chat.unreadCount.get(to) || 0) + 1);
    // save to db`
    await chat.save({ new: true, validateModifiedOnly: true });

    // TODO create a room and subsscribe the uses to that rooms and them when we emit an event it would fire to all user joined to that room

    // emit to t incoming_message -user
    const savedMessage = chat.messages[chat.messages.length - 1]; //last saved msg
    const secondLastMessage = chat.messages[chat.messages.length - 2]; //last 2nd  msg for timeLine rendering purpose
    new_message._id = savedMessage._id;
    new_message.created_at = savedMessage.created_at;

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
      unread: chat.unreadCount.get(to),
      text: message, //for notification
      avatar:
        from_user?.avatar ||
        `https://api.dicebear.com/5.x/initials/svg?seed=${from_user?.firstName} ${from_user?.lastName}`, //for notification
      name: `${from_user?.firstName} ${from_user?.lastName}`, //for notification
      secondLastMessageCreated_at: secondLastMessage?.created_at, //for timeLine
    });

    // emit outgoing_message -> from user
    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
      secondLastMessageCreated_at: secondLastMessage?.created_at, //for timeLine
    });
  });

  // -------------------------file_message-----------------------------------------//
  // const fs = require("fs");
  // const path = require("path");

  // handle Media/Document Message
  socket.on("file_message", async (fileData, callback) => {
    // console.log("Received file message:", fileData, "dir", __dirname);

    // const uploadsDir = path.join(__dirname, "uploads");

    // Ensure the uploads directory exists
    // if (!fs.existsSync(uploadsDir)) {
    //   fs.mkdirSync(uploadsDir);
    // }
    // const buffer = Buffer.from(fileData.data);
    // const timestamp = Date.now();
    // const fileName = `${timestamp}-${fileData.name}`;
    // const filePath = path.join(uploadsDir, fileName);

    // fs.writeFileSync(filePath, buffer);

    // data: {to, from, text, file}
    const { conversation_id, to, from, type, msg, mediaUrl, filePath } =
      fileData;
    // let mediaUrl = null;

    // if (filePath) {
    //   const cloud = await uploadImageToCloudinary(
    //     filePath,
    //     `${process.env.FOLDER_NAME}-${conversation_id}`,
    //     1000,
    //     1000
    //   );
    //   mediaUrl = cloud.secure_url;
    // }

    // fs.unlinkSync(filePath); // Clean up the temporary file

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    let new_message = null;

    if (to_user?.status == "Online") {
      new_message = {
        to: to,
        from: from,
        type: type,
        created_at: Date.now(),
        text: msg ? msg : fileData.name,
        status: "Delivered", // Update the status to Delivered if the conversation IDs do not match
        file: mediaUrl,
        filePath: filePath,
      };
      // }
    } else {
      new_message = {
        to: to,
        from: from,
        type: type,
        created_at: Date.now(),
        text: msg ? msg : fileData.name,
        status: "Sent",
        file: mediaUrl,
        filePath: filePath,
      };
    }

    // fetch OneToOneMessage Doc & push a new message to existing conversation
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    // Increment the unreadCount for the recipient
    chat.unreadCount.set(to, (chat.unreadCount.get(to) || 0) + 1);
    // save to db`
    await chat.save({ new: true, validateModifiedOnly: true });

    // TODO create a room and subsscribe the uses to that rooms and them when we emit an event it would fire to all user joined to that room

    // emit to t incoming_message -user
    const savedMessage = chat.messages[chat.messages.length - 1];
    const secondLastMessage = chat.messages[chat.messages.length - 2]; //last 2nd  msg for timeLine rendering purpose
    new_message._id = savedMessage._id;
    new_message.created_at = savedMessage.created_at;

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
      unread: chat.unreadCount.get(to),
      text: msg ? msg : fileData.name,
      avatar:
        from_user?.avatar ||
        `https://api.dicebear.com/5.x/initials/svg?seed=${from_user?.firstName} ${from_user?.lastName}`,
      name: `${from_user?.firstName} ${from_user?.lastName}`,
      secondLastMessageCreated_at: secondLastMessage?.created_at, //for timeLine
    });

    // emit outgoing_message -> from user
    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
      secondLastMessageCreated_at: secondLastMessage?.created_at, //for timeLine
    });

    // // Get the file extension
    // const fileExtension = path.extname(data.file.name);

    // // Generate a unique filename
    // const filename = `${Date.now()}_${Math.floor(
    //   Math.random() * 10000
    // )}${fileExtension}`;

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

  // ---------------------------markMessagesDelivered----------------------------//

  socket.on("markMessagesDelivered", async (data) => {
    let userId = data.current_id;
    console.log("userObjectId........", userId);

    // if (!ObjectId.isValid(data?.userId)) {
    //   console.error(`Invalid user ID: ${userId}`);
    //   return;
    // }

    // const userObjectId = new ObjectId(userId);

    try {
      // Find all messages where the user is a participant
      const conversations = await OneToOneMessage.find({
        participants: userId,
      });

      for (let conversation of conversations) {
        let updateRequired = false; // Track if any message statuses are updated
        // let sendersToNotify = conversation.messages.from; // To collect unique sender IDs

        // Update message statuses and collect sender IDs
        for (let message of conversation.messages) {
          if (message.to.equals(userId) && message.status === "Sent") {
            message.status = "Delivered";
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
            io.to(sender.socket_id).emit(
              "messagesDelivered",
              conversation?._id
            );
          }
        }
      }
    } catch (err) {
      console.error(`Error updating message statuses: ${err.message}`);
    }
  });

  // ----------------------------markMsgAsSeen---------------------------------------//

  socket.on("markMsgAsSeen", async ({ conversationId, sender_id, user_id }) => {
    try {
      // Find the conversation by ID
      const conversation = await OneToOneMessage.findById(conversationId);

      if (!conversation) {
        console.error(`Conversation not found: ${conversationId}`);
        return;
      }

      conversation.unreadCount.set(user_id, 0);
      await conversation.save({ new: true, validateModifiedOnly: true });

      // Update message statuses to 'Seen' if they are 'Sent' or 'Delivered'
      let updateRequired = false;
      for (let message of conversation.messages) {
        if (message.status === "Sent" || message.status === "Delivered") {
          message.status = "Seen";
          updateRequired = true;
        }
      }

      // Save the updated conversation to the database
      if (updateRequired) {
        await conversation.save({ validateModifiedOnly: true });
      }

      const sender = await User.findById(sender_id);
      const receiver = await User.findById(user_id);

      // Notify senders about the Seen status
      if (sender && sender.socket_id) {
        io.to(sender.socket_id).emit("messagesSeen", conversationId);
      }

      // notify the receiver to update it unread
      if (receiver && receiver.socket_id) {
        io.to(receiver.socket_id).emit("updateUnread", conversationId);
      }
    } catch (error) {
      console.log(error);
    }
  });

  // *----------------------------Reacting Msg---------------------------------------//
  socket.on("react_to_message", async (data) => {
    const { conversationId, to, from, messageId, reaction } = data;

    try {
      // Find the conversation by ID
      const conversation = await OneToOneMessage.findById(conversationId);

      if (conversation) {
        // Find the message by ID
        const message = conversation.messages.id(messageId);

        if (message) {
          // Update the message with the new reaction
          message.reaction.set(from, reaction);
          await conversation.save({ new: true });

          const updatedReaction = message?.reaction;

          // updatating sanpshot data
          oldMessages
            ?.get(to.toString())
            ?.get(conversationId.toString())
            .forEach((el) => {
              if (el?._id == messageId) {
                el?.reaction.set(from, reaction);
              }
            });

          // console.log("cc",oldMessages?.get(to.toString())?.get(conversationId.toString()).find( el=> el?._id == messageId))

          const to_user = await User.findById(to);
          const from_user = await User.findById(from);

          // Emit an event to the recipient to update their UI
          io.to(to_user?.socket_id).emit("message_reacted", {
            conversationId,
            messageId,
            updatedReaction,
          });
          io.to(from_user?.socket_id).emit("message_reacted", {
            conversationId,
            messageId,
            updatedReaction,
          });
        } else {
          console.error("Message not found");
        }
      } else {
        console.error("Conversation not found");
      }
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  });

  // *------------------updateDeleteForEveryoneToFalseg Msg------------------------//

  socket.on("updateDeleteForEveryoneToFalse", async (data, callback) => {
    try {
      const { conversationId, messageId } = data;

      const conversation = await OneToOneMessage.findById(conversationId);
      if (!conversation) {
        console.log(
          "no conversation found in the updateDeleteForEveryoneToFalse event"
        );
      }

      const message = conversation.messages.id(messageId);
      if (!message) {
        console.log(
          "no messages found in the updateDeleteForEveryoneToFalse event"
        );
      }

      message.deletedForEveryone = false;

      await conversation.save({ new: true });

      callback(conversationId); //fire on frontend side
    } catch (error) {
      console.log(error);
    }
  });

  // *----------------------------deleteForEveryone---------------------------------------//
  socket.on("deleteForEveryone", async (data) => {
    const { conversationId, to, from, messageId } = data;

    try {
      // Find the conversation by ID
      const conversation = await OneToOneMessage.findById(conversationId);

      const to_user = await User.findById(to);
      const from_user = await User.findById(from);

      if (conversation) {
        // Find the message by ID
        const message = conversation.messages.id(messageId);

        if (message) {
          if (message.type == "live-loc") {
            from_user.isLiveLocationSharing = false;
            await from_user.save({ new: true });
            io.to(to_user?.socket_id).emit("liveLocEnded", {
              conversationId,
              messageId: messageId,
              from: from,
            });

            // emit outgoing_message -> from user
            io.to(from_user?.socket_id).emit("liveLocEnded", {
              conversationId,
              messageId: messageId,
              from: from,
            });
          }

          if (message?.file) {
            if (message?.filePath) {
              if (fs.existsSync(message?.filePath)) {
                fs.unlink(message?.filePath, (err) => {
                  if (err) {
                    console.error("Error deleting file:", err);
                  }
                  console.log("deleted from server directory");
                });
              } else {
                console.log("directory doesnot exist");
              }
            } else {
              let options = {
                resource_type: "image",
              };

              if (message?.type == "video" || message?.type == "audio") {
                options.resource_type = "video";
              }
              //delete from cloudinary
              const ID = message?.file.split("/").pop().split(".")[0];
              if (ID.includes("?") && ID.includes("=")) {
                console.log(`no image uploaded to cloudinary`);
              } else {
                try {
                  console.log(`Deleting from media server...`, ID);
                  // not using await as it add wait the thread , we can delete in background
                  cloudinary.uploader
                    .destroy(
                      `${process.env.FOLDER_NAME}-${conversationId}/${ID}`,
                      options
                    )
                    .then((res) => console.log(res));
                } catch (error) {
                  console.log(`Unable to delete profile pic from cloudinary`);
                  console.log(error.message);
                }
              }
            }
          }

          // Update message fields
          message.star = {}; // Set star to empty object
          message.reaction = {}; // Set reaction to empty object
          message.deletedForEveryone = false; // Set deletedForEveryone to true
          message.type = "deleted"; //*Imp
          message.text = null;
          message.file = null;
          message.status = "Seen";
          message.replyToMsg = null;
          message.isLiveLocationSharing = false;
          (message.watchId = null), await conversation.save({ new: true });

          // Emit an event to the recipient to update their UI
          io.to(to_user?.socket_id).emit("message_deleteForEveryone", {
            conversationId,
            messageId,
          });
          io.to(from_user?.socket_id).emit("message_deleteForEveryone", {
            conversationId,
            messageId,
          });
        } else {
          console.error("Message not found");
        }

        // console.log("cc",oldMessages?.get(to.toString())?.get(conversationId.toString()).find( el=> el?._id == messageId))

        oldMessages
          ?.get(to.toString())
          ?.get(conversationId.toString())
          .forEach((el) => {
            if (el?._id == messageId) {
              el.star = {}; // Set star to empty object
              el.reaction = {}; // Set reaction to empty object
              el.deletedForEveryone = false; // Set deletedForEveryone to true
              el.type = "deleted"; //*Imp
              el.text = null;
              el.file = null;
              el.status = "Seen";
              el.replyToMsg = null;
              el.isLiveLocationSharing = false;
              el.watchId = null;
            }
          });

        // console.log("cc",oldMessages?.get(to.toString())?.get(conversationId.toString()).find( el=> el?._id == messageId))
      } else {
        console.error("Conversation not found");
      }
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  });

  socket.on("updateTyping", async (data) => {
    const { conversationId, to, from, typing } = data;

    try {
      // Find the conversation by ID
      const conversation = await OneToOneMessage.findById(conversationId);

      if (conversation) {
        // Update the typing status for the user
        conversation?.typing.set(from, typing);

        await conversation.save({ new: true });

        const to_user = await User.findById(to);

        // Emit an event to the recipient to update their UI
        io.to(to_user?.socket_id).emit("updatetyping", {
          conversationId,
          typing,
        });
      } else {
        console.log("Conversation not found");
      }
    } catch (error) {
      console.error("Error updating typing", error);
    }
  });

  // *------------------------------------------------------------------
  socket.on("updateRecordingAudio", async (data) => {
    const { conversationId, to, from, recordingAudio } = data;

    try {
      // Find the conversation by ID
      const conversation = await OneToOneMessage.findById(conversationId);

      if (conversation) {
        // Update the typing status for the user
        conversation?.recordingAudio.set(from, recordingAudio);

        await conversation.save({ new: true });

        const to_user = await User.findById(to);

        // Emit an event to the recipient to update their UI
        io.to(to_user?.socket_id).emit("updateRecordingAudio", {
          conversationId,
          recordingAudio,
        });
      } else {
        console.log("Conversation not found");
      }
    } catch (error) {
      console.error("Error updating recordingAudio", error);
    }
  });

  // *------------------------------------------------------------------
  socket.on("liveLocationMsg", async (data) => {
    // console.log("Received message:", data);

    // data: {to, from, text/link}

    const {
      conversation_id,
      from,
      to,
      type,
      replyToMsg,
      latitude,
      longitude,
      watchId,
    } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    const isLiveLocation = from_user?.isLiveLocationSharing;

    // updating location of from user
    from_user.isLiveLocationSharing = true;
    from_user.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    await from_user.save({ new: true, validateModifiedOnly: true });

    io.to(to_user?.socket_id).emit("updateCoordinates", {
      conversation_id,
      coordinates: [longitude, latitude],
    });

    io.to(from_user?.socket_id).emit("updateUser", {
      location: from_user?.location,
      isLiveLocationSharing: true,
    });

    if (!isLiveLocation) {
      console.log("inside", isLiveLocation);
      let new_message = null;

      if (to_user?.status == "Online") {
        new_message = {
          to: to,
          from: from,
          type: type,
          created_at: Date.now(),
          text: "live location",
          status: "Delivered", // Update the status to Delivered if the conversation IDs do not match
          replyToMsg: replyToMsg,
          isLiveLocationSharing: true,
          watchId: watchId,
        };
        // }
      } else {
        new_message = {
          to: to,
          from: from,
          type: type,
          created_at: Date.now(),
          text: "live location",
          status: "Sent",
          replyToMsg: replyToMsg,
          isLiveLocationSharing: true,
          watchId: watchId,
        };
      }

      // fetch OneToOneMessage Doc & push a new message to existing conversation
      const chat = await OneToOneMessage.findById(conversation_id);
      chat.messages.push(new_message);
      // Increment the unreadCount for the recipient
      chat.unreadCount.set(to, (chat.unreadCount.get(to) || 0) + 1);
      // save to db`
      await chat.save({ new: true, validateModifiedOnly: true });
      // emit to  incoming_message -user
      const savedMessage = chat.messages[chat.messages.length - 1]; //last saved msg
      const secondLastMessage = chat.messages[chat.messages.length - 2]; //last 2nd  msg for timeLine rendering purpose
      new_message._id = savedMessage._id;
      new_message.created_at = savedMessage.created_at;

      io.to(to_user?.socket_id).emit("new_message", {
        conversation_id,
        message: new_message,
        unread: chat.unreadCount.get(to),
        text: "live location", //for notification
        avatar:
          from_user?.avatar ||
          `https://api.dicebear.com/5.x/initials/svg?seed=${from_user?.firstName} ${from_user?.lastName}`, //for notification
        name: `${from_user?.firstName} ${from_user?.lastName}`, //for notification
        secondLastMessageCreated_at: secondLastMessage?.created_at, //for timeLine
      });

      // emit outgoing_message -> from user
      io.to(from_user?.socket_id).emit("new_message", {
        conversation_id,
        message: new_message,
        secondLastMessageCreated_at: secondLastMessage?.created_at, //for timeLine
      });
    }
  });

  // *------------------------------------------------------------------
  socket.on("liveLocEnded", async (data) => {
    const { conversationId, from, to, messageId } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // updating location of from user
    from_user.isLiveLocationSharing = false;
    // from_user.location= {
    //   type: "Point",
    //   coordinates: [longitude, latitude],
    // }

    await from_user.save({ new: true, validateModifiedOnly: true });

    const conversation = await OneToOneMessage.findById(conversationId);
    if (!conversation) {
      console.log("no conversation found");
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      console.log("no messages found");
    }

    message.isLiveLocationSharing = false;
    message.watchId = null;

    await conversation.save({ new: true });

    // update sanpshot
    oldMessages
      ?.get(to.toString())
      ?.get(conversationId.toString())
      .forEach((el) => {
        if (el?._id == messageId) {
          (el.isLiveLocationSharing = false), (el.watchId = null);
        }
      });

    io.to(to_user?.socket_id).emit("liveLocEnded", {
      conversationId,
      messageId: messageId,
      from: from,
    });

    // emit outgoing_message -> from user
    io.to(from_user?.socket_id).emit("liveLocEnded", {
      conversationId,
      messageId: messageId,
      from: from,
    });
  });

  // *----------------------------status---------------------------------------//
  socket.on("addStatus", async (data) => {
    const { user_id, type, mediaUrl, filePath } = data;

    try {
      const newStatus = new Status({
        userId: user_id,
        content: mediaUrl,
        type: type,
        filePath: filePath,
      });
      await newStatus.save();

      // Add the status ID to the user's statuses array
      const user = await User.findByIdAndUpdate(
        user_id,
        { $push: { statuses: newStatus._id } },
        { new: true }
      ).populate("friends", "socket_id");

      // Emit a socket event to the user
      // todo check for online?
      io.to(user?.socket_id).emit("statusAdded", newStatus);

      // Emit a socket event to each friend
      if (user && user.friends) {
        // Broadcast to all friends
        user.friends.forEach((friend) => {
          if (friend.socket_id) {
            io.to(friend.socket_id).emit("friendStatusAdded", {
              userId: user_id,
              status: newStatus,
            });
          }
        });
      }

      // Schedule the status removal after 24 hours
      // const delay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const delay = 1 * 60 * 1000; // 2 min in milliseconds

      // Schedule the task
      const timeoutId = setTimeout(() => {
        scheduleStatusRemoval(newStatus._id, user_id);
      }, delay);

      scheduledTasks.set(newStatus._id.toString(), timeoutId);
    } catch (err) {
      console.log("Inside addStatus", err.message);
    }
  });

  // *----------------------------status---------------------------------------//

  socket.on("deleteStatus", async (data) => {
    const { user_id, statusId } = data;

    try {
      const status = await Status.findById(statusId);
      if (status) {
        if (status?.filePath) {
          if (fs.existsSync(status?.filePath)) {
            fs.unlink(status?.filePath, (err) => {
              if (err) {
                console.error("Error deleting status:", err);
              }
              console.log("deleted from server directory");
            });
          }
        } else {
          let options = {
            resource_type: "image",
          };

          if (status?.type == "video") {
            options.resource_type = "video";
          }
          //delete from cloudinary
          const ID = status?.content.split("/").pop().split(".")[0];
          if (ID.includes("?") && ID.includes("=")) {
            console.log(`no image uploaded to cloudinary`);
          } else {
            try {
              console.log(`Deleting from media server...`, ID);
              // not using await as it add wait the thread , we can delete in background
              cloudinary.uploader
                .destroy(
                  `${process.env.FOLDER_NAME}-status-${user_id}/${ID}`,
                  options
                )
                .then((res) => console.log(res));
            } catch (error) {
              console.log(`Unable to delete profile pic from cloudinary`);
              console.log(error.message);
            }
          }
        }

        await status.remove();

        const user = await User.findById(user_id).populate(
          "friends",
          "socket_id"
        );

        // Emit a socket event to the user
        io.to(user?.socket_id).emit("statusRemoved", statusId);

        // Emit a socket event to each friend
        if (user && user.friends) {
          // Broadcast to all friends
          user.friends.forEach((friend) => {
            if (friend.socket_id) {
              io.to(friend.socket_id).emit("friendStatusRemoved", {
                userId: user?._id,
                statusId: statusId,
              });
            }
          });
        }
      }

      const timeoutId = scheduledTasks.get(statusId.toString());
      clearTimeout(timeoutId);
    } catch (err) {
      console.error("Error removing status:", err);
    }
  });

  // *----------------------------status---------------------------------------//

  socket.on("removeFriend", async (data) => {
    const { from, to } = data;

    try {

      const sender = await User.findByIdAndUpdate(
        from,
        { $pull: { friends: to } },
        { new: true }
      );

      const receiver = await User.findByIdAndUpdate(
        to,
        { $pull: { friends: from } },
        { new: true }
      );

      io.to(sender?.socket_id).emit("removedFriend", {
        id: to,
      });
      io.to(receiver?.socket_id).emit("removedFriend", {
        id: from,
      });
    } catch (error) {}
  });

  // *-------------- HANDLE AUDIO CALL SOCKET EVENTS ----------------- //

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
      oldMessages.delete(data.user_id);
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
