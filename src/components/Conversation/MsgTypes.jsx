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
import React, { useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Check,
  Checks,
  DotsThreeVertical,
  DownloadSimple,
  Image,
  Star,
  X,
} from "phosphor-react";
import { Message_options } from "../../data";
import { useDispatch, useSelector } from "react-redux";
import {
  UpdateMessagesForStar,
  UpdateReply_msg,
} from "../../redux/slices/conversation";
import { closeSnackBar, showSnackbar } from "../../redux/slices/app";
import axios from "../../utils/axios";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import useResponsive from "../../hooks/useResponsive";
import { socket } from "../../socket";
// import "./MsgTypes.css"

// TODO HOF

const MessageOption = ({
  openPicker,
  setOpenPicker,
  replyToMsg,
  messageId,
  star,
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
    (state) => state.conversation.direct_chat.current_conversation.id
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
        { star: !star }, // Empty data object as second parameter
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
                    UpdateReply_msg({ reply: true, replyToMsg: replyToMsg })
                  );
                  handleClose();
                  dispatch(
                    showSnackbar({
                      severity: "success",
                      message: `Replying to ${replyToMsg}...`,
                    })
                  );
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
            ) : (
              <MenuItem onClick={handleClose}>{el.title}</MenuItem>
            )
          )}
        </Stack>
      </Menu>
    </>
  );
};

const DocMsg = ({ el, menu }) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);

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

  return (
    <Stack
      direction="row"
      justifyContent={el.incoming ? "start" : "end"}
      sx={{ position: "relative" }}
    >
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.default, 1)
            : theme.palette.primary.main,
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
      >
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
                  handleDownload();
                }}
              />
            </IconButton>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: el.incoming ? theme.palette.text.primary : "#fff",
            }}
          >
            {el.message}
          </Typography>
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
            }}
          >
            <Box
              sx={{ cursor: "pointer" }}
              onClick={() => {
                socket.emit("react_to_message", {
                  conversationId: room_id,
                  from: user_id,
                  to: current_conversation?.user_id,
                  messageId: el?.id,
                  reaction: null,
                });
              }}
            >
              {el?.myReaction && (
                <Tooltip placement="left-end" title={"remove my reaction"}>
                  {el?.myReaction}
                </Tooltip>
              )}
            </Box>

            <Box>
              {el?.otherReaction && (
                <Tooltip
                  placement="right-end"
                  title={`${current_conversation?.name.split(" ")[0]} reaction`}
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
  );
};

const LinkMsg = ({ el, menu }) => {
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
    <Stack
      direction="row"
      justifyContent={el.incoming ? "start" : "end"}
      sx={{ position: "relative" }}
    >
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.default, 1)
            : theme.palette.primary.main,
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
      >
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
            <Typography
              variant="body2"
              color={el.incoming ? theme.palette.text : "#fff"}
            >
              {el.message}
            </Typography>
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
            }}
          >
            <Box
              sx={{ cursor: "pointer" }}
              onClick={() => {
                socket.emit("react_to_message", {
                  conversationId: room_id,
                  from: user_id,
                  to: current_conversation?.user_id,
                  messageId: el?.id,
                  reaction: null,
                });
              }}
            >
              {el?.myReaction && (
                <Tooltip placement="left-end" title={"remove my reaction"}>
                  {el?.myReaction}
                </Tooltip>
              )}
            </Box>

            <Box>
              {el?.otherReaction && (
                <Tooltip
                  placement="right-end"
                  title={`${current_conversation?.name.split(" ")[0]} reaction`}
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
  );
};

const ReplyMsg = ({ el, menu }) => {
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
    <Stack
      direction="row"
      justifyContent={el.incoming ? "start" : "end"}
      sx={{ position: "relative" }}
    >
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.default, 1)
            : theme.palette.primary.main,
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
      >
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
            direction={"column"}
            spacing={3}
            alignItems={"center"}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color={theme.palette.text}>
              {el?.replyToMsg}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el?.message}
          </Typography>
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
            }}
          >
            <Box
              sx={{ cursor: "pointer" }}
              onClick={() => {
                socket.emit("react_to_message", {
                  conversationId: room_id,
                  from: user_id,
                  to: current_conversation?.user_id,
                  messageId: el?.id,
                  reaction: null,
                });
              }}
            >
              {el?.myReaction && (
                <Tooltip placement="left-end" title={"remove my reaction"}>
                  {el?.myReaction}
                </Tooltip>
              )}
            </Box>

            <Box>
              {el?.otherReaction && (
                <Tooltip
                  placement="right-end"
                  title={`${current_conversation?.name.split(" ")[0]} reaction`}
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
  );
};

