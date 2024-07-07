import { Stack, Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import { Chat_History } from "../../data";
import {
  DeletedMsg,
  DocMsg,
  LinkMsg,
  MediaMsg,
  ReplyMsg,
  TextMsg,
  Timeline,
  VideoMsg,
} from "./MsgTypes";
import { useDispatch, useSelector } from "react-redux";
import {
  FetchCurrentMessages,
  FetchCurrentPrvPageMessages,
  SetCurrentConversation,
  UpdateHasMore,
  UpdatePage,
  UpdateReply_msg,
} from "../../redux/slices/conversation";
import { socket } from "../../socket";
import { useTheme } from "@emotion/react";
import Loading from "./Loading";
import axios from "../../utils/axios";
import { ToggleSidebar, UpdateSidebarType } from "../../redux/slices/app";

const Message = ({ isMobile, menu }) => {
  const dispatch = useDispatch();

  const user_id = window.localStorage.getItem("user_id");

  const conversationId = useSelector(
    (state) => state.conversation.direct_chat.current_conversation?.id
  );
  const { token } = useSelector((state) => state.auth);

  const { conversations, current_messages, page, hasMore } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { room_id } = useSelector((state) => state.app);

  const { sideBar } = useSelector((state)=>state.app)

  useEffect(() => {
    if (room_id === null) {
      return;
    }
    console.log(
      "inside useEffect updating current_conversation and current_messages"
    );
    const current = conversations.find((el) => el?.id === room_id);
    console.log("cuurent", current);

    socket.emit("get_messages", { conversation_id: current?.id, user_id: user_id }, (data) => {
      // data => list of messages
      // console.log(data, "List of messages");
      dispatch(FetchCurrentMessages({ messages: data }));
      // console.log(data);
    });

    dispatch(SetCurrentConversation(current));
    dispatch(UpdateReply_msg({ reply: false, replyToMsg: null }));
    dispatch(UpdatePage({ page: 2 }));
    dispatch(UpdateHasMore({ hasMore: true }));
    if(sideBar.open){
      dispatch(ToggleSidebar());
      dispatch(UpdateSidebarType("CONTACT"));
    }
  }, [room_id]);

  async function fetchData() {
    console.log("fetch-data");
    const { data } = await axios.get(
      `/user/messages/${conversationId}/${page}`,
      // {}, // Empty data object as second parameter not required in get request
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.data.length <= 0) {
      dispatch(UpdateHasMore({ hasMore: false }));
      return;
    }

    console.log("inside fetch", data, "page", page);
      dispatch(FetchCurrentPrvPageMessages({ messages: data.data }));
      dispatch(UpdatePage({ page: page + 1 }));

    // let newData = [...Chat_History, ...data];
    // newData.reverse();
    // setTimeout(() => setData(newData), 1500);
  }

  const theme = useTheme();
  const messageListRef = useRef(null);

  useEffect(() => {//this duty is now handled by the infinite scroll.
    // Scroll to the bottom of the message list when new messages are added
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [conversationId]);

  return (
    <Box
      p={isMobile ? 1 : 3}
      ref={messageListRef}
      id="scrollableDiv"
      width={"100%"}
      height={"100vh"}
      maxHeight={"78vh"}
      sx={{
        position: "relative",
        flexGrow: 1,
        overflowY: "scroll",

        backgroundColor:
          theme.palette.mode === "light" ? "#F0F4FA" : theme.palette.background,

        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
      style={{
        overflowY: "auto",
        display: "flex",
        flexDirection: "column-reverse",
        margin: "auto",
      }}
    >
      {/* <Box p={isMobile ? 1 : 3}>
      <Stack
      > */}
      <InfiniteScroll
        dataLength={current_messages.length}
        next={fetchData}
        hasMore={hasMore}
        // loader={<p className="text-center m-5">⏳&nbsp;Loading...</p>}
        loader={<Loading />}
        endMessage={
          <p
            className="text-center m-5"
            style={{ textAlign: "center", fontWeight: "bold" }}
          >
            That&apos;s all folks!🐰🥕
          </p>
        }
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          overflow: "visible",
          gap: "20px",
        }}
        scrollableTarget="scrollableDiv"
        inverse={true}
      >
        {[...current_messages].reverse().map((el, idx) => {
          switch (el.type) {
            case "divider":
              return (
                // Timeline
                <Timeline el={el} />
              );

            case "msg":
              switch (el.subtype) {
                case "img":
                  return (
                    // Media Message
                    <MediaMsg el={el} menu={menu} />
                  );

                case "video":
                  return (
                    // Media Message
                    <VideoMsg el={el} menu={menu} />
                  );

                case "doc":
                  return (
                    // Doc Message
                    <DocMsg el={el} menu={menu} />
                  );
                case "Link":
                  return (
                    //  Link Message
                    <LinkMsg el={el} menu={menu} />
                  );

                case "reply":
                  return (
                    //  ReplyMessage
                    <ReplyMsg el={el} menu={menu} />
                  );

                case "deleted":
                  return (
                    //  deletedMessage
                    <DeletedMsg el={el} menu={menu} />
                  );

                default:
                  return (
                    // Text Message
                    <TextMsg el={el} menu={menu} />
                  );
              }

            default:
              return <></>;
          }
        })}
      </InfiniteScroll>
      {/* </Stack>
    </Box> */}
    </Box>
  );
};

export default Message;
