import React, { useState } from "react";
import {
  Box,
  Badge,
  Stack,
  Avatar,
  Typography,
  MenuItem,
  Menu,
} from "@mui/material";
import { styled, useTheme, alpha } from "@mui/material/styles";
// import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SelectConversation, closeSnackBar, showSnackbar } from "../redux/slices/app";
import { UpdateConversationUnread, UpdateDirectConversationForPinnedChat } from "../redux/slices/conversation";
import { DotsThreeVertical } from "phosphor-react";
import axios from "../utils/axios";


const Message_options = [
  {
    title: "Pin Chat",
  },
  {
    title: "Report",
  },
  {
    title: "Delete Chat",
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

const MessageOption = ({conversationId, name, pinned}) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null); //store referance
  const open = Boolean(anchorEl); //convert referance to boollean
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); //referance
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { token } = useSelector((state)=>state.auth);

  const handlePin =  async (conversationId) => {
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
      dispatch(UpdateDirectConversationForPinnedChat({this_conversation_id: conversationId, pinned: true}));
      dispatch(closeSnackBar);

      console.log('pinned chat sucess',data)
    } catch (error) {
      console.error('Failed to pin conversation', error);
    }
    handleClose();
  };

  const handleUnpin =  async (conversationId) => {
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
      dispatch(UpdateDirectConversationForPinnedChat({this_conversation_id: conversationId, pinned: false}));
      dispatch(closeSnackBar);
      console.log('unpinned chat sucess',data)
    } catch (error) {
      console.error('Failed to pin conversation', error);
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
        style={{cursor:'pointer'}}
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
          {Message_options.map((el) => (
            el?.title == "Pin Chat" ? (
              <MenuItem
                onClick={() => {
                  if(pinned){
                    handleUnpin(conversationId);
                  }
                  else{
                    handlePin(conversationId);
                  }
                }}
              >
                {!pinned? el?.title : "Unpin Chat"}
              </MenuItem>
            ) : (
              <MenuItem onClick={handleClose}>{el.title}</MenuItem>
            )
          ))}
        </Stack>
      </Menu>
    </>
  );
};

const ChatElement = ({ img, name, msg, time, unread, online, id, pinned }) => {
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

  const theme = useTheme();

  return (
    <Stack  direction="row" >
      <StyledChatBox
        onClick={() => {
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
          <Stack direction="row" spacing={2}>
            {" "}
            {online ? (
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
              >
                <Avatar alt={name} src={img} />
              </StyledBadge>
            ) : (
              <Avatar alt={name} src={img} />
            )}
            <Stack spacing={0.3}>
              <Typography variant="subtitle2">{name}</Typography>
              <Typography variant="caption">{truncateText(msg, 12)}</Typography>
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
      <MessageOption conversationId={id} name={name} pinned={pinned}/>
    </Stack>
  );
};

export default ChatElement;