// for images
const MediaMsg = ({ el, menu }) => {
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
    <Stack
      direction="row"
      justifyContent={el.incoming ? "start" : "end"}
      sx={{ position: "relative" }}
    >
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.default, 1)
            : theme.palette.primary.main,
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
      >
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
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el.message}
          </Typography>
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
            }}
          >
            <Box
              sx={{ cursor: "pointer" }}
              onClick={() => {
                socket.emit("react_to_message", {
                  conversationId: room_id,
                  from: user_id,
                  to: current_conversation?.user_id,
                  messageId: el?.id,
                  reaction: null,
                });
              }}
            >
              {el?.myReaction && (
                <Tooltip placement="left-end" title={"remove my reaction"}>
                  {el?.myReaction}
                </Tooltip>
              )}
            </Box>

            <Box>
              {el?.otherReaction && (
                <Tooltip
                  placement="right-end"
                  title={`${current_conversation?.name.split(" ")[0]} reaction`}
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
  );
};

const VideoMsg = ({ el, menu }) => {
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
    <Stack
      direction="row"
      justifyContent={el.incoming ? "start" : "end"}
      sx={{ position: "relative" }}
    >
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.default, 1)
            : theme.palette.primary.main,
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
      >
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
            controls
            style={{
              width: "100%",
              height: "210px",
              objectFit: "cover",
              borderRadius: "10px",
              cursor: "pointer",
            }}
            onClick={handleOpenModal}
          />
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text.primary : "#fff"}
          >
            {el.message}
          </Typography>
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
            }}
          >
            <Box
              sx={{ cursor: "pointer" }}
              onClick={() => {
                socket.emit("react_to_message", {
                  conversationId: room_id,
                  from: user_id,
                  to: current_conversation?.user_id,
                  messageId: el?.id,
                  reaction: null,
                });
              }}
            >
              {el?.myReaction && (
                <Tooltip placement="left-end" title={"remove my reaction"}>
                  {el?.myReaction}
                </Tooltip>
              )}
            </Box>

            <Box>
              {el?.otherReaction && (
                <Tooltip
                  placement="right-end"
                  title={`${current_conversation?.name.split(" ")[0]} reaction`}
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
            src={el?.src}
            type={el?.type} // Specify the video type if known
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
  );
};

const TextMsg = ({ el, menu }) => {
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
    <Stack
      direction="row"
      justifyContent={el.incoming ? "start" : "end"}
      sx={{ position: "relative" }}
    >
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.default, 1)
            : theme.palette.primary.main,
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
      >
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
        <Typography
          variant="body2"
          color={el.incoming ? theme.palette.text : "#fff"}
        >
          {el.message}
        </Typography>
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
            }}
          >
            <Box
              sx={{ cursor: "pointer" }}
              onClick={() => {
                socket.emit("react_to_message", {
                  conversationId: room_id,
                  from: user_id,
                  to: current_conversation?.user_id,
                  messageId: el?.id,
                  reaction: null,
                });
              }}
            >
              {el?.myReaction && (
                <Tooltip placement="left-end" title={"remove my reaction"}>
                  {el?.myReaction}
                </Tooltip>
              )}
            </Box>

            <Box>
              {el?.otherReaction && (
                <Tooltip
                  placement="right-end"
                  title={`${current_conversation?.name.split(" ")[0]} reaction`}
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
        {el.text}
      </Typography>
      <Divider width="46%" />
    </Stack>
  );
};

export { Timeline, TextMsg, MediaMsg, ReplyMsg, LinkMsg, DocMsg, VideoMsg };
