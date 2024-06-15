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

  // Using useRef to keep a mutable reference
  const currentConversationUserIDRef = useRef(current_conversation?.user_id);

  // Update the ref whenever current_conversation changes
  useEffect(() => {
    currentConversationUserIDRef.current = current_conversation?.user_id;
    console.log("changed", currentConversationUserIDRef.current);
  }, [current_conversation]);

  useEffect(() => {
    dispatch(FetchUserProfile());
  }, []);

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

      socket.on("audio_call_notification", (data) => {
        // TODO => dispatch an action to add this in call_queue
        dispatch(PushToAudioCallQueue(data));
      });

      socket.on("video_call_notification", (data) => {
        // TODO => dispatch an action to add this in call_queue
        dispatch(PushToVideoCallQueue(data));
      });

      socket.on("new_message", (data) => {
        const message = data.message;
        console.log(current_conversation, data);
        // check if msg we got is from currently selected conversation
        if (current_conversation?.id === data.conversation_id) {
          dispatch(
            AddDirectMessage({
              id: message._id,
              type: "msg",
              subtype: message.type,
              message: message.text,
              incoming: message.to === user_id,
              outgoing: message.from === user_id,
            })
          );
        }
        console.log("new message pushed to current_message");
        // after pushing new message to the current_message state variable the Message.jsx component is rerendered and all the current_messages are agian rerendered
      });

      socket.on("start_chat", (data) => {
        console.log(data);
        // add / update to conversation list
        const existing_conversation = conversations.find(
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
        console.log(current_conversation.user_id);
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
        console.log(current_conversation.user_id);
        dispatch(UpdateCurrent_conversationOnlineStatus({ status: true }));
      }

      dispatch(
        UpdateConversationOnlineStatus({ status: true, user_id: data.user_id })
      );
    });

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
