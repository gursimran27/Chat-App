import React, { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CaretDown,
  MagnifyingGlass,
  Phone,
  VideoCamera,
  X,
} from "phosphor-react";
import { faker } from "@faker-js/faker";
import useResponsive from "../../hooks/useResponsive";
import {
  SelectConversation,
  ToggleSidebar,
  UpdateSidebarType,
} from "../../redux/slices/app";
import { useDispatch, useSelector } from "react-redux";
import { StartAudioCall } from "../../redux/slices/audioCall";
import { StartVideoCall } from "../../redux/slices/videoCall";
import axios from "../../utils/axios";
import { format, isToday, isYesterday } from "date-fns";
import "./UserLastSeen.css"; // Import CSS file
import {
  ClearChat,
  ClearCurrentMessagesAndCurrentConversation,
  DeleteChat,
  UpdateHasMore,
  UpdatePage,
  UpdateReply_msg,
} from "../../redux/slices/conversation";

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

const Conversation_Menu = [
  {
    title: "Contact info",
  },
  {
    title: "Clear messages",
  },
  {
    title: "Close Chat",
  },
  {
    title: "Delete chat",
  },
];

const ChatHeader = () => {
  const dispatch = useDispatch();
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const theme = useTheme();

  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const { open } = useSelector((state) => state.app.sideBar);

  const [conversationMenuAnchorEl, setConversationMenuAnchorEl] =
    React.useState(null);
  const openConversationMenu = Boolean(conversationMenuAnchorEl);
  const handleClickConversationMenu = (event) => {
    setConversationMenuAnchorEl(event.currentTarget);
  };
  const handleCloseConversationMenu = () => {
    setConversationMenuAnchorEl(null);
  };

  const userId = current_conversation?.user_id;

  const [lastSeen, setLastSeen] = useState(null);
  const [updating, setUpdating] = useState(false);

  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (current_conversation == null) {
      return;
    }
    const fetchLastSeen = async () => {
      setUpdating(true);
      try {
        const response = await axios.get(
          `http://localhost:3001/api/v1/user/${userId}/lastSeen`,

          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTimeout(() => setUpdating(false), 500); // Wait for the transition to complete
        setLastSeen(response.data.lastSeen);
      } catch (error) {
        console.error("Error fetching last seen:", error);
        setUpdating(false);
      }
    };

    fetchLastSeen();
  }, [userId, current_conversation?.online]);

  // const formatLastSeen = (lastSeen) => {
  //   if (!lastSeen) return 'Offline';
  //   const date = new Date(lastSeen);
  //   return `Last seen: ${date.toLocaleString()}`;
  // };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Select for contact info";
    const date = new Date(lastSeen);

    if (isToday(date)) {
      return `Last seen today at ${format(date, "p")}`; // 'p' for time with AM/PM
    } else if (isYesterday(date)) {
      return `Last seen yesterday at ${format(date, "p")}`;
    } else {
      return `Last seen on ${format(date, "PPpp")}`; // 'PPpp' for full date and time with AM/PM
    }
  };

  const { sideBar } = useSelector((state) => state.app);

  const handleCloseChat = () => {
    // console.log("close chat clicked");
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
  };

  const handleClearChat = async () => {
    handleCloseConversationMenu();
    try {
      const response = await axios.put(
        `/user/clearChat/${current_conversation?.id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response);

      dispatch(ClearChat({ conversationId: response?.data?.conversationId }));
    } catch (error) {
      console.error("Error clearing the char", error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      const response = await axios.put(
        `user/deleteChat/${current_conversation?.id}`,
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
    handleCloseConversationMenu();
  };

  return (
    <>
      <Box
        p={2}
        width={"100%"}
        // className='border-b-[1px] border-dashed'
        sx={{
          backgroundColor:
            theme.palette.mode === "light"
              ? "#F8FAFF"
              : theme.palette.background,
          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Stack
          alignItems={"center"}
          direction={"row"}
          sx={{ width: "100%", height: "100%" }}
          justifyContent="space-between"
        >
          <Stack
            style={{ cursor: "pointer" }}
            onClick={() => {
              dispatch(ToggleSidebar());
              dispatch(UpdateSidebarType("CONTACT"));
            }}
            spacing={2}
            direction="row"
          >
            {current_conversation?.online ? (
              <>
                <Box>
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    variant="dot"
                  >
                    <Avatar
                      alt={current_conversation?.name}
                      src={current_conversation?.img}
                    />
                  </StyledBadge>
                </Box>
                <Stack spacing={0.2}>
                  <Typography variant="subtitle2">
                    {current_conversation?.name}
                  </Typography>
                  <Typography variant="caption">
                    {current_conversation?.typing
                      ? "Typing..."
                      : current_conversation?.recordingAudio
                      ? "Recording audio..."
                      : "Online"}
                  </Typography>
                </Stack>
              </>
            ) : (
              <>
                <Box>
                  <Avatar
                    alt={current_conversation?.name}
                    src={current_conversation?.img}
                  />
                </Box>
                <Stack spacing={0.2}>
                  <Typography variant="subtitle2">
                    {current_conversation?.name}
                  </Typography>
                  <div className={`last-seen ${updating ? "updating" : ""}`}>
                    <Typography variant="caption">
                      {" "}
                      {formatLastSeen(lastSeen)}
                    </Typography>
                  </div>
                </Stack>
              </>
            )}
          </Stack>
          <Stack
            direction={"row"}
            alignItems="center"
            spacing={isMobile ? 1 : 3}
          >
            <IconButton
              onClick={() => {
                dispatch(StartVideoCall(current_conversation.user_id));
              }}
            >
              <VideoCamera />
            </IconButton>
            <IconButton
              onClick={() => {
                dispatch(StartAudioCall(current_conversation.user_id));
              }}
            >
              <Phone />
            </IconButton>
            {!isMobile && (
              <IconButton>
                <MagnifyingGlass />
              </IconButton>
            )}
            <Divider orientation="vertical" flexItem />
            <IconButton
              id="conversation-positioned-button"
              aria-controls={
                openConversationMenu
                  ? "conversation-positioned-menu"
                  : undefined
              }
              aria-haspopup="true"
              aria-expanded={openConversationMenu ? "true" : undefined}
              onClick={handleClickConversationMenu}
            >
              <CaretDown />
            </IconButton>
            <Stack
              alignItems={"center"}
              justifyContent={"center"}
              // sx={{
              //   height: 38,
              //   width: 38,
              //   backgroundColor: theme.palette.primary.main,
              //   borderRadius: 2,
              //   opacity:'0.78'
              // }}
            >
              <IconButton onClick={handleCloseChat}>
                <X />
              </IconButton>
            </Stack>
            <Menu
              MenuListProps={{
                "aria-labelledby": "fade-button",
              }}
              TransitionComponent={Fade}
              id="conversation-positioned-menu"
              aria-labelledby="conversation-positioned-button"
              anchorEl={conversationMenuAnchorEl}
              open={openConversationMenu}
              onClose={handleCloseConversationMenu}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Box p={1}>
                <Stack spacing={1}>
                  {Conversation_Menu.map((el) =>
                    el.title == "Contact info" ? (
                      <MenuItem
                        onClick={() => {
                          dispatch(ToggleSidebar());
                          dispatch(UpdateSidebarType("CONTACT"));
                          handleCloseConversationMenu();
                        }}
                      >
                        <Stack
                          sx={{ minWidth: 100 }}
                          direction="row"
                          alignItems={"center"}
                          justifyContent="space-between"
                        >
                          <span>{open ? "Close conatct info" : el?.title}</span>
                        </Stack>{" "}
                      </MenuItem>
                    ) : el.title == "Clear messages" ? (
                      <MenuItem onClick={handleClearChat}>
                        <Stack
                          sx={{ minWidth: 100 }}
                          direction="row"
                          alignItems={"center"}
                          justifyContent="space-between"
                        >
                          <span>{el.title}</span>
                        </Stack>{" "}
                      </MenuItem>
                    ) : el.title == "Delete chat" ? (
                      <MenuItem onClick={handleDeleteChat}>
                        <Stack
                          sx={{ minWidth: 100 }}
                          direction="row"
                          alignItems={"center"}
                          justifyContent="space-between"
                        >
                          <span>{el.title}</span>
                        </Stack>{" "}
                      </MenuItem>
                    ) : (
                      <MenuItem
                        onClick={() => {
                          handleCloseConversationMenu();
                          handleCloseChat();
                        }}
                      >
                        <Stack
                          sx={{ minWidth: 100 }}
                          direction="row"
                          alignItems={"center"}
                          justifyContent="space-between"
                        >
                          <span>{el.title}</span>
                        </Stack>{" "}
                      </MenuItem>
                    )
                  )}
                </Stack>
              </Box>
            </Menu>
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

export default ChatHeader;
