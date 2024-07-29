import React, { useEffect, useRef } from "react";
import { Stack } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import useResponsive from "../../hooks/useResponsive";
import SideNav from "./SideBar";
import { useDispatch, useSelector } from "react-redux";
import {
  AddStatus,
  AddToFriends,
  FetchUserProfile,
  RemoveFromFriends,
  RemoveStatus,
  SelectConversation,
  showSnackbar,
  UpdateUserLocation,
  UpdateUserLocationEnded,
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
  UpdateMessagesForDeleteForEveryoneTypeToDeleted,
  UpdateChatForDeleteForMeEveryone,
  UpdateCurrent_conversationTypingStatus,
  UpdateConversationTypingStatus,
  UpdateCurrent_conversationCoordinates,
  UpdateConversationCoordinates,
  UpdateMessagesForLiveLocEnded,
  UpdateCurrent_conversationRecordingAudioStatus,
  UpdateConversationRecordingAudioStatus,
  FriendStatusAdded,
  FriendStatusRemoved,
} from "../../redux/slices/conversation";
import AudioCallNotification from "../../sections/Dashboard/Audio/CallNotification";
import VideoCallNotification from "../../sections/Dashboard/video/CallNotification";
import {
  PushToAudioCallQueue,
  ResetAudioCallQueue,
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
import { format } from "date-fns";
import toast from "react-hot-toast";
import sound from "../../assets/notifications/level-up-191997.mp3";
import incommingSound from "../../assets/notifications/Whatsapp Message - QuickSounds.com.mp3";
import { LuMessageSquare } from "react-icons/lu";
import Main from "../../sections/Dashboard/Audio/Main";

const DashboardLayout = () => {
  const isDesktop = useResponsive("up", "md");
  const dispatch = useDispatch();
  const { user_id } = useSelector((state) => state.auth);
  const { open_audio_notification_dialog, open_audio_dialog, main } = useSelector(
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

  const formatDate = (date) => {
    if (!date) return "Yesterday";
    const today = new Date();
    const messageDate = new Date(date);

    const isToday = today.toDateString() === messageDate.toDateString();
    const isYesterday =
      new Date(today.setDate(today.getDate() - 1)).toDateString() ===
      messageDate.toDateString();

    if (isToday) {
      return "Today";
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMMM dd, yyyy");
    }
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

        // console.log(data?.message)

        const time = formatTimeTo24Hrs(message?.created_at);
        // console.log("data", data);

        if (currentConversationID === data.conversation_id) {
          let lastTimeline = formatDate(data?.secondLastMessageCreated_at);

          // console.log("dg", lastTimeline);

          const timelineText = formatDate(message?.created_at);

          if (timelineText !== lastTimeline) {
            dispatch(
              AddDirectMessage({
                type: "divider",
                text: timelineText,
                created_at: new Date(),
              })
            );
          }

          if (user_id == message?.to) {
            const sound = new Audio(incommingSound);
            sound.play();
          }

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
              created_at: message?.created_at || "9:36",
              deletedForEveryone: message?.deletedForEveryone || true,
              coordinates: message?.location?.coordinates.reverse() || null,
              isLiveLocationSharing: message?.isLiveLocationSharing,
              watchId: message?.watchId,
              replyToMsgId: message?.replyToMsgId,
              filePath: message?.filePath,
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

        if (
          user_id == data.message.to &&
          currentConversationID != data.conversation_id
        ) {
          // console.log("image", data);
          const notiSound = new Audio(sound);
          notiSound.play();

          const conversations = concersationsRef.current;
          const openChat = conversations.filter(
            (el) => el?.user_id === message.from
          );

          toast.custom((t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div
                className="flex-1 w-0 p-4 cursor-pointer"
                onClick={() => {
                  if (openChat?.length <= 0) {
                    console.log("sssss",openChat)
                    toast.dismiss(t.id);
                    dispatch(
                      showSnackbar({
                        severity: "Error",
                        message: "Start-chat from friends section",
                      })
                    );

                    return;
                  }
                  dispatch(
                    SelectConversation({ room_id: data.conversation_id })
                  );
                  dispatch(
                    UpdateConversationUnread({
                      conversationId: data.conversation_id,
                    })
                  );
                  toast.dismiss(t.id);
                }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={data?.avatar}
                      alt=""
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {data?.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{data?.text}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          ));
        }

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
        const notiSound = new Audio(sound);
        notiSound.play();
        dispatch(
          showSnackbar({
            severity: "success",
            message: "New friend request received",
          })
        );
      });

      socket.on("request_accepted", (data) => {
        const notiSound = new Audio(sound);
        notiSound.play();
        dispatch(AddToFriends({id: data?.id}));
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

    socket.on("updatetyping", (data) => {
      const currentConversationID = currentConversationIDRef.current;

      if (currentConversationID === data.conversationId) {
        dispatch(
          UpdateCurrent_conversationTypingStatus({ typing: data.typing })
        );
      }

      dispatch(
        UpdateConversationTypingStatus({
          typing: data.typing,
          conversationId: data.conversationId,
        })
      );
    });

    socket.on("updateRecordingAudio", (data) => {
      const currentConversationID = currentConversationIDRef.current;

      if (currentConversationID === data.conversationId) {
        dispatch(
          UpdateCurrent_conversationRecordingAudioStatus({
            recordingAudio: data.recordingAudio,
          })
        );
      }

      dispatch(
        UpdateConversationRecordingAudioStatus({
          recordingAudio: data.recordingAudio,
          conversationId: data.conversationId,
        })
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

    socket.on("message_deleteForEveryone", (data) => {
      const currentConversationID = currentConversationIDRef.current;
      if (currentConversationID == data.conversationId) {
        console.log("deleting msg...");
        dispatch(
          UpdateMessagesForDeleteForEveryoneTypeToDeleted({
            messageId: data.messageId,
          })
        );
      }
      // suppose if the last msg was deleted then we also need to handel conversation section display msg
      dispatch(
        UpdateChatForDeleteForMeEveryone({
          conversationId: data.conversationId,
          messageId: data.messageId,
        })
      );
    });

    socket.on("updateCoordinates", async (data) => {
      const currentConversationID = currentConversationIDRef.current;

      if (currentConversationID === data.conversation_id) {
        dispatch(
          UpdateCurrent_conversationCoordinates({
            coordinates: data.coordinates,
          })
        );
      }

      dispatch(
        UpdateConversationCoordinates({
          coordinates: data.coordinates,
          conversation_id: data.conversation_id,
        })
      );
    });

    socket.on("updateUser", async (data) => {
      dispatch(
        UpdateUserLocation({
          isLiveLocationSharing: data.isLiveLocationSharing,
          location: data.location,
        })
      );
    });

    socket.on("liveLocEnded", async (data) => {
      const currentConversationID = currentConversationIDRef.current;

      if (currentConversationID === data.conversationId) {
        dispatch(UpdateMessagesForLiveLocEnded({ messageId: data.messageId }));
      }

      if (user_id == data.from) {
        console.log("loll");
        dispatch(UpdateUserLocationEnded());
      }
    });

    socket.on("statusAdded", async (data) => {
      console.log("statusadded", data);
      dispatch(AddStatus({ newStatus: data }));
    });

    socket.on("statusRemoved", async (data) => {
      console.log("statusremoved", data);
      dispatch(RemoveStatus({ statusId: data }));
    });

    socket.on("friendStatusAdded", async (data) => {
      // const currentConversationID = currentConversationIDRef.current;

      // if (currentConversationID === data.conversationId) {
      //   dispatch(UpdateMessagesForLiveLocEnded({ messageId: data.messageId }));
      // }
      console.log("friendadded", data);
      dispatch(
        FriendStatusAdded({ userId: data?.userId, status: data?.status })
      );
    });

    socket.on("friendStatusRemoved", async (data) => {
      // const currentConversationID = currentConversationIDRef.current;

      // if (currentConversationID === data.conversationId) {
      //   dispatch(UpdateMessagesForLiveLocEnded({ messageId: data.messageId }));
      // }
      console.log("friendremoved", data);
      dispatch(
        FriendStatusRemoved({ userId: data?.userId, statusId: data?.statusId })
      );
    });

    socket.on("removedFriend", (data) => {
      dispatch(RemoveFromFriends({ id: data }));
    });

    socket.on("audio_call_missed", () => {
      // TODO => You can play an audio indicating call is missed at receiver's end
      // Abort call
      dispatch(ResetAudioCallQueue());
    });

    socket.on("audio_call_ended", () => {
      // TODO => You can play an audio indicating call is missed at receiver's end
      // Abort call
      dispatch(ResetAudioCallQueue());
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
      socket?.off("message_deleteForEveryone");
      socket?.off("updateCoordinates");
      socket?.off("updateUser");
      socket?.off("liveLocEnded");
      socket?.off("statusAdded");
      socket?.off("friendStatusAdded");
      socket?.off("statusRemoved");
      socket?.off("friendStatusRemoved");
      socket?.off("removedFriend");
      socket?.off("audio_call_missed");
    };
  }, [isLoggedIn, socket]);

  if (!isLoggedIn) {
    return <Navigate to={"/auth/login"} />;
  }

  return (
    <div className="overflow-y-hidden">
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
      {main && (
        <Main
          open={main}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
