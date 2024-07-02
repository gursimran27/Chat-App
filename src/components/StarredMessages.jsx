import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ArrowLeft } from "phosphor-react";
import useResponsive from "../hooks/useResponsive";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../redux/slices/app";
import  Message  from "../components/Conversation/Message";
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg, Timeline, VideoMsg } from "./Conversation/MsgTypes";

const StarredMessages = () => {
  const dispatch = useDispatch();

  const theme = useTheme();

  const isDesktop = useResponsive("up", "md");

  const { current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const starMsg = current_messages.filter( el=>el?.star);


  return (
    <Box style={{borderLeft:'1px solid grey', borderRadius:'15px'}} sx={{ width: !isDesktop ? "100vw" : 320, maxHeight: "100vh", overflow:'hidden'}}>
      <Stack sx={{ height: "100%" }}>
        <Box
          sx={{
            boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
            width: "100%",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background,
          }}
        >
          <Stack
            sx={{ height: "100%", p: 2 }}
            direction="row"
            alignItems={"center"}
            spacing={3}
          >
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType("CONTACT"));
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2">Starred Messages</Typography>
          </Stack>
        </Box>
        <Stack
          sx={{
            height: "100%",
            position: "relative",
            flexGrow: 1,
            overflowY: "scroll",
            backgroundColor:
            theme.palette.mode === "light"
              ? "#F9F1FA"
              : '#212B36',
          }}
          spacing={3}
        >
          <Box >
      <Stack spacing={3} sx={{marginTop:"33px", marginLeft:"5px"}} >
        {starMsg.map((el, idx) => {
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
                    <MediaMsg el={el} menu={false} />
                  );

                case "video":
                  return (
                    // Media Message
                    <VideoMsg el={el} menu={false} />
                  );

                case "doc":
                  return (
                    // Doc Message
                    <DocMsg el={el} menu={false} />
                  );
                case "Link":
                  return (
                    //  Link Message
                    <LinkMsg el={el} menu={false} />
                  );

                case "reply":
                  return (
                    //  ReplyMessage
                    <ReplyMsg el={el} menu={false} />
                  );

                default:
                  return (
                    // Text Message
                    <TextMsg el={el} menu={false} />
                  );
              }

            default:
              return <></>;
          }
        })}
      </Stack>
    </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default StarredMessages;