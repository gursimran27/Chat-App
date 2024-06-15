import React, { useEffect, useRef } from "react";
import { Box, Stack } from "@mui/material";
import { ChatHeader, ChatFooter } from "../../components/Chat";
import Message from "./Message";
import { useSearchParams } from "react-router-dom";
import useResponsive from "../../hooks/useResponsive";
import { useTheme } from "@emotion/react";
import { useSelector } from "react-redux";
import { SimpleBarStyle } from "../../components/Scrollbar";

const Conversation = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const theme = useTheme();

  const messageListRef = useRef(null);

  const { current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  useEffect(() => {
    // Scroll to the bottom of the message list when new messages are added
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [current_messages]);

  return (
    <Stack
      height={"100%"}
      maxHeight={"100vh"}
      width={isMobile ? "100vw" : "auto"}
      sx={{
        borderBottom:
          searchParams.get("type") === "individual-chat" &&
          searchParams.get("id")
            ? "0px"
            : "6px solid #0162C4",
      }}
    >
      {/*  */}
      <ChatHeader />
      <Box
        ref={messageListRef}
        width={"100%"}
        sx={{
          position: "relative",
          flexGrow: 1,
          overflowY: "scroll",

          backgroundColor:
            theme.palette.mode === "light"
              ? "#F0F4FA"
              : theme.palette.background,

          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        }}
      >
        <SimpleBarStyle timeout={500} clickOnTrack={false}>
          <Message menu={true} isMobile={isMobile} />
        </SimpleBarStyle>
      </Box>

      {/*  */}
      <ChatFooter />
    </Stack>
  );
};

export default Conversation;
