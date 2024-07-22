import { createSlice } from "@reduxjs/toolkit";
import { faker } from "@faker-js/faker";
import { useSelector } from "react-redux";
// import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../config";

const user_id = window.localStorage.getItem("user_id");

const getLastVisibleMessage = (messages, userId) => {
  //for constact chat
  //* message.type
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (
      (!message?.deletedFor || !message?.deletedFor[userId]) &&
      message?.type != "deleted" &&
      message?.type != "divider"
    ) {
      return message;
    }
  }
  return null;
};

const getLastVisibleMessageForDeleteForEveryOne = (messages, userId) => {
  //for messages
  //* message.subtype
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (
      (!message?.deletedFor || !message?.deletedFor[userId]) &&
      message?.subtype != "deleted" &&
      message?.type != "divider"
    ) {
      return message;
    }
  }
  return null;
};

const initialState = {
  direct_chat: {
    conversations: [],
    current_conversation: null,
    current_messages: [],
    page: 2,
    hasMore: true,
  },
  group_chat: {},
  reply_msg: {
    reply: false,
    replyToMsg: null,
    messageId: null,
  },
};

const slice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    fetchDirectConversations(state, action) {
      // console.log("hola", action.payload.conversations);
      const pinnedChats = action.payload.pinnedChats;

      const list = action.payload.conversations.map((el) => {
        const user = el.participants.find(
          (elm) => elm._id.toString() !== user_id
        );

        const isPinned = pinnedChats.includes(el._id.toString());

        const lastVisibleMessage = getLastVisibleMessage(el.messages, user_id);

        // Format time to 24-hour format
        const formatTimeTo24Hrs = (dateString) => {
          const date = new Date(dateString);
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        };

        return {
          id: el._id, //conversationid
          user_id: user?._id, //userid
          name: `${user?.firstName} ${user?.lastName}`,
          online: user?.status === "Online",
          //   img: `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user?.avatar}`,
          img:
            user?.avatar ||
            `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`,
          //   msg: el.messages.slice(-1)[0].text,
          msg: lastVisibleMessage ? lastVisibleMessage.text : "No messages",
          time: lastVisibleMessage
            ? formatTimeTo24Hrs(lastVisibleMessage.created_at)
            : formatTimeTo24Hrs(Date.now()),
          unread: el?.unreadCount[user_id.toString()] || 0,
          pinned: isPinned,
          about: user?.about || "No Discription",
          email: user?.email,
          typing: el?.typing[user?._id.toString()] || false,
          coordinates: user?.location?.coordinates.reverse() || null,
          recordingAudio: el?.recordingAudio[user?._id.toString()] || false,
          statuses: user?.statuses || [],
        };
      });

      state.direct_chat.conversations = list;
    },

    updateDirectConversation(state, action) {
      const this_conversation = action.payload.conversation;
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (el) => {
          if (el?.id !== this_conversation._id) {
            return el;
          } else {
            const user = this_conversation.participants.find(
              (elm) => elm._id.toString() !== user_id
            );

            const lastVisibleMessage = getLastVisibleMessage(
              this_conversation.messages,
              user_id
            );

            // Format time to 24-hour format
            const formatTimeTo24Hrs = (dateString) => {
              const date = new Date(dateString);
              return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            };

            return {
              id: this_conversation._id,
              user_id: user?._id, //onetoonemsssage's _id
              name: `${user?.firstName} ${user?.lastName}`,
              online: user?.status === "Online",
              img:
                user?.avatar ||
                `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`,
              about: user?.about || "No Discription",
              msg: lastVisibleMessage ? lastVisibleMessage.text : "No messages",
              time: lastVisibleMessage
                ? formatTimeTo24Hrs(lastVisibleMessage.created_at)
                : formatTimeTo24Hrs(Date.now()),
              unread: el?.unreadCount[user_id.toString()] || 0,
              pinned: false,
              email: user?.email,
              typing: el?.typing[user?._id.toString()] || false,
              coordinates: user?.location?.coordinates.reverse() || null,
              recordingAudio: el?.recordingAudio[user?._id.toString()] || false,
              statuses: user?.statuses || [],
            };
          }
        }
      );
    },

    updateDirectConversationForPinnedChat(state, action) {
      const this_conversation_id = action.payload.this_conversation_id;
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (el) => {
          if (el?.id !== this_conversation_id) {
            return el;
          } else {
            return {
              ...el,
              pinned: action.payload.pinned,
            };
          }
        }
      );
    },

    addDirectConversation(state, action) {
      // PUSH THE NEW RECORD TO CONVERSATIONS
      const this_conversation = action.payload.conversation;
      const user = this_conversation.participants.find(
        (elm) => elm._id.toString() !== user_id
      );
      state.direct_chat.conversations = state.direct_chat.conversations.filter(
        (el) => el?.id !== this_conversation._id
      );
      state.direct_chat.conversations.push({
        id: this_conversation._id,
        user_id: user?._id,
        name: `${user?.firstName} ${user?.lastName}`,
        online: user?.status === "Online",
        img:
          user?.avatar ||
          `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`,
        about: user?.about || "No Discription",
        msg: user?.text || "No messages",
        time: "00:00",
        unread: this_conversation?.unreadCount[user_id.toString()] || 0,
        pinned: false,
        email: user?.email,
        typing: this_conversation?.typing[user?._id.toString()] || false,
        coordinates: user?.location?.coordinates.reverse() || null,
        recordingAudio:
          this_conversation?.recordingAudio[user?._id.toString()] || false,
        statuses: user?.statuses || [],
      });
    },

    setCurrentConversation(state, action) {
      state.direct_chat.current_conversation = action.payload;
    },
    fetchCurrentMessages(state, action) {
      const messages = action.payload.messages;

      messages.reverse();
      console.log("d", messages);

      const formatted_messages = messages.map((el) => {
        if (el?.type != "divider" && el?.subtype != "new") {
          const reaction = el?.reaction;
          let myReaction = null;
          let otherReaction = null;

          Object.keys(reaction).forEach((key) => {
            if (key === user_id.toString()) {
              myReaction = reaction[key];
            } else {
              otherReaction = reaction[key];
            }
          });

          const formatTimeTo24Hrs = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          };

          return {
            id: el._id,
            type: "msg",
            subtype: el.type,
            message: el.text,
            incoming: el.to === user_id,
            outgoing: el.from === user_id,
            status: el?.status,
            src: el?.file,
            replyToMsg: el?.replyToMsg,
            star: el?.star[user_id.toString()] || false,
            myReaction: myReaction,
            otherReaction: otherReaction,
            time: formatTimeTo24Hrs(el?.created_at) || "9:36",
            created_at: el?.created_at || "9:36",
            deletedForEveryone: el?.deletedForEveryone || false,
            coordinates: el?.location?.coordinates.reverse() || null,
            isLiveLocationSharing: el?.isLiveLocationSharing,
            watchId: el?.watchId,
            replyToMsgId: el?.replyToMsgId,
          };
        } else {
          return el;
        }
      });
      state.direct_chat.current_messages = formatted_messages;
      console.log("file", messages.file);
    },
    fetchCurrentPrvPageMessages(state, action) {
      const messages = action.payload.messages;

      messages.reverse();
      console.log("sd", messages);

      const formatted_messages = messages.map((el) => {
        if (el?.type != "divider") {
          const reaction = el?.reaction;
          let myReaction = null;
          let otherReaction = null;

          Object.keys(reaction).forEach((key) => {
            if (key === user_id.toString()) {
              myReaction = reaction[key];
            } else {
              otherReaction = reaction[key];
            }
          });

          const formatTimeTo24Hrs = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          };

          return {
            id: el._id,
            type: "msg",
            subtype: el.type,
            message: el.text,
            incoming: el.to === user_id,
            outgoing: el.from === user_id,
            status: el?.status,
            src: el?.file,
            replyToMsg: el?.replyToMsg,
            star: el?.star[user_id.toString()] || false,
            myReaction: myReaction,
            otherReaction: otherReaction,
            time: formatTimeTo24Hrs(el?.created_at) || "9:36",
            created_at: el?.created_at || "9:36",
            deletedForEveryone: el?.deletedForEveryone || false,
            coordinates: el?.location?.coordinates.reverse() || null,
            isLiveLocationSharing: el?.isLiveLocationSharing,
            watchId: el?.watchId,
            replyToMsgId: el?.replyToMsgId,
          };
        } else {
          return el;
        }
      });

      state.direct_chat.current_messages = [
        ...formatted_messages,
        ...state.direct_chat.current_messages,
      ];
      console.log("file", messages.file);
    },
    addDirectMessage(state, action) {
      state.direct_chat.current_messages.push(action.payload.message);
      console.log(
        "inside addDirect messages",
        state.direct_chat.current_messages
      );
    },
    updateMessagesForStar(state, action) {
      state.direct_chat.current_messages =
        state.direct_chat.current_messages.map((el) => {
          if (el?.id != action.payload.messageId) {
            return el;
          } else {
            return {
              ...el,
              star: action.payload.star,
            };
          }
        });
    },
    updateMessagesForDeleteForEveryoneAsFalse(state, action) {
      state.direct_chat.current_messages =
        state.direct_chat.current_messages.map((el) => {
          if (el?.id != action.payload.messageId) {
            return el;
          } else {
            return {
              ...el,
              deletedForEveryone: false,
            };
          }
        });
    },
    updateMessagesForDeleteForEveryoneTypeToDeleted(state, action) {
      state.direct_chat.current_messages =
        state.direct_chat.current_messages.map((el) => {
          if (el?.id != action.payload.messageId) {
            return el;
          } else {
            return {
              ...el,
              deletedForEveryone: false,
              subtype: "deleted",
              message: null,
              src: null,
              replyToMsg: null,
              star: false,
              myReaction: null,
              otherReaction: null,
            };
          }
        });
    },
    updateMessagesForDeleteForMe(state, action) {
      if (
        state.direct_chat.current_messages[
          state.direct_chat.current_messages.length - 1
        ]?.id == action.payload.messageId
      ) {
        //last msg deleted
        state.direct_chat.current_messages.pop();

        const lastVisibleMessage = getLastVisibleMessageForDeleteForEveryOne(
          state.direct_chat.current_messages,
          user_id
        );

        state.direct_chat.conversations = state.direct_chat.conversations.map(
          (conversation) =>
            conversation.id === action.payload.conversationId
              ? {
                  ...conversation,
                  msg: lastVisibleMessage?.message
                    ? lastVisibleMessage.message
                    : "No messages",
                  time: lastVisibleMessage ? lastVisibleMessage?.time : "9:36",
                }
              : conversation
        );
        return;
      }

      state.direct_chat.current_messages =
        state.direct_chat.current_messages.filter(
          (el) => el?.id != action.payload.messageId
        );

      const lastVisibleMessage = getLastVisibleMessageForDeleteForEveryOne(
        state.direct_chat.current_messages,
        user_id
      );

      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.id === action.payload.conversationId
            ? {
                ...conversation,
                msg: lastVisibleMessage?.message
                  ? lastVisibleMessage.message
                  : "No messages",
                time: lastVisibleMessage ? lastVisibleMessage?.time : "9:36",
              }
            : conversation
      );
    },
    updateChatForDeleteForMeEveryone(state, action) {
      if (
        state.direct_chat.current_messages[
          state.direct_chat.current_messages.length - 1
        ]?.id == action.payload.messageId
      ) {
        //last msg deleted

        const lastVisibleMessage = getLastVisibleMessageForDeleteForEveryOne(
          state.direct_chat.current_messages,
          user_id
        );

        state.direct_chat.conversations = state.direct_chat.conversations.map(
          (conversation) =>
            conversation.id === action.payload.conversationId
              ? {
                  ...conversation,
                  msg: lastVisibleMessage?.message
                    ? lastVisibleMessage.message
                    : "No messages",
                  time: lastVisibleMessage ? lastVisibleMessage?.time : "9:36",
                }
              : conversation
        );
        return;
      }

      const lastVisibleMessage = getLastVisibleMessageForDeleteForEveryOne(
        state.direct_chat.current_messages,
        user_id
      );

      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.id === action.payload.conversationId
            ? {
                ...conversation,
                msg: lastVisibleMessage?.message
                  ? lastVisibleMessage.message
                  : "No messages",
                time: lastVisibleMessage ? lastVisibleMessage?.time : "9:36",
              }
            : conversation
      );
    },
    updateMessagesForReaction(state, action) {
      const reaction = action.payload.reaction;
      let myReaction = null;
      let otherReaction = null;

      Object.keys(reaction).forEach((key) => {
        if (key === user_id.toString()) {
          myReaction = reaction[key];
        } else {
          otherReaction = reaction[key];
        }
      });
      console.log(myReaction, otherReaction);
      state.direct_chat.current_messages =
        state.direct_chat.current_messages.map((el) => {
          if (el?.id != action.payload.messageId) {
            return el;
          } else {
            return {
              ...el,
              myReaction: myReaction,
              otherReaction: otherReaction,
            };
          }
        });
    },
    updateMessagesForLiveLocEnded(state, action) {
      state.direct_chat.current_messages =
        state.direct_chat.current_messages.map((el) => {
          if (el?.id != action.payload.messageId) {
            return el;
          } else {
            return {
              ...el,
              isLiveLocationSharing: false,
              watchId: null,
            };
          }
        });
    },
    updateCurrent_conversationOnlineStatus(state, action) {
      state.direct_chat.current_conversation = {
        ...state.direct_chat.current_conversation,
        online: action.payload.status,
      };
      // console.log(
      //   "current_conversation setting status to  ",
      //   action.payload.status
      // );
    },
    updateCurrent_conversationCoordinates(state, action) {
      state.direct_chat.current_conversation = {
        ...state.direct_chat.current_conversation,
        coordinates: action.payload.coordinates.reverse(),
      };
    },
    updateCurrent_conversationTypingStatus(state, action) {
      state.direct_chat.current_conversation = {
        ...state.direct_chat.current_conversation,
        typing: action.payload.typing,
      };
    },
    updateCurrent_conversationRecordingAudioStatus(state, action) {
      state.direct_chat.current_conversation = {
        ...state.direct_chat.current_conversation,
        recordingAudio: action.payload.recordingAudio,
      };
    },
    updateConversationOnlineStatus(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.user_id === action.payload.user_id
            ? { ...conversation, online: action.payload.status }
            : conversation
      );
      console.log("conversations setting status to ", action.payload.status);
    },
    updateConversationCoordinates(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.id === action.payload.conversation_id
            ? {
                ...conversation,
                coordinates: action.payload.coordinates.reverse(),
              }
            : conversation
      );
      console.log("conversations setting status to ", action.payload.status);
    },
    updateConversationTypingStatus(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.id === action.payload.conversationId
            ? { ...conversation, typing: action.payload.typing }
            : conversation
      );
    },
    updateConversationRecordingAudioStatus(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.id === action.payload.conversationId
            ? { ...conversation, recordingAudio: action.payload.recordingAudio }
            : conversation
      );
    },
    updateConversationUnread(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.id === action.payload.conversationId
            ? { ...conversation, unread: 0 }
            : conversation
      );
      console.log("conversations setting status to 0");
    },
    friendStatusAdded(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.user_id === action.payload.userId
            ? {
                ...conversation,
                statuses: [...conversation.statuses, action.payload.status],
              }
            : conversation
      );
    },
    friendStatusRemoved(state, action) {
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (conversation) =>
          conversation.user_id === action.payload.userId
            ? {
                ...conversation,
                statuses: conversation.statuses.filter(
                  (status) => status?._id !== action.payload.statusId
                ),
              }
            : conversation
      );
    },
    updateConversationForNewMessage(state, action) {
      const this_conversation = action.payload.conversation;
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (el) => {
          if (el?.id !== this_conversation._id) {
            return el;
          } else {
            return {
              ...el,
              msg: this_conversation?.messages?.text,
              unread: this_conversation?.unread,
              time: this_conversation?.time,
            };
          }
        }
      );
    },
    clearCurrentMessagesAndCurrentConversation(state, action) {
      console.log("bye......");
      state.direct_chat.current_messages = [];
      state.direct_chat.current_conversation = null;
    },
    updateMessageStatus(state, action) {
      console.log("marking to ", action.payload.status);
      state.direct_chat.current_messages =
        state.direct_chat.current_messages.map((el) => {
          const status = action.payload.status;
          console.log("status", status);
          if (status == "Delivered") {
            if (el.status == "Sent") {
              return {
                ...el,
                status: "Delivered",
              };
            } else {
              return el;
            }
          } else {
            if (el.status == "Sent" || el.status == "Delivered") {
              return {
                ...el,
                status: "Seen",
              };
            } else {
              return el;
            }
          }
        });
    },
    updateReply_msg(state, action) {
      // console.log("reply msg");
      state.reply_msg.reply = action.payload.reply;
      state.reply_msg.replyToMsg = action.payload.replyToMsg;
      state.reply_msg.messageId = action.payload.messageId;
    },
    updatePage(state, action) {
      state.direct_chat.page = action.payload.page;
    },
    updateHasMore(state, action) {
      state.direct_chat.hasMore = action.payload.hasMore;
    },
    clearChat(state, action) {
      console.log("clearing>.........");
      if (
        state.direct_chat.current_conversation.id ===
        action.payload.conversationId
      ) {
        state.direct_chat.current_messages = [
          { subtype: "new", type: "msg", text: "no messages" },
        ];

        state.direct_chat.conversations = state.direct_chat.conversations.map(
          (conversation) =>
            conversation.id === action.payload.conversationId
              ? {
                  ...conversation,
                  msg:"No messages",
                  time:"00:00",
                }
              : conversation
        );
      }
    },
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export const FetchDirectConversations = ({ conversations, pinnedChats }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.fetchDirectConversations({
        conversations: conversations,
        pinnedChats: pinnedChats,
      })
    );
  };
};
export const AddDirectConversation = ({ conversation }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addDirectConversation({ conversation }));
  };
};
export const UpdateDirectConversation = ({ conversation }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateDirectConversation({ conversation }));
  };
};
export const UpdateDirectConversationForPinnedChat = ({
  this_conversation_id,
  pinned,
}) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateDirectConversationForPinnedChat({
        this_conversation_id: this_conversation_id,
        pinned: pinned,
      })
    );
  };
};

