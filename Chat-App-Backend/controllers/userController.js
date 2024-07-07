const AudioCall = require("../models/audioCall");
const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const VideoCall = require("../models/videoCall");
const OneToOneMessage = require("../models/OneToOneMessage");
const catchAsync = require("../utils/catchAsync");
const filterObj = require("../utils/filterObj");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

const { generateToken04 } = require("./zegoServerAssistant");

const { oldMessages } = require("../server");

// Please change appID to your appId, appid is a number
// Example: 1234567890
const appID = process.env.ZEGO_APP_ID; // type: number

// Please change serverSecret to your serverSecret, serverSecret is string
// Example：'sdfsdfsd323sdfsdf'
const serverSecret = process.env.ZEGO_SERVER_SECRET; // type: 32 byte length string

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,//as added while jwt verification
  });
});

exports.lastSeen = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).json({ lastSeen: user?.lastSeen });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // const filteredBody = filterObj(
  //   req.body,
  //   "firstName",
  //   "lastName",
  //   "about",
  //   "avatar"
  // );

  const { firstName, about }= req.body;
  if(!firstName && !about){
    return res.status(400).json({
      status:"Error",
      Message:'All fields are required'
    })
  }
  const file = req.files?.file;

  let mediaUrl = null;

  if(file){
    const cloud = await uploadImageToCloudinary(
      file,
      `${process.env.FOLDER_NAME}-${req.user._id}-avatar`,
      1000,
      1000
    );
    mediaUrl = cloud.secure_url;
  }

  const userDoc = await User.findByIdAndUpdate(req.user._id, {
    firstName,
    about,
    avatar: mediaUrl,
  },{new:true});

  res.status(200).json({
    status: "success",
    data: userDoc,
    message: "User Updated successfully",
  });
});

exports.upload = async (req, res) => {
  try {
    // console.log(req.body.conversation_id);
    // console.log(req.files.file)
    // fetch the data from req
    const { conversation_id } = req.body;

    const file = req.files.file;
    //  the imageFile represent the key/name of the  file that is snet in http request
    console.log(file);

    let mediaUrl = null;

    const cloud = await uploadImageToCloudinary(
      file,
      `${process.env.FOLDER_NAME}-${conversation_id}`,
      1000,
      1000
    );
    mediaUrl = cloud.secure_url;

    res.status(200).json({
      success: true,
      mediaUrl: mediaUrl,
      message: "uploaded successfully to cloudinary",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUsers = catchAsync(async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const this_user = req.user; //it is _id

  const remaining_users = all_users.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString() //exclude all the friends of a user and also exclude the user itself
  );

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users Fetched successfully!",
  });
});

exports.getAllVerifiedUsers = catchAsync(async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const remaining_users = all_users.filter(
    (user) => user._id.toString() !== req.user._id.toString()
  );

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
});

exports.getRequests = catchAsync(async (req, res, next) => {
  const requests = await FriendRequest.find({ recipient: req.user._id })
    .populate("sender")
    .select("_id firstName lastName");

  res.status(200).json({
    status: "success",
    data: requests,
    message: "Requests found successfully!",
  });
});

exports.getFriends = catchAsync(async (req, res, next) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );
  res.status(200).json({
    status: "success",
    data: this_user.friends,
    message: "Friends found successfully!",
  });
});

/**
 * Authorization authentication token generation
 */

exports.generateZegoToken = catchAsync(async (req, res, next) => {
  try {
    const { userId, room_id } = req.body;

    console.log(userId, room_id, "from generate zego token");

    const effectiveTimeInSeconds = 3600; //type: number; unit: s; token expiration time, unit: second
    const payloadObject = {
      room_id, // Please modify to the user's roomID
      // The token generated allows loginRoom (login room) action
      // The token generated in this example allows publishStream (push stream) action
      privilege: {
        1: 1, // loginRoom: 1 pass , 0 not pass
        2: 1, // publishStream: 1 pass , 0 not pass
      },
      stream_id_list: null,
    }; //
    const payload = JSON.stringify(payloadObject);
    // Build token
    const token = generateToken04(
      appID * 1, // APP ID NEEDS TO BE A NUMBER
      userId,
      serverSecret,
      effectiveTimeInSeconds,
      payload
    );
    res.status(200).json({
      status: "success",
      message: "Token generated successfully",
      token,
    });
  } catch (err) {
    console.log(err);
  }
});

exports.startAudioCall = catchAsync(async (req, res, next) => {
  const from = req.user._id;
  const to = req.body.id;

  const from_user = await User.findById(from);
  const to_user = await User.findById(to);

  // create a new call audioCall Doc and send required data to client
  const new_audio_call = await AudioCall.create({
    participants: [from, to],
    from,
    to,
    status: "Ongoing",
  });

  res.status(200).json({
    data: {
      from: to_user,
      roomID: new_audio_call._id,
      streamID: to,
      userID: from,
      userName: from,
    },
  });
});

exports.startVideoCall = catchAsync(async (req, res, next) => {
  const from = req.user._id;
  const to = req.body.id;

  const from_user = await User.findById(from);
  const to_user = await User.findById(to);

  // create a new call videoCall Doc and send required data to client
  const new_video_call = await VideoCall.create({
    participants: [from, to],
    from,
    to,
    status: "Ongoing",
  });

  res.status(200).json({
    data: {
      from: to_user,
      roomID: new_video_call._id,
      streamID: to,
      userID: from,
      userName: from,
    },
  });
});

