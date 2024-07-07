import React, { useEffect, useRef } from "react";
import { Stack } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import useResponsive from "../../hooks/useResponsive";
import SideNav from "./SideBar";
import { useDispatch, useSelector } from "react-redux";
import {
  FetchUserProfile,
  SelectConversation,
  showSnackbar,
} from "../../redux/slices/app";
import { socket, connectSocket } from "../../socket";
import {
  UpdateDirectConversation,
  AddDirectConversation,
  AddDirectMessage,
  UpdateConversationForNewMessage,
  UpdateMessageStatus,
  UpdateConversationUnread,
  UpdateMessagesForReaction,
} from "../../redux/slices/conversation";
import AudioCallNotification from "../../sections/Dashboard/Audio/CallNotification";
import VideoCallNotification from "../../sections/Dashboard/video/CallNotification";
import {
  PushToAudioCallQueue,
  UpdateAudioCallDialog,
} from "../../redux/slices/audioCall";
import AudioCallDialog from "../../sections/Dashboard/Audio/CallDialog";
import VideoCallDialog from "../../sections/Dashboard/video/CallDialog";
import {
  PushToVideoCallQueue,
  UpdateVideoCallDialog,
} from "../../redux/slices/videoCall";
import {
  UpdateConversationOnlineStatus,
  UpdateCurrent_conversationOnlineStatus,
} from "../../redux/slices/conversation";