export const SetCurrentConversation = (current_conversation) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setCurrentConversation(current_conversation));
  };
};

export const FetchCurrentMessages = ({ messages }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.fetchCurrentMessages({ messages }));
  };
};
export const FetchCurrentPrvPageMessages = ({ messages }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.fetchCurrentPrvPageMessages({ messages }));
  };
};

export const AddDirectMessage = (message) => {
  return async (dispatch, getState) => {
    await dispatch(slice.actions.addDirectMessage({ message }));
  };
};

export const UpdateCurrent_conversationOnlineStatus = ({ status }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateCurrent_conversationOnlineStatus({ status: status })
    );
  };
};

export const UpdateCurrent_conversationCoordinates = ({ coordinates }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateCurrent_conversationCoordinates({
        coordinates: coordinates,
      })
    );
  };
};

export const UpdateCurrent_conversationTypingStatus = ({ typing }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateCurrent_conversationTypingStatus({ typing: typing })
    );
  };
};

export const UpdateCurrent_conversationRecordingAudioStatus = ({
  recordingAudio,
}) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateCurrent_conversationRecordingAudioStatus({
        recordingAudio: recordingAudio,
      })
    );
  };
};

export const UpdateConversationOnlineStatus = ({ status, user_id }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateConversationOnlineStatus({
        status: status,
        user_id: user_id,
      })
    );
  };
};
export const UpdateConversationCoordinates = ({
  conversation_id,
  coordinates,
}) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateConversationCoordinates({
        conversation_id: conversation_id,
        coordinates: coordinates,
      })
    );
  };
};

