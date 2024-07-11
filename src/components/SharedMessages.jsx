import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Tabs,
  Tab,
  Grid,
  Modal,
} from "@mui/material";
import { ArrowLeft, X } from "phosphor-react";
import useResponsive from "../hooks/useResponsive";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../redux/slices/app";
import { faker } from "@faker-js/faker";
import { DocMsg, LinkMsg } from "../components/Conversation/MsgTypes";
import { Shared_docs, Shared_links } from "../data";
import axios from "../utils/axios";
import Loading from "./Conversation/Loading";

const Media = () => {
  const dispatch = useDispatch();

  const { current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const theme = useTheme();

  const isDesktop = useResponsive("up", "md");

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSrc(null);
    SetTitle(null);
    setType(null);
  };

  const [src, setSrc] = useState(null);
  const [title, SetTitle] = useState(null);
  const [type, setType] = useState(null);

  const handleClick = (el) => {
    setSrc(el?.src);
    SetTitle(el?.message);
    setType(el?.subtype);
    handleOpenModal();
  };

  let count = 1;

  const conversationId = useSelector(
    (state) => state.conversation.direct_chat.current_conversation?.id
  );
  const user_id = window.localStorage.getItem("user_id");
  const { token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [imageVideoMsg, setimageVideoMsg] = useState([]);
  const [linkMsg, setLinkMsg] = useState([]);
  const [docMsg, setDocMsg] = useState([]);

  const currentConversationIDRef = useRef(conversationId);

  const format = (msg) => {
    const formatted_messages = msg.map((el) => {
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
        deletedForEveryone: el?.deletedForEveryone || true,
        coordinates: el?.location?.coordinates.reverse() || null,
      };
    });
    return formatted_messages;
  };

  useEffect(() => {
    async function fetchData() {
      const conversationID = currentConversationIDRef.current;
      console.log("fetch-mediaMSg", conversationID);
      setLoading(true);
      const { data } = await axios.get(
        `/user/mediamessages/${conversationID}`,
        // {}, // Empty data object as second parameter not required in get request
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("mediaMSg", data);

      setDocMsg(format(data.docMsg));
      setLinkMsg(format(data.linkMsg));
      setimageVideoMsg(format(data.imageVideoMsg));

      setLoading(false);
    }

    fetchData();
  }, []); //first render

  return (
    <Box
      style={{ borderLeft: "1px solid grey", borderRadius: "15px" }}
      sx={{ width: !isDesktop ? "100vw" : 320, maxHeight: "100vh" }}
    >
      {loading ? (
        <Loading />
      ) : (
        <Stack sx={{ height: "100%", overflowX: "hidden" }}>
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
              <Typography variant="subtitle2">Shared</Typography>
            </Stack>
          </Box>

          <Tabs value={value} onChange={handleChange} centered>
            <Tab label="Media" />
            <Tab label="Links" />
            <Tab label="Docs" />
          </Tabs>
          <Stack
            sx={{
              height: "100%",
              position: "relative",
              flexGrow: 1,
              overflowY: "scroll",
              overflowX: "hidden",
              backgroundColor:
                theme.palette.mode === "light" ? "#F9F1FA" : "#212B36",
            }}
            spacing={3}
            padding={value === 1 ? 1 : 3}
          >
            {/* <Conversation starred={true} /> */}
            {(() => {
              switch (value) {
                case 0:
                  return (
                    <Grid container spacing={2}>
                      {imageVideoMsg.map((el) =>
                        el?.subtype == "img" ? (
                          <Grid item xs={4}>
                            <img
                              src={el?.src}
                              alt={el?.message}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "10px",
                                cursor: "pointer", // Add cursor pointer to indicate clickable
                              }}
                              onClick={() => handleClick(el)} // Open modal on image click
                            />
                          </Grid>
                        ) : el?.subtype == "video" ? (
                          <Grid item xs={4}>
                            <video
                              src={el?.src}
                              type={el?.type} // Specify the video type if known
                              // controls
                              autoPlay
                              loop
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                width: "100%",
                                height: "100%",
                                // objectFit: "contain",
                                borderRadius: "10px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleClick(el)}
                            />
                          </Grid>
                        ) : null
                      )}
                    </Grid>
                  );
                case 1:
                  return linkMsg.map(
                    (el) =>
                      el?.subtype == "Link" && (
                        <Stack
                          direction={"row"}
                          justifyContent={"start"}
                          sx={{
                            // width: "10%",
                            wordBreak: "break-all", // ensures long words break and wrap
                            overflowWrap: "break-word", // ensures lines break at appropriate points
                            whiteSpace: "normal",
                          }}
                        >
                          {`${count++})`}
                          <a
                            style={{ color: "blue" }}
                            href={el?.message}
                            target="_blank"
                          >
                            {el?.message}
                          </a>
                        </Stack>
                      )
                  );

                case 2:
                  return docMsg.map(
                    (el) =>
                      el?.subtype == "doc" && (
                        <div style={{ marginRight: "-20px" }}>
                          <DocMsg el={el} menu={false} />
                        </div>
                      )
                  );

                default:
                  break;
              }
            })()}
          </Stack>
        </Stack>
      )}

      {/* Modal for displaying larger image */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "70%",
            height: "90%",
            backgroundColor: "#fff",
            boxShadow: 24,
            p: 4,
            borderRadius: "10px",
            outline: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "auto", // Add scrollbar when content overflows
          }}
        >
          {type == "img" ? (
            <img
              src={src}
              alt={title}
              loading="lazy"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
          ) : (
            <video
              src={src}
              type={title} // Specify the video type if known
              controls
              autoPlay
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
          )}
          <IconButton
            aria-label="Close modal"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "black",
              backgroundColor: "red",
              "&:hover": {
                backgroundColor: "red",
                color: "black",
                scale: "0.9",
                transition: "all 300ms",
              },
            }}
          >
            <X />
          </IconButton>
        </Box>
      </Modal>
    </Box>
  );
};

export default Media;