const DashboardLayout = () => {
  const isDesktop = useResponsive("up", "md");
  const dispatch = useDispatch();
  const { user_id } = useSelector((state) => state.auth);
  const { open_audio_notification_dialog, open_audio_dialog } = useSelector(
    (state) => state.audioCall
  );
  const { open_video_notification_dialog, open_video_dialog } = useSelector(
    (state) => state.videoCall
  );
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { conversations, current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const current_id = useSelector((state) => state.app.user._id);
  const currentMsg = useSelector(
    (state) => state.conversation.direct_chat.current_messages
  );

  // Using useRef to keep a mutable reference
  const currentConversationUserIDRef = useRef(current_conversation?.user_id);
  const currentConversationIDRef = useRef(current_conversation?.id);
  const concersationsRef = useRef(conversations);
  const current_idRef = useRef(current_id);
  const currentMsgRef = useRef(currentMsg);
  const socketRef = useRef(socket);
  console.log(currentMsgRef.current);

  // Update the ref whenever current_conversation changes
  useEffect(() => {
    currentConversationUserIDRef.current = current_conversation?.user_id;
    currentConversationIDRef.current = current_conversation?.id;
    concersationsRef.current = conversations;
    currentMsgRef.current = currentMsg;

    console.log("changed Id", currentConversationIDRef.current);
    console.log("changed userId", currentConversationUserIDRef.current);
    console.log("changed conversations", concersationsRef.current);
  }, [current_conversation]);

  useEffect(() => {
    dispatch(FetchUserProfile());
  }, []);

  useEffect(() => {
    currentMsgRef.current = currentMsg;
    const currentMsgs = currentMsgRef.current;
    const conversationId = currentConversationIDRef.current;
    const sender_id = currentConversationUserIDRef.current;
    const lastMessageIsFromOtherUser =
      currentMsgs.length &&
      currentMsgs[currentMsg.length - 1]?.outgoing === false &&
      currentMsgs[currentMsg.length - 1]?.status != "Seen";

    if (!socket) {
      connectSocket(user_id);
      console.log("socket-connected");
    }

    console.log(
      "cal...",
      sender_id,
      lastMessageIsFromOtherUser,
      currentMsgs[currentMsgs.length - 1]
    );
    if (lastMessageIsFromOtherUser && socket) {
      console.log("calling...");
      socket.emit("markMsgAsSeen", {
        conversationId: conversationId,
        sender_id: sender_id,
        user_id: user_id,
      });
    }
  }, [socket, currentMsg, current_conversation]);

  const handleCloseAudioDialog = () => {
    dispatch(UpdateAudioCallDialog({ state: false }));
  };
  const handleCloseVideoDialog = () => {
    dispatch(UpdateVideoCallDialog({ state: false }));
  };

  useEffect(() => {
    if (isLoggedIn) {
      window.onload = function () {
        if (!window.location.hash) {
          window.location = window.location + "#loaded";
          window.location.reload();
        }
      };

      window.onload();

      if (!socket) {
        connectSocket(user_id);
        console.log("socket-connected");
      }

      // !!!!!!!!!!!!!!!!!!!!!
      const current_id = current_idRef.current; //it is current user's _id
      if (isLoggedIn && current_id != undefined) {
        console.log("ll", current_id);

        socket.emit("markMessagesDelivered", { current_id });
      }

      socket.on("audio_call_notification", (data) => {
        // TODO => dispatch an action to add this in call_queue
        dispatch(PushToAudioCallQueue(data));
      });

      socket.on("video_call_notification", (data) => {
        // TODO => dispatch an action to add this in call_queue
        dispatch(PushToVideoCallQueue(data));
      });

      socket.on("new_message", async (data) => {
        const currentConversationID = currentConversationIDRef.current;
        const message = data.message;
        console.log("current_conversation", current_conversation, "data", data);
        // check if msg we got is from currently selected conversation

        // const reaction = message?.reaction;
        let myReaction = null;
        let otherReaction = null;

        // if(reaction){
        //   Object.keys(reaction).forEach((key) => {
        //     if (key === user_id.toString()) {
        //       myReaction = reaction[key];
        //     } else {
        //       otherReaction = reaction[key];
        //     }
        //   });
        // }

        const formatTimeTo24Hrs = (dateString) => {
          const date = new Date(dateString);
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        };

        const time = formatTimeTo24Hrs(message?.created_at);

        if (currentConversationID === data.conversation_id) {

          
          dispatch(
            AddDirectMessage({
              id: message._id,
              type: "msg",
              subtype: message.type,
              message: message.text,
              incoming: message.to === user_id,
              outgoing: message.from === user_id,
              status: message?.status,
              src: message?.file,
              replyToMsg: message?.replyToMsg,
              myReaction: myReaction,
              otherReaction: otherReaction,
              time: time || "9:36",
            })
          );
        }

        let conversation = {
          _id: data.conversation_id,
          messages: data.message,
          unread: data.unread,
          time: time,
        };

        dispatch(UpdateConversationForNewMessage({ conversation })); //for the conversations list
        // !!!!!!!!!!!!!!!!!!!!!!!
        // const conversationIds =[]
        // conversationIds[0]=data.conversation_id
        // await socket.emit('markMessagesDelivered', { current_id , conversationIds });

        console.log("new message pushed to current_message");
        // after pushing new message to the current_message state variable the Message.jsx component is rerendered and all the current_messages are agian rerendered
      });

      socket.on("start_chat", (data) => {
        // console.log("data",data.messages[data.messages.length - 1].text );
        const Conversations = concersationsRef.current;
        // add / update to conversation list
        const existing_conversation = Conversations.find(
          (el) => el?.id === data._id
        );
        if (existing_conversation) {
          // update direct conversation
          dispatch(UpdateDirectConversation({ conversation: data }));
        } else {
          // add direct conversation
          dispatch(AddDirectConversation({ conversation: data }));
        }
        dispatch(SelectConversation({ room_id: data._id })); //updates room_id state variable so the useEffect in the message.jsx also get executed so it fetch messages and also set the current_messages and current_conversation state variables
      });

      socket.on("new_friend_request", (data) => {
        dispatch(
          showSnackbar({
            severity: "success",
            message: "New friend request received",
          })
        );
      });

      socket.on("request_accepted", (data) => {
        dispatch(
          showSnackbar({
            severity: "success",
            message: "Friend Request Accepted",
          })
        );
      });

      socket.on("request_sent", (data) => {
        dispatch(showSnackbar({ severity: "success", message: data.message }));
      });
    }

    socket.on("friend_offline", (data) => {
      console.log(`User with ID ${data.user_id} is now offline`);
      const currentConversationUserID = currentConversationUserIDRef.current;
      // Update UI accordingly
      // console.log(current_conversation);
      // console.log('Current Conversation User ID:', currentConversationUserID, typeof currentConversationUserID);
      // console.log('Data User ID:', data.user_id, typeof data.user_id);
      // *The issue you're facing is likely due to how closures work in JavaScript. The currentConversationUserID variable inside the socket event listener is capturing the value at the time the listener is added, and it doesn't get updated with the new state.

      // *To ensure the latest state is always used inside the socket event listener, you can leverage the useRef hook to keep a mutable reference to the current value of current_conversation.user_id. This way, you always have the most up-to-date value when the event is triggered.
      if (currentConversationUserID === data.user_id.trim()) {
        console.log(currentConversationUserID);
        dispatch(UpdateCurrent_conversationOnlineStatus({ status: false }));
      }

      dispatch(
        UpdateConversationOnlineStatus({ status: false, user_id: data.user_id })
      );
    });

    socket.on("friend_online", (data) => {
      console.log(`User with ID ${data.user_id} is now online`);
      const currentConversationUserID = currentConversationUserIDRef.current;
      // Update UI accordingly
      // console.log(current_conversation);
      // console.log('Current Conversation User ID:', currentConversationUserID, typeof currentConversationUserID);
      // console.log('Data User ID:', data.user_id, typeof data.user_id);
      // *The issue you're facing is likely due to how closures work in JavaScript. The currentConversationUserID variable inside the socket event listener is capturing the value at the time the listener is added, and it doesn't get updated with the new state.

      // *To ensure the latest state is always used inside the socket event listener, you can leverage the useRef hook to keep a mutable reference to the current value of current_conversation.user_id. This way, you always have the most up-to-date value when the event is triggered.
      if (currentConversationUserID === data.user_id) {
        console.log(currentConversationUserID);
        dispatch(UpdateCurrent_conversationOnlineStatus({ status: true }));
      }

      dispatch(
        UpdateConversationOnlineStatus({ status: true, user_id: data.user_id })
      );
    });

    socket.on("messagesDelivered", (conversationId) => {
      const currentConversationID = currentConversationIDRef.current;
      if (currentConversationID == conversationId) {
        console.log("entering.... ");
        dispatch(UpdateMessageStatus({ status: "Delivered" }));
      }
    });

    socket.on("messagesSeen", (conversationId) => {
      const currentConversationID = currentConversationIDRef.current;
      if (currentConversationID == conversationId) {
        console.log("entering.... ");
        dispatch(UpdateMessageStatus({ status: "Seen" }));
      }
    });

    socket.on("updateUnread", (conversationId) => {
      dispatch(UpdateConversationUnread({ conversationId: conversationId }));
    });

    socket.on("message_reacted", (data) => {
      const currentConversationID = currentConversationIDRef.current;
      if (currentConversationID == data.conversationId) {
        // console.log("react",data.updatedReaction)
        dispatch(
          UpdateMessagesForReaction({
            messageId: data?.messageId,
            reaction: data?.updatedReaction,
          })
        );
      }
    });
    // // Listen for the 'isSeen' event from the server
    // socket.on("isSeen", () => {
    //   // Get the current conversation ID
    //   const currentConversationid = currentConversationIDRef.current; // Adjust according to how you store it

    //   // Emit the current conversation ID back to the server
    //   socket.emit("currentConversationId", { currentConversationid });
    //   console.log("seen", currentConversationid);
    // });

    // Remove event listener on component unmount
    return () => {
      socket?.off("new_friend_request");
      socket?.off("request_accepted");
      socket?.off("request_sent");
      socket?.off("start_chat");
      socket?.off("new_message");
      socket?.off("audio_call_notification");
      socket?.off("friend_offline");
      socket?.off("friend_online");
      socket?.off("messagesDelivered");
      socket?.off("messagesSeen");
      socket?.off("updateUnread");
      socket?.off("message_reacted");
    };
  }, [isLoggedIn, socket]);

  if (!isLoggedIn) {
    return <Navigate to={"/auth/login"} />;
  }

  return (
    <>
      <Stack direction="row">
        {isDesktop && (
          // SideBar
          <SideNav />
        )}

        <Outlet />
      </Stack>
      {open_audio_notification_dialog && (
        <AudioCallNotification open={open_audio_notification_dialog} />
      )}
      {open_audio_dialog && (
        <AudioCallDialog
          open={open_audio_dialog}
          handleClose={handleCloseAudioDialog}
        />
      )}
      {open_video_notification_dialog && (
        <VideoCallNotification open={open_video_notification_dialog} />
      )}
      {open_video_dialog && (
        <VideoCallDialog
          open={open_video_dialog}
          handleClose={handleCloseVideoDialog}
        />
      )}
    </>
  );
};

export default DashboardLayout;
