import React from "react";
import {
  Box,
  Badge,
  Stack,
  Avatar,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Chat } from "phosphor-react";
import { socket } from "../socket";
import {
  SelectConversation,
  ToggleSidebar,
  UpdateSidebarType,
} from "../redux/slices/app";
import {
  ClearCurrentMessagesAndCurrentConversation,
  UpdateHasMore,
  UpdatePage,
  UpdateReply_msg,
} from "../redux/slices/conversation";
import { useDispatch, useSelector } from "react-redux";

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

const UserElement = ({ avatar, firstName, lastName, status, _id }) => {
  const user_id = window.localStorage.getItem("user_id");
  const theme = useTheme();

  const name = `${firstName} ${lastName}`;

  return (
    <StyledChatBox
      sx={{
        width: "100%",

        borderRadius: 1,

        backgroundColor: theme.palette.background.paper,
      }}
      p={2}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {" "}
          {false ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar alt={name} src={avatar || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`} />
            </StyledBadge>
          ) : (
            <Avatar alt={name} src={avatar || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`} />
          )}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">{name}</Typography>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          <Button
            onClick={() => {
              console.log("entering...");
              socket.emit("friend_request", { to: _id, from: user_id }, () => {
                // alert("request sent");
                console.log("rquest sent");
              });
            }}
          >
            Send Request
          </Button>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

const FriendRequestElement = ({
  avatar,
  firstName,
  lastName,
  incoming,
  missed,
  status,
  id,
  handleClose
}) => {
  const user_id = window.localStorage.getItem("user_id");
  const theme = useTheme();

  const name = `${firstName} ${lastName}`;

  return (
    <StyledChatBox
      sx={{
        width: "100%",

        borderRadius: 1,

        backgroundColor: theme.palette.background.paper,
      }}
      p={2}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {" "}
          {false ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar alt={name} src={avatar || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`} />
            </StyledBadge>
          ) : (
            <Avatar alt={name} src={avatar || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`} />
          )}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">{name}</Typography>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          <Button
            onClick={() => {
              //  emit "accept_request" event
              socket.emit("accept_request", { request_id: id });
              handleClose();
            }}
          >
            Accept Request
          </Button>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

// FriendElement

const FriendElement = ({
  avatar,
  firstName,
  lastName,
  incoming,
  missed,
  status,
  _id,
  handleClose,
}) => {
  const user_id = window.localStorage.getItem("user_id");
  const theme = useTheme();

  const name = `${firstName} ${lastName}`;

  const { sideBar } = useSelector((state) => state.app);

  const dispatch = useDispatch();

  return (
    <StyledChatBox
      sx={{
        width: "100%",

        borderRadius: 1,

        backgroundColor: theme.palette.background.paper,
      }}
      p={2}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {" "}
          {status == "Online" ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar alt={name} src={avatar || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`} />
            </StyledBadge>
          ) : (
            <Avatar alt={name} src={avatar || `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`} />
          )}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">{name}</Typography>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          <IconButton
            onClick={() => {
              dispatch(SelectConversation({ room_id: null }));
              dispatch(ClearCurrentMessagesAndCurrentConversation());
              dispatch(
                UpdateReply_msg({
                  reply: false,
                  replyToMsg: null,
                  messageId: null,
                })
              );
              dispatch(UpdatePage({ page: 2 }));
              dispatch(UpdateHasMore({ hasMore: true }));
              if (sideBar.open) {
                dispatch(ToggleSidebar());
                dispatch(UpdateSidebarType("CONTACT"));
              }
              // start a new conversation
              socket.emit("start_conversation", { to: _id, from: user_id });
              handleClose();
            }}
          >
            <Chat />
          </IconButton>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

export { UserElement, FriendRequestElement, FriendElement };
