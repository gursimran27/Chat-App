import React, { useState } from "react";
import {
  Box,
  Badge,
  Stack,
  Avatar,
  Typography,
  MenuItem,
  Menu,
  Tooltip,
} from "@mui/material";
import { styled, useTheme, alpha } from "@mui/material/styles";
// import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  SelectConversation,
  ToggleSidebar,
  UpdateSidebarType,
  closeSnackBar,
  showSnackbar,
} from "../redux/slices/app";
import {
  ClearCurrentMessagesAndCurrentConversation,
  DeleteChat,
  UpdateConversationUnread,
  UpdateDirectConversationForPinnedChat,
  UpdateHasMore,
  UpdatePage,
  UpdateReply_msg,
} from "../redux/slices/conversation";
import { DotsThreeVertical } from "phosphor-react";
import axios from "../utils/axios";
import Carousels from "../pages/dashboard/Carousel";

const Message_options = [
  {
    title: "Pin Chat",
  },
  {
    title: "Delete Chat",
  },
  {
    title: "Report",
  },
];

const truncateText = (string, n) => {
  return string?.length > n ? `${string?.slice(0, n)}...` : string;
};

const StyledChatBox = styled(Box)(({ theme }) => ({
  "&:hover": {
    cursor: "pointer",
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const MessageOption = ({ conversationId, name, pinned }) => {
  const { sideBar } = useSelector((state) => state.app);
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

  const handlePin = async (conversationId) => {
    try {
      dispatch(
        showSnackbar({
          severity: "success",
          message: `Pinning Chat of  ${name}`,
        })
      );
      const { data } = await axios.put(
        `/user/conversations/${conversationId}/pin`,
        {}, // Empty data object as second parameter
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(
        UpdateDirectConversationForPinnedChat({
          this_conversation_id: conversationId,
          pinned: true,
        })
      );
      dispatch(closeSnackBar);

      console.log("pinned chat sucess", data);
    } catch (error) {
      console.error("Failed to pin conversation", error);
    }
    handleClose();
  };

  const handleUnpin = async (conversationId) => {
    try {
      dispatch(
        showSnackbar({
          severity: "success",
          message: `UnPinning Chat of  ${name}`,
        })
      );
      const { data } = await axios.put(
        `/user/conversations/${conversationId}/unpin`,
        {}, // Empty data object as second parameter
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(
        UpdateDirectConversationForPinnedChat({
          this_conversation_id: conversationId,
          pinned: false,
        })
      );
      dispatch(closeSnackBar);
      console.log("unpinned chat sucess", data);
    } catch (error) {
      console.error("Failed to pin conversation", error);
    }
    handleClose();
  };

  const handleDeleteChat = async (conversationId) => {
    try {
      const response = await axios.put(
        `user/deleteChat/${conversationId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      dispatch(SelectConversation({ room_id: null }));
      dispatch(ClearCurrentMessagesAndCurrentConversation());
      dispatch(
        UpdateReply_msg({ reply: false, replyToMsg: null, messageId: null })
      );
      dispatch(UpdatePage({ page: 2 }));
      dispatch(UpdateHasMore({ hasMore: true }));
      if (sideBar.open) {
        dispatch(ToggleSidebar());
        dispatch(UpdateSidebarType("CONTACT"));
      }

      dispatch(DeleteChat({ conversationId: response?.data?.conversationId }));
    } catch (error) {
      console.error("Error deleting the chat", error);
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
            el?.title == "Pin Chat" ? (
              <MenuItem
                onClick={() => {
                  if (pinned) {
                    handleUnpin(conversationId);
                  } else {
                    handlePin(conversationId);
                  }
                }}
              >
                {!pinned ? el?.title : "Unpin Chat"}
              </MenuItem>
            ) : el.title == "Delete Chat" ? (
              <MenuItem onClick={() => handleDeleteChat(conversationId)}>
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

const ChatElement = ({
  img,
  name,
  msg,
  time,
  unread,
  online,
  id,
  pinned,
  statuses,
  user_id,
  typing,
  recordingAudio,
}) => {
  // console.log("msg",msg);
  const dispatch = useDispatch();
  const { room_id } = useSelector((state) => state.app); //state variable
  // const selectedChatId = room_id?.toString();
  // console.log(`room-id=${selectedChatId } and id=${id}`)

  // let isSelected = +selectroom_idedChatId == id;
  let isSelected = room_id == id;

  // if (!room_id) {
  //   isSelected = false;
  // }
  const { friends } = useSelector((state) => state?.app?.user);
  const theme = useTheme();

  const [openStatusModal, setOpenStatusModal] = useState(false);

  const handleopenStatusModal = () => {
    setOpenStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setOpenStatusModal(false);
  };

  const handleClickAvatar = (e) => {
    if (statuses?.length > 0 && friends.includes(user_id)) {
      e.stopPropagation();
      handleopenStatusModal();
    }
  };

  return (
    <Stack direction="row">
      <StyledChatBox
        onClick={() => {
          if (id == room_id) return;
          dispatch(ClearCurrentMessagesAndCurrentConversation());
          dispatch(SelectConversation({ room_id: id }));
          dispatch(UpdateConversationUnread({ conversationId: id }));
        }}
        sx={{
          width: "100%",

          borderRadius: 1,

          backgroundColor: isSelected
            ? theme.palette.mode === "light"
              ? alpha(theme.palette.primary.main, 0.5)
              : theme.palette.primary.main
            : theme.palette.mode === "light"
            ? "#fff"
            : theme.palette.background.paper,

          // backgroundColor:theme.palette.mode==="light" ? "#fff" : theme.palette.background.paper,
        }}
        p={2}
      >
        <Stack
          direction="row"
          alignItems={"center"}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1}>
            {" "}
            <div onClick={(e) => handleClickAvatar(e)} className=" relative">
              {online && friends.includes(user_id) ? (
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                >
                  <Avatar
                    alt={name}
                    src={img}
                    className={`${
                      statuses?.length > 0 && friends.includes(user_id)
                        ? "border-[3.5px] border-green-600"
                        : null
                    }`}
                  />
                </StyledBadge>
              ) : (
                <Avatar
                  alt={name}
                  src={img}
                  className={`${
                    statuses?.length > 0 && friends.includes(user_id)
                      ? "border-[3.5px] border-green-600"
                      : null
                  }`}
                />
              )}
              {statuses?.length > 0 && friends.includes(user_id) && (
                <Tooltip placement="left-end" title="Statueses">
                  <div className=" text-sm absolute -top-1 bg-green-400 rounded-full text-black w-5 flex items-center justify-center -left-2 animate-bounce">
                    {statuses?.length}
                  </div>
                </Tooltip>
              )}
            </div>
            <Stack spacing={0.3}>
              <Typography variant="subtitle2">{name}</Typography>
              <Typography variant="caption">
                {typing
                  ? <span className={` ${theme.palette.mode === "light" ? ' text-orange-700' : 'text-green-500'}`}>Typing...</span>
                  : recordingAudio
                  ? <span className={` ${theme.palette.mode === "light" ? ' text-orange-700' : 'text-green-500'}`}>Recording audio...</span>
                  : truncateText(msg, 15)}
              </Typography>
            </Stack>
          </Stack>
          <Stack spacing={2} alignItems={"center"}>
            <Typography sx={{ fontWeight: 600 }} variant="caption">
              {time}
            </Typography>
            <Badge
              className="unread-count"
              color="primary"
              badgeContent={unread}
            />
          </Stack>
        </Stack>
      </StyledChatBox>
      <MessageOption conversationId={id} name={name} pinned={pinned} />
      {openStatusModal && (
        <Carousels
          openStatusModal={openStatusModal}
          handleCloseStatusModal={handleCloseStatusModal}
          owner={false}
          status={statuses}
        />
      )}
    </Stack>
  );
};

export default ChatElement;
