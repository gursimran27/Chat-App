import {
  Box,
  Divider,
  Stack,
  Typography,
  Link,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Tooltip,
  Fab,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Check,
  Checks,
  DotsThreeVertical,
  DownloadSimple,
  Image,
  Path,
  Star,
  X,
  XCircle,
} from "phosphor-react";
import { Message_options } from "../../data";
import { useDispatch, useSelector } from "react-redux";
import {
  UpdateMessagesForDeleteForEveryoneAsFalse,
  UpdateMessagesForDeleteForMe,
  UpdateMessagesForStar,
  UpdateReply_msg,
} from "../../redux/slices/conversation";
import { closeSnackBar, showSnackbar } from "../../redux/slices/app";
import axios from "../../utils/axios";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import useResponsive from "../../hooks/useResponsive";
import { socket } from "../../socket";
import "./MsgTypes.css";
import { format } from "date-fns";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip as TP,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import icon from "../../assets/placeholder.png";
import myLoc from "../../assets/unnamed.png";
import { Icon } from "leaflet";
import WaveSurfer from "wavesurfer.js";
import { FaPlay, FaStop } from "react-icons/fa";
import { Axios } from "axios";

const formatDate = (date) => {
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

// TODO HOF

const MessageOption = ({
  openPicker,
  setOpenPicker,
  replyToMsg,
  messageId,
  star,
  deletedForEveryone,
  created_at,
  incomming,
  watchId,
  type,
}) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null); //store referance
  const open = Boolean(anchorEl); //convert referance to boollean
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); //referance
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { token } = useSelector((state) => state.auth);

  const conversationId = useSelector(
    (state) => state.conversation.direct_chat.current_conversation?.id
  );

  const user_id = window.localStorage.getItem("user_id");
  const { room_id } = useSelector((state) => state.app);

  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const handleStar = async (conversationId) => {
    try {
      console.log("staring message");
      dispatch(
        showSnackbar({
          severity: "success",
          message: !star ? `Message Stared` : "Message Unstared",
        })
      );
      const { data } = await axios.put(
        `/user/conversations/${conversationId}/${messageId}/star`,
        { star: !star }, // data object as second parameter
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(UpdateMessagesForStar({ messageId: messageId, star: !star }));
      dispatch(closeSnackBar);

      console.log("pinned chat sucess", data);
    } catch (error) {
      console.error("Failed to pin conversation", error);
    }
    handleClose();
  };

  const handleDeleteForMe = async (conversationId) => {
    try {
      console.log("Deleting for me");

      if (type && type == "live-loc") {
        navigator.geolocation.clearWatch(watchId);

        socket.emit("liveLocEnded", {
          conversationId: room_id,
          from: user_id,
          to: current_conversation?.user_id,
          messageId: messageId,
        });
        dispatch(
          showSnackbar({ severity: "success", message: "Live location ended" })
        );
      }

      const { data } = await axios.delete(
        `/user/deletemessage/${conversationId}/${messageId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(
        UpdateMessagesForDeleteForMe({
          messageId: messageId,
          conversationId: conversationId,
        })
      );
    } catch (error) {
      console.error("Failed to pin conversation", error);
    }
    handleClose();
  };

  const setdeletedForEveryoneToFalse = async (conversationId, messageId) => {
    try {
      // !the API functionality is shifted to socket event:
      // const { data } = await axios.put(
      //   `/user/updatedeleteforeveryone/${conversationId}/${messageId}`,
      //   {}, //empty data
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );
      // console.log("makeAPICALL",data);
      // if(data.conversationId == conversationId){
      //   console.log("+++++++");
      //   dispatch(UpdateMessagesForDeleteForEveryoneAsFalse({messageId: messageId}));
      // }

      console.log("fireing event"); //as msg time is over for using deleteforEveryone feature
      socket.emit(
        "updateDeleteForEveryoneToFalse",
        { conversationId: conversationId, messageId: messageId },
        (data) => {
          //callBack
          // console.log("data", data);
          if (data == conversationId) {
            //if same conversation is opened!
            // console.log("+++++++");
            dispatch(
              UpdateMessagesForDeleteForEveryoneAsFalse({
                messageId: messageId,
              })
            );
          }
        }
      );
    } catch (error) {
      console.error("Failed to setdeletedForEveryoneToFalse", error);
    }
    // setShowDeleteButton(false);
  };

  useEffect(() => {
    if (deletedForEveryone) {
      // console.log("timeOUT");
      // Check if 10 minutes have passed since the message was created
      const messageCreatedAt = new Date(created_at);
      const now = new Date();
      const tenMinutesInMs = 1 * 60 * 1000;

      if (now - messageCreatedAt > tenMinutesInMs) {
        // console.log("1timeOUT");
        setdeletedForEveryoneToFalse(conversationId, messageId); //*for testing purpose
        // setShowDeleteButton(false);
      } else {
        // Set a timeout to hide the button after 10 minutes
        // console.log("2timeOUT");
        const timeoutId = setTimeout(() => {
          setdeletedForEveryoneToFalse(conversationId, messageId);
        }, tenMinutesInMs - (now - messageCreatedAt));

        return () => clearTimeout(timeoutId);
      }
    }
  }, [created_at]);

  // console.log("showBTn", deletedForEveryone);

  const handleDeleteForEverone = async (conversationId, messageId) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
    socket.emit("deleteForEveryone", {
      conversationId: conversationId,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
    });
    handleClose();
  };

  return (
    <>
      <DotsThreeVertical
        size={20}
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      />
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <Stack spacing={1} px={1}>
          {Message_options.map((el) =>
            el?.title == "Reply" ? (
              <MenuItem
                onClick={() => {
                  dispatch(
                    UpdateReply_msg({
                      reply: true,
                      replyToMsg: replyToMsg,
                      messageId: messageId,
                    })
                  );
                  handleClose();
                  // dispatch(
                  //   showSnackbar({
                  //     severity: "success",
                  //     message: `Replying to ${replyToMsg}...`,
                  //   })
                  // );
                }}
              >
                {el.title}
              </MenuItem>
            ) : el?.title == "Star message" ? (
              <MenuItem
                onClick={() => {
                  handleStar(conversationId);
                }}
              >
                {!star ? "Star message" : "Unstar message"}
              </MenuItem>
            ) : el?.title == "React to message" ? (
              <MenuItem
                onClick={() => {
                  console.log("menu");
                  setOpenPicker(!openPicker);
                  handleClose();
                }}
              >
                {el.title}
              </MenuItem>
            ) : el?.title == "Delete for me" ? (
              <MenuItem
                onClick={() => {
                  handleDeleteForMe(conversationId);
                }}
              >
                {el.title}
              </MenuItem>
            ) : el?.title == "Delete for everyone" ? (
              deletedForEveryone &&
              !incomming && (
                <MenuItem
                  onClick={() => {
                    handleDeleteForEverone(conversationId, messageId);
                  }}
                >
                  {el.title}
                </MenuItem>
              )
            ) : (
              <MenuItem onClick={handleClose}>{el.title}</MenuItem>
            )
          )}
        </Stack>
      </Menu>
    </>
  );
};

const DocMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);

  const { token } = useSelector((state) => state.auth);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleDownload = async () => {
    // Check if the URL already contains /upload/ or /v
    const uploadIndex = el?.src.indexOf("/upload/");
    const versionIndex = el?.src.indexOf("/v");

    // Determine where to insert /fl_attachment/
    let insertIndex =
      uploadIndex !== -1
        ? uploadIndex + 8
        : versionIndex !== -1
        ? versionIndex
        : 0;

    // Insert /fl_attachment/
    const url =
      el?.src.slice(0, insertIndex) +
      "/fl_attachment/" +
      el?.src.slice(insertIndex);
    const link = document.createElement("a");
    link.href = url; // Set the href to the document URL
    link.setAttribute("download", el?.message || "document"); // Set the download attribute to initiate download
    document.body.appendChild(link); // Append the anchor element to the body
    link.click(); // Programmatically click the link to trigger download
    document.body.removeChild(link);
  };

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  const handleDownloadFromServer = async (path) => {
    const response = await axios.put(
      `/user/download`,
      { path: path }, // data object as second parameter
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // important
      }
    );

    // Create a new Blob object using the response data
    const blob = new Blob([response.data], { type: response.data.type });
    // Create a link element
    const link = document.createElement('a');
    // Set the download attribute with a filename
    link.href = window.URL.createObjectURL(blob);
    link.download = path.split('/').pop(); // Extract filename from path
    // Append to the document body
    document.body.appendChild(link);
    // Trigger click event on the link
    link.click();
    // Clean up and remove the link
    document.body.removeChild(link);
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={2}>
            <Stack
              p={2}
              direction="row"
              spacing={3}
              alignItems="center"
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
                cursor: "pointer", // Add cursor pointer to indicate clickable
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal();
              }} // Open modal on click of document preview area
            >
              <Image size={48} />
              <Typography variant="caption">{el?.message}</Typography>
              <IconButton>
                <DownloadSimple
                  onClick={(e) => {
                    e.stopPropagation();
                    if (el?.filePath) {
                      handleDownloadFromServer(el?.filePath);
                    } else {
                      handleDownload();
                    }
                  }}
                />
              </IconButton>
            </Stack>
            <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
              <Typography
                variant="body2"
                sx={{
                  color: el.incoming ? theme.palette.text.primary : "#fff",
                }}
              >
                {el.message}
              </Typography>
            </Tooltip>
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
          </Stack>
        )}
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}

        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="document-modal-title"
          aria-describedby="document-modal-description"
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
            {/* Display document preview */}
            <iframe
              src={el?.src}
              title="Document Preview"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "10px",
              }}
            />
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
      </Stack>
    </div>
  );
};

const LinkMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  const theme = useTheme();
  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={2}>
            <Stack
              p={2}
              spacing={3}
              alignItems={"start"}
              direction={"column"}
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
              }}
            >
              {/* <img
                src={el.message}
                alt={el.message}
                style={{ maxHeight: 210, borderRadius: "10px" }}
                loading="lazy"
              /> */}
              {/* <Stack spacing={2}>
                <Typography variant="subtitle2">creating chat app</Typography>
                <Typography
                  variant="subtitle2"
                  component={Link}
                  sx={{
                    color: theme.palette.primary.main,
                  }}
                  to={el?.message}
                >
                  www.linkedin.com
                </Typography>
              </Stack> */}
              <a style={{ color: "blue" }} href={el?.message} target="_blank">
                Click Here To Open
              </a>
              <Tooltip
                placement="left-start"
                title={formatDate(el?.created_at)}
              >
                <Typography
                  variant="body2"
                  // color={el.incoming ? theme.palette.text : "#fff"}
                  className={` ${
                    theme.palette.mode == "light"
                      ? "text-black"
                      : theme.palette.text
                  }`}
                >
                  {el.message}
                </Typography>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

const ReplyMsg = ({
  el,
  menu,
  messageRefs,
  setHighlightedMessageId,
  highlightedMessageId,
}) => {
  const theme = useTheme();

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  const dispatch = useDispatch();

  const scrollToMessage = (messageId) => {
    if (!menu) return;
    if (messageRefs.current[messageId]) {
      messageRefs.current[messageId].scrollIntoView({ behavior: "smooth" });
      setHighlightedMessageId(messageId);
    } else {
      dispatch(
        showSnackbar({
          severity: "error",
          message:
            "Either message was deleted or the message is not yet loaded in the chat",
        })
      );
    }
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={2}>
            {/* <a href={`#${el?.replyToMsgId}`}> */}
            <Stack
              className="border-l-4 border-l-purple-600"
              p={2}
              direction={"column"}
              spacing={3}
              alignItems={"center"}
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
              }}
              onClick={() => scrollToMessage(el?.replyToMsgId)}
            >
              <Typography variant="body2" color={theme.palette.text}>
                {el?.replyToMsg}
              </Typography>
            </Stack>
            {/* </a> */}
            <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
              <Typography
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                {el.message}
              </Typography>
            </Tooltip>
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

// for images
const MediaMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  const theme = useTheme();

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={1} sx={{ maxWidth: "100%", width: "210px" }}>
            <img
              src={el?.src}
              alt={el.message}
              loading="lazy"
              style={{
                width: "100%",
                height: "210px",
                objectFit: "contain",
                borderRadius: "10px",
                cursor: "pointer", // Add cursor pointer to indicate clickable
              }}
              onClick={handleOpenModal} // Open modal on image click
            />
            <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
              <Typography
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                {el.message}
              </Typography>
            </Tooltip>
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
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
            <img
              src={el?.src}
              alt={el.message}
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
      </Stack>
    </div>
  );
};

const VideoMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={1} sx={{ maxWidth: "100%", width: "250px" }}>
            <video
              src={el?.src}
              type={el?.type} // Specify the video type if known
              // controls
              style={{
                width: "100%",
                height: "210px",
                objectFit: "cover",
                borderRadius: "10px",
                cursor: "pointer",
              }}
              onClick={handleOpenModal}
            />
            <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
              <Typography
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                {el.message}
              </Typography>
            </Tooltip>
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
          </Stack>
        )}

        {/* Modal for displaying larger video */}
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="video-modal-title"
          aria-describedby="video-modal-description"
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
            <video
              src={`${el?.src}?v=${Date.now()}`}
              type={el?.type} // Specify the video type if known
              controls
              // autoPlay
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
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
      </Stack>
    </div>
  );
};

const TextMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  // console.log("test message pushed");
  const theme = useTheme();

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        {/* <div className={`${el?.id==highlightedMessageId ? ' mt-2 block w-[500px] h-10 ' : 'hidden'}`}>
        
      </div> */}
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el?.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
            <Typography
              variant="body2"
              color={el.incoming ? theme.palette.text : "#fff"}
            >
              {el.message}
            </Typography>
          </Tooltip>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

const DeletedMsg = ({ el, menu }) => {
  // console.log("test message pushed");
  const theme = useTheme();

  return (
    <div>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          px={1.5}
          py={1}
          sx={{
            backgroundColor: "#919EAB",
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha("#919EAB", 1)} transparent transparent`
                : `transparent transparent transparent ${"#919EAB"}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
        >
          <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
            <Typography
              variant="caption"
              color={el.incoming ? theme.palette.text : "#fff"}
              sx={{ fontStyle: "italic" }}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
              }}
            >
              <XCircle size={20} />
              {"This message was deleted"}
            </Typography>
          </Tooltip>
        </Box>
      </Stack>
    </div>
  );
};

const LocMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  const theme = useTheme();

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  const customIcon = new Icon({
    // iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
    iconUrl: icon,
    iconSize: [38, 38], // size of the icon
  });

  const customIconForMyLoc = new Icon({
    // iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
    iconUrl: myLoc,
    iconSize: [38, 38], // size of the icon
  });

  const [myCoordinates, setMyCoordinates] = useState([]);

  useEffect(() => {
    console.log("useeffetc");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyCoordinates([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.log(err.message);
          setMyCoordinates(null);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setMyCoordinates(null);
    }
  }, [openModal]);

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "340px",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={1} sx={{ maxWidth: "100%" }}>
            <div
              className="border w-full -z-0"
              style={{
                height: "210px",
                borderRadius: "10px",
                cursor: "pointer", // Add cursor pointer to indicate clickable
              }}
              onClick={handleOpenModal} // Open modal on image click
            >
              <MapContainer
                center={el?.coordinates}
                zoom={9}
                scrollWheelZoom={false}
                zoomControl={false}
                dragging={false}
                attributionControl={false}
                doubleClickZoom={false}
              >
                {/* OPEN STREEN MAPS TILES */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Hard coded markers */}
                <Marker position={el?.coordinates} icon={customIcon}>
                  {/* <Popup>{el?.message}</Popup> */}
                  {/* <TP>{el?.message}</TP> */}
                </Marker>
                {/* <Marker position={myCoordinates} icon={customIconForMyLoc}>
                    <Popup>My Locaiton</Popup>
                    <TP>Your Location</TP>
                  </Marker> */}
              </MapContainer>
            </div>
            <Tooltip placement="left-start" title={formatDate(el?.created_at)}>
              <Typography
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                {el.message}
              </Typography>
            </Tooltip>
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
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
              width: "90%",
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
            {/* <div style={{width:'90%', height:'90%'}}> */}
            <MapContainer
              center={el?.coordinates}
              zoom={10}
              attributionControl={false}
            >
              {/* OPEN STREEN MAPS TILES */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarkerClusterGroup chunkedLoading>
                {/* Hard coded markers */}
                {el?.coordinates && (
                  <Marker position={el?.coordinates} icon={customIcon}>
                    <Popup>{el?.message}</Popup>
                    <TP>{el?.message}</TP>
                  </Marker>
                )}
                {myCoordinates && (
                  <Marker position={myCoordinates} icon={customIconForMyLoc}>
                    <Popup>My Locaiton</Popup>
                    <TP>Your Location</TP>
                  </Marker>
                )}
              </MarkerClusterGroup>
            </MapContainer>
            {/* </div> */}
            <IconButton
              aria-label="Close modal"
              onClick={handleCloseModal}
              className="z-10"
              sx={{
                position: "absolute",
                top: 5,
                right: 5,
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
      </Stack>
    </div>
  );
};

const LiveLocMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  const theme = useTheme();

  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    console.log("dd");
    if (!el?.isLiveLocationSharing) {
      dispatch(
        showSnackbar({ severity: "error", message: "Live location ended" })
      );
      return;
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { isLiveLocationSharing } = useSelector((state) => state.app.user);

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  const customIcon = new Icon({
    // iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
    iconUrl: icon,
    iconSize: [38, 38], // size of the icon
  });

  const customIconForMyLoc = new Icon({
    // iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
    iconUrl: myLoc,
    iconSize: [38, 38], // size of the icon
  });

  const [myCoordinates, setMyCoordinates] = useState(null);

  useEffect(() => {
    console.log("useeffetc");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyCoordinates([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.log(err.message);
          setMyCoordinates(null);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setMyCoordinates(null);
    }
  }, [openModal]);

  const handleCloseLiveLocation = async (watchId, messageId) => {
    navigator.geolocation.clearWatch(watchId);

    socket.emit("liveLocEnded", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
    });
    dispatch(
      showSnackbar({ severity: "success", message: "Live location ended" })
    );
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "340px",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>
          <Stack spacing={1} sx={{ maxWidth: "100%" }}>
            {el?.incoming ? (
              <div
                className={`border w-full ${
                  el?.isLiveLocationSharing ? "opacity-100" : "opacity-40"
                } -z-0`}
                style={{
                  height: "210px",
                  borderRadius: "10px",
                  cursor: "pointer", // Add cursor pointer to indicate clickable
                }}
                onClick={handleOpenModal} // Open modal
              >
                <MapContainer
                  center={current_conversation?.coordinates}
                  zoom={10}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  dragging={false}
                  attributionControl={false}
                  doubleClickZoom={false}
                >
                  {/* OPEN STREEN MAPS TILES */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Hard coded markers */}
                  <Marker
                    position={current_conversation?.coordinates}
                    icon={customIcon}
                  >
                    {/* <Popup>{el?.message}</Popup> */}
                    {/* <TP>{el?.message}</TP> */}
                  </Marker>
                  {/* <Marker position={myCoordinates} icon={customIconForMyLoc}>
                    <Popup>My Locaiton</Popup>
                    <TP>Your Location</TP>
                  </Marker> */}
                </MapContainer>
              </div>
            ) : (
              <div
                className={`border w-full ${
                  el?.isLiveLocationSharing ? "opacity-100" : "opacity-55"
                } -z-0`}
                style={{
                  height: "210px",
                  borderRadius: "10px",
                  cursor: "pointer", // Add cursor pointer to indicate clickable
                }}
              >
                <MapContainer
                  center={[31, 80]}
                  zoom={3}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  dragging={false}
                  attributionControl={false}
                  doubleClickZoom={false}
                >
                  {/* OPEN STREEN MAPS TILES */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </MapContainer>
              </div>
            )}
            {el?.outgoing ? (
              <button
                disabled={el?.isLiveLocationSharing ? false : true}
                onClick={() => handleCloseLiveLocation(el?.watchId, el?.id)}
                className={`border  rounded-md transition-all duration-300 bg-blue-950 py-1 ${
                  el?.isLiveLocationSharing ? "animate-pulse" : "animate-none"
                }  ${
                  el?.isLiveLocationSharing ? "hover:scale-[0.95]" : ""
                } hover:animate-none select-none text-white`}
              >
                {el?.isLiveLocationSharing
                  ? "Stop sharing location"
                  : "Live location ended"}
              </button>
            ) : (
              <Tooltip
                placement="left-start"
                title={formatDate(el?.created_at)}
              >
                <Typography
                  variant="body2"
                  color={el.incoming ? theme.palette.text : "#fff"}
                >
                  {el?.isLiveLocationSharing
                    ? el?.message
                    : "Live location ended"}
                </Typography>
              </Tooltip>
            )}
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
            watchId={el?.watchId}
            type={el?.subtype}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
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
              width: "90%",
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
            {/* <div style={{width:'90%', height:'90%'}}> */}
            <MapContainer
              center={current_conversation?.coordinates}
              zoom={10}
              attributionControl={false}
            >
              {/* OPEN STREEN MAPS TILES */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarkerClusterGroup chunkedLoading>
                {/* Hard coded markers */}
                {current_conversation?.coordinates && (
                  <Marker
                    position={current_conversation?.coordinates}
                    icon={customIcon}
                  >
                    <Popup>{el?.message}</Popup>
                    <TP>{el?.message}</TP>
                  </Marker>
                )}
                {myCoordinates && (
                  <Marker position={myCoordinates} icon={customIconForMyLoc}>
                    <Popup>My Locaiton</Popup>
                    <TP>Your Location</TP>
                  </Marker>
                )}
              </MarkerClusterGroup>
            </MapContainer>
            {/* </div> */}
            <IconButton
              aria-label="Close modal"
              onClick={handleCloseModal}
              className="z-10"
              sx={{
                position: "absolute",
                top: 5,
                right: 5,
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
      </Stack>
    </div>
  );
};

const VoiceMsg = ({ el, menu, messageRefs, highlightedMessageId }) => {
  // console.log("test message pushed");
  const theme = useTheme();

  const [openPicker, setOpenPicker] = useState(false);
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sideBar } = useSelector((state) => state.app);
  const { room_id } = useSelector((state) => state.app);
  const user_id = window.localStorage.getItem("user_id");
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  function handleEmojiClick(emoji, messageId) {
    socket.emit("react_to_message", {
      conversationId: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      messageId: messageId,
      reaction: emoji,
    });
    setOpenPicker(!openPicker);
  }

  const handleOpenClick = () => {
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  const playbackRates = [1, 1.25, 1.5, 0.75];
  const [currentRateIndex, setCurrentRateIndex] = useState(0);

  const [audioMessage, setaudioMessage] = useState(null);
  const [currentPlayBackTime, setcurrentPlayBackTime] = useState(0);
  const [totalDuration, settotalDuration] = useState(0);
  const [isPlaying, setisPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const waveformRef = useRef(null);
  const waveform = useRef(null);

  useEffect(() => {
    if (el?.src) {
      waveform.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#ccc",
        progressColor: "#4a9eff",
        cursorColor: "#7ae3c3",
        barWidth: 2,
        height: 30,
        responsive: true,
      });

      const updatePlaybackTime = () => {
        setcurrentPlayBackTime(waveform.current.getCurrentTime());
      };

      waveform.current.on("audioprocess", updatePlaybackTime);

      waveform.current.on("finish", () => {
        setisPlaying(false);
      });
    }
    return () => {
      waveform.current.destroy();
    };
  }, []);

  useEffect(() => {
    const currentRate = playbackRates[currentRateIndex];
    waveform.current.setPlaybackRate(currentRate);
  }, [currentRateIndex]);

  useEffect(() => {
    const audio = new Audio(el?.src);
    // console.log('asa',audio)
    setaudioMessage(audio);
    waveform.current.load(el?.src);
    waveform.current.on("ready", () => {
      settotalDuration(waveform.current.getDuration());
    });
  }, [el]);

  // useEffect(() => {
  //   if (audioMessage) {
  //     const updatePlayBackTime = () => {
  //       setcurrentPlayBackTime(audioMessage.currentTime);
  //     };
  //     audioMessage.addEventListener("timeupdate", updatePlayBackTime);

  //     return () => {
  //       audioMessage.removeEventListener("timeupdate", updatePlayBackTime);
  //     };
  //   }
  // }, [audioMessage]);

  const handleIncreaseSpeed = (e) => {
    e.stopPropagation();
    setCurrentRateIndex((prevIndex) => (prevIndex + 1) % playbackRates.length);
  };

  const handlePlayAudio = () => {
    if (audioMessage) {
      // waveform.current.stop();
      waveform.current.play();
      // audioMessage.play();
      setisPlaying(true);
    }
  };

  const handlePauseAudio = () => {
    // setCurrentTime(audioMessage.currentTime); // Save current time
    waveform.current.pause();
    // audioMessage.pause();
    setisPlaying(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div ref={(thisEle) => (messageRefs.current[el?.id] = thisEle)}>
      <Stack
        direction="row"
        justifyContent={el.incoming ? "start" : "end"}
        sx={{ position: "relative" }}
      >
        <Box
          className={`transition-transform duration-1000 ${
            el?.id == highlightedMessageId
              ? el?.incoming
                ? "translate-x-96 ease-in-out border-4 border-red-500"
                : "-translate-x-80 ease-in-out border-4 border-red-500"
              : null
          }`}
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            position: "relative",
            cursor: "pointer",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-2px",
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: el.incoming ? "0 22px 22px 0" : "0 0 20px 20px",
              borderColor: el.incoming
                ? `transparent ${alpha(
                    theme.palette.background.default,
                    1
                  )} transparent transparent`
                : `transparent transparent transparent ${theme.palette.primary.main}`,
              left: el.incoming ? "-8px" : "unset",
              right: el.incoming ? "unset" : "-8px",
              transform: el.incoming ? "rotate(20deg)" : "rotate(-20deg)",
            },
          }}
          onDoubleClick={() => {
            if (!el?.myReaction && menu) {
              // console.log("double click");
              socket.emit("react_to_message", {
                conversationId: room_id,
                from: user_id,
                to: current_conversation?.user_id,
                messageId: el?.id,
                reaction: "❤️",
              });
            }
          }}
        >
          <Typography
            variant="capton"
            style={{
              fontSize: "10px",
              position: "absolute",
              bottom: "-3px",
              right: "4px",
            }}
          >
            {el?.time}
          </Typography>
          <div
            className="reactions"
            style={{
              zIndex: 10,
              position: "fixed",
              display: openPicker ? "inline" : "none",
              bottom: 100,
              right: isMobile ? 20 : sideBar.open ? 420 : 100,
            }}
          >
            <Picker
              data={data}
              // perLine={9} //The number of emojis to show per line
              previewPosition={"none"}
              searchPosition={"none"}
              onClickOutside={() => handleOpenClick()}
              theme={theme.palette.mode}
              onEmojiSelect={(emoji) => {
                handleEmojiClick(emoji.native, el?.id);
              }}
            />
          </div>

          <div className="flex items-center gap-5 text-white px-4 pr-2 py-4 text-sm rounded-md">
            <div className={`cursor-pointer text-xl`}>
              {!isPlaying ? (
                <FaPlay
                  onClick={handlePlayAudio}
                  className={`hover:text-green-500 ${
                    el?.incoming && theme.palette.mode == "light"
                      ? "text-gray-500"
                      : null
                  } transition-colors duration-300`}
                />
              ) : (
                <FaStop
                  onClick={handlePauseAudio}
                  className={`hover:text-green-500 ${
                    el?.incoming && theme.palette.mode == "light"
                      ? "text-gray-500"
                      : null
                  } transition-colors duration-300`}
                />
              )}
            </div>

            <div className=" relative">
              <div className=" flex flex-row justify-between gap-2 items-center">
                <div className=" w-60" ref={waveformRef} />
                <div
                  className={`rounded-[10px] select-none w-10 cursor-pointer font-semibold bg-white text-black text-center ${
                    theme.palette.mode == "light" && el?.incoming
                      ? "bg-gray-500 text-[#ffff]"
                      : null
                  } `}
                  onClick={(e) => handleIncreaseSpeed(e)}
                >
                  {playbackRates[currentRateIndex]}x
                </div>
              </div>
              <div className="text-white text-[11px] pt-1 flex justify-between absolute bottom-[-22px] w-full">
                <span
                  className={`${
                    el?.incoming && theme.palette.mode == "light"
                      ? "text-gray-600"
                      : null
                  }`}
                >
                  {formatTime(isPlaying ? currentPlayBackTime : totalDuration)}
                </span>
              </div>
            </div>
          </div>

          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"end"}
            sx={{ marginTop: "3px" }}
          >
            {el?.star && <Star size={13} color="black" weight="duotone" />}
          </Stack>
          {(el?.myReaction || el?.otherReaction) && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              gap={"1px"}
              style={{
                position: "absolute",
                bottom: "-20px",
                left: "0px",
                fontSize: "1.5rem",
                userSelect: "none",
              }}
            >
              <Box
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (menu) {
                    socket.emit("react_to_message", {
                      conversationId: room_id,
                      from: user_id,
                      to: current_conversation?.user_id,
                      messageId: el?.id,
                      reaction: null,
                    });
                  }
                }}
              >
                {el?.myReaction && (
                  <Tooltip
                    placement="left-end"
                    title={menu && "remove my reaction"}
                  >
                    {el?.myReaction}
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ cursor: "default" }}>
                {el?.otherReaction && (
                  <Tooltip
                    placement="right-end"
                    title={`${
                      current_conversation?.name.split(" ")[0]
                    } reaction`}
                  >
                    {el?.otherReaction}
                  </Tooltip>
                )}
              </Box>
            </Stack>
          )}
        </Box>
        {menu && (
          <MessageOption
            replyToMsg={el?.message}
            messageId={el?.id}
            star={el?.star}
            openPicker={openPicker}
            setOpenPicker={setOpenPicker}
            deletedForEveryone={el?.deletedForEveryone}
            created_at={el?.created_at}
            incomming={el?.incoming}
          />
        )}
        {menu && (
          <Stack
            justifyContent={"flex-end"}
            sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
          >
            {!el.incoming &&
              (el?.status == "Sent" ? (
                <Check size={22} color="#908989" />
              ) : el?.status == "Delivered" ? (
                <Checks size={22} color="#908989" />
              ) : (
                <Checks size={22} color="#0949dc" />
              ))}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

const Timeline = ({ el }) => {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems={"center"}
      justifyContent={"space-between"}
    >
      <Divider width="46%" />
      <Typography variant="caption" sx={{ color: theme.palette.text }}>
        {" "}
        {el.text}{" "}
      </Typography>
      <Divider width="46%" />
    </Stack>
  );
};

const NewMessage = ({ el }) => {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems={"center"}
      justifyContent={"space-between"}
    >
      <Divider width="39%" />
      <span className=" text-wrap text-xl">Start Chatting</span>
      <Divider width="39%" />
    </Stack>
  );
};

export {
  Timeline,
  TextMsg,
  MediaMsg,
  ReplyMsg,
  LinkMsg,
  DocMsg,
  VideoMsg,
  DeletedMsg,
  LocMsg,
  LiveLocMsg,
  VoiceMsg,
  NewMessage,
};