export const UpdateConversationTypingStatus = ({ typing, conversationId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateConversationTypingStatus({
        typing: typing,
        conversationId: conversationId,
      })
    );
  };
};

export const UpdateConversationRecordingAudioStatus = ({
  recordingAudio,
  conversationId,
}) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateConversationRecordingAudioStatus({
        recordingAudio: recordingAudio,
        conversationId: conversationId,
      })
    );
  };
};

export const UpdateConversationUnread = ({ conversationId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateConversationUnread({
        conversationId: conversationId,
      })
    );
  };
};

export const FriendStatusAdded = ({ userId, status }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.friendStatusAdded({
        userId: userId,
        status: status,
      })
    );
  };
};

export const FriendStatusRemoved = ({ userId, statusId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.friendStatusRemoved({
        userId: userId,
        statusId: statusId,
      })
    );
  };
};

export const UpdateConversationForNewMessage = ({ conversation }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateConversationForNewMessage({
        conversation: conversation,
      })
    );
  };
};

export const ClearCurrentMessagesAndCurrentConversation = () => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.clearCurrentMessagesAndCurrentConversation());
  };
};

export const UpdateMessageStatus = ({ status }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateMessageStatus({ status: status }));
  };
};
export const UpdateReply_msg = ({ reply, replyToMsg, messageId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateReply_msg({
        reply: reply,
        replyToMsg: replyToMsg,
        messageId: messageId,
      })
    );
  };
};
export const UpdateMessagesForStar = ({ messageId, star }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateMessagesForStar({ messageId: messageId, star: star })
    );
  };
};
export const UpdateMessagesForDeleteForEveryoneAsFalse = ({ messageId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateMessagesForDeleteForEveryoneAsFalse({
        messageId: messageId,
      })
    );
  };
};
export const UpdateMessagesForDeleteForEveryoneTypeToDeleted = ({
  messageId,
}) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateMessagesForDeleteForEveryoneTypeToDeleted({
        messageId: messageId,
      })
    );
  };
};
export const UpdateMessagesForDeleteForMe = ({ messageId, conversationId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateMessagesForDeleteForMe({
        messageId: messageId,
        conversationId: conversationId,
      })
    );
  };
};
export const UpdateMessagesForLiveLocEnded = ({ messageId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateMessagesForLiveLocEnded({
        messageId: messageId,
      })
    );
  };
};
export const UpdateChatForDeleteForMeEveryone = ({
  messageId,
  conversationId,
}) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateChatForDeleteForMeEveryone({
        messageId: messageId,
        conversationId: conversationId,
      })
    );
  };
};
export const UpdateMessagesForReaction = ({ messageId, reaction }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateMessagesForReaction({
        messageId: messageId,
        reaction: reaction,
      })
    );
  };
};

export const UpdatePage = ({ page }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updatePage({
        page: page,
      })
    );
  };
};

export const UpdateHasMore = ({ hasMore }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.updateHasMore({
        hasMore: hasMore,
      })
    );
  };
};

export const ClearChat = ({ conversationId }) => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.clearChat({
        conversationId: conversationId,
      })
    );
  };
};
