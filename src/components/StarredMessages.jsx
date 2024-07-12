import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ArrowLeft } from "phosphor-react";
import useResponsive from "../hooks/useResponsive";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../redux/slices/app";
import Message from "../components/Conversation/Message";
import {
  DocMsg,
  LinkMsg,
  MediaMsg,
  ReplyMsg,
  TextMsg,
  Timeline,
  VideoMsg,
} from "./Conversation/MsgTypes";
import axios from "../utils/axios";
import Loading from "./Conversation/Loading";

const StarredMessages = () => {
  const dispatch = useDispatch();

  const theme = useTheme();

  const isDesktop = useResponsive("up", "md");

  const conversationId = useSelector(
    (state) => state.conversation.direct_chat.current_conversation?.id
  );
  const user_id = window.localStorage.getItem("user_id");
  const { token } = useSelector((state) => state.auth);

  // const { current_messages } = useSelector(
  //   (state) => state.conversation.direct_chat
  // );

  // const starMsg = current_messages.filter( el=>el?.star);

  const [loading, setLoading] = useState(false);
  const [starMsg, setStarMsg] = useState([]);

  const currentConversationIDRef = useRef(conversationId);

  useEffect(() => {
    async function fetchData() {
      const conversationID = currentConversationIDRef.current;
      console.log("fetch-data-star", conversationID);
      setLoading(true);
      const { data } = await axios.get(
        `/user/starmessages/${conversationID}`,
        // {}, // Empty data object as second parameter not required in get request
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("starMSg", data);

      const formatted_messages = data.data.map((el) => {
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

        const time = formatTimeTo24Hrs(el?.created_at);

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
          star: true,
          myReaction: myReaction,
          otherReaction: otherReaction,
          time: time || "9:36",
          created_at: el?.created_at || "9:36",
          deletedForEveryone: el?.deletedForEveryone || true,
          coordinates: el?.location?.coordinates.reverse() || null,
          isLiveLocationSharing: el?.isLiveLocationSharing,
          watchId: el?.watchId,
        };
      });

      setStarMsg(formatted_messages);
      setLoading(false);
    }

    fetchData();
  }, []); // first render

  return (
    <Box
      style={{ borderLeft: "1px solid grey", borderRadius: "15px" }}
      sx={{
        width: !isDesktop ? "100vw" : 320,
        maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
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
              theme.palette.mode === "light" ? "#F9F1FA" : "#212B36",
          }}
          spacing={3}
        >
          <Box>
            <Stack spacing={3} sx={{ marginTop: "33px", marginLeft: "5px" }}>
              {loading ? (
                <Loading />
              ) : (
                starMsg.map((el, idx) => {
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
                })
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default StarredMessages;