exports.getCallLogs = catchAsync(async (req, res, next) => {
  const user_id = req.user._id;

  const call_logs = [];

  const audio_calls = await AudioCall.find({
    participants: { $all: [user_id] },
  }).populate("from to");

  const video_calls = await VideoCall.find({
    participants: { $all: [user_id] },
  }).populate("from to");

  console.log(audio_calls, video_calls);

  for (let elm of audio_calls) {
    const missed = elm.verdict !== "Accepted";
    if (elm.from._id.toString() === user_id.toString()) {
      const other_user = elm.to;

      // outgoing
      call_logs.push({
        id: elm._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    } else {
      // incoming
      const other_user = elm.from;

      // outgoing
      call_logs.push({
        id: elm._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    }
  }

  for (let element of video_calls) {
    const missed = element.verdict !== "Accepted";
    if (element.from._id.toString() === user_id.toString()) {
      const other_user = element.to;

      // outgoing
      call_logs.push({
        id: element._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    } else {
      // incoming
      const other_user = element.from;

      // outgoing
      call_logs.push({
        id: element._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Call Logs Found successfully!",
    data: call_logs,
  });
});


exports.pin = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming you have user authentication and can get the user ID from the request
    const conversationId = req.params.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { pinnedChats: conversationId } }, // Add to set ensures no duplicates
      { new: true }
    );
    
    res.status(200).json(user.pinnedChats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin conversation' });
  }
});


exports.unpin = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication and can get the user ID from the request
    const conversationId = req.params.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { pinnedChats: conversationId } }, // Remove the conversation ID from pinnedChats
      { new: true }
    );
    
    res.status(200).json(user.pinnedChats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unpin conversation' });
  }
});


exports.star = catchAsync(async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.params;
    const { star } = req.body;
    const userId = req.user.id; 

    const conversation = await OneToOneMessage.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = conversation.messages.id(messageId);//Mongoose method to find a subdocument

    if (!message) { 
      return res.status(404).json({ error:'Message not found' });
    }

    // Update the star status for the user
    message.star.set(userId, star);

    await conversation.save();

    res.status(200).json({ success: true, message: 'Star status updated as ',star });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error',message: error.message });
  }
});


exports.fetchMsg = catchAsync(async (req, res, next) => {
  try {
    const { conversationId, page } = req.params;
    const userId = req.user.id; 
    console.log('page',page,conversationId)

    // if(!oldMessages.has(userId)){
    //   const innerMap = new Map();
    //   console.log('inside if')
    //   const chat = await OneToOneMessage.findById(conversationId);
    //   if (!chat) {
    //     return res.status(404).json({ error: 'Conversation not found' });
    //   }
    //   chat.messages.reverse();
    //   innerMap.set(conversationId,chat.messages);
    //   oldMessages.set(userId, innerMap);
    // }

      const limit = 10;
      const skip = (page - 1) * limit;  

      const innerMap = oldMessages.get(userId);
      if(!innerMap){
        console.log('not innermap',innerMap)
      }
      const messages = innerMap.get(conversationId);
      if(!messages){
        console.log("not messages",messages)
      }for (const key of oldMessages.get(userId).keys()) {
        console.log(key);
      }
      const result = messages.slice(skip).slice(0, limit);
      // console.log(result)

    res.status(200).json({ success: true, message: `messages fetch for page=${page}`,data:result });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error',message: error.message });
  }
});


exports.fetchStarMsg = catchAsync(async (req, res, next) => {
  try {
    const { conversationID } = req.params;

    const userId = req.user._id;

    const conversation = await OneToOneMessage.findById(conversationID);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = conversation.messages;

    if (!message) { 
      return res.status(404).json({ error:'Message not found' });
    }

    const result = message.filter( msg => msg.star.get(userId) === true)

    res.status(200).json({ success: true, message: 'Star messages fetched',data: result });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error',message: error.message });
  }
});



exports.fetchMediaMsg = catchAsync(async (req, res, next) => {
  try {
    const { conversationID } = req.params;

    const userId = req.user._id;

    const conversation = await OneToOneMessage.findById(conversationID);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = conversation.messages;

    if (!message) { 
      return res.status(404).json({ error:'Message not found' });
    }

    const imageVideoMsg = message.filter( msg => msg.type === 'img' || msg.type === 'video');
    const linkMsg = message.filter( msg => msg.type === 'Link');
    const docMsg = message.filter( msg => msg.type === 'doc');

    res.status(200).json({ success: true, message: 'Star messages fetched',imageVideoMsg: imageVideoMsg, linkMsg:linkMsg, docMsg:docMsg  });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error',message: error.message });
  }
});



exports.deleteMessageForUser = catchAsync(async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.user._id;

    const conversation = await OneToOneMessage.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.deletedFor.set(userId, true);
    
    // set the star to false
    message.star.set(userId,false);

    await conversation.save({ new: true });

    res.status(200).json({ success: true, message: 'Message deleted for user' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});



