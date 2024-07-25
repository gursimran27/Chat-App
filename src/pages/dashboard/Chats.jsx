import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArchiveBox,
  CircleDashed,
  MagnifyingGlass,
  Users,
} from "phosphor-react";
import { SimpleBarStyle } from "../../components/Scrollbar";
import { useTheme } from "@mui/material/styles";
import useResponsive from "../../hooks/useResponsive";
import BottomNav from "../../layouts/dashboard/BottomNav";
import { ChatList } from "../../data";
import ChatElement from "../../components/ChatElement";
import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "../../components/Search";
import Friends from "../../sections/Dashboard/Friends";
import { socket } from "../../socket";
import { useDispatch, useSelector } from "react-redux";
import {
  ClearCurrentMessagesAndCurrentConversation,
  FetchDirectConversations,
  UpdateConversationUnread,
  UpdateHasMore,
  UpdatePage,
  UpdateReply_msg,
} from "../../redux/slices/conversation";
import Status from "./Status";
import Carousel from "./Carousel";
import Carousels from "./Carousel";
import {
  SelectConversation,
  ToggleSidebar,
  UpdateSidebarType,
} from "../../redux/slices/app";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const user_id = window.localStorage.getItem("user_id");

const Chats = () => {
  const theme = useTheme();
  const isDesktop = useResponsive("up", "md");

  const { sideBar } = useSelector((state) => state.app);

  const { statuses } = useSelector((state) => state.app.user);

  const { room_id } = useSelector((state) => state.app);

  const dispatch = useDispatch();

  const { conversations } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const list = conversations.map((el) => {
    return {
      label: el?.name,
      id: el?.id,
    };
  });

  useEffect(() => {
    socket.emit(
      "get_direct_conversations",
      { user_id },
      (data, pinnedChats, deletedChats) => {
        console.log(data); // this data is the list of conversations
        // dispatch action

        dispatch(
          FetchDirectConversations({
            conversations: data,
            pinnedChats: pinnedChats,
            deletedChats: deletedChats,
          })
        );
      }
    );
  }, []);

  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const [openStatusModal, setOpenStatusModal] = useState(false);

  const handleopenStatusModal = () => {
    handleCloseModal();
    setOpenStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setOpenStatusModal(false);
  };

  let val = null;
  // const isOptionEqualToValue = (option, value) => {
  //   return option.id === value.id;
  // };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: isDesktop ? 320 : "100vw",
          backgroundColor:
            theme.palette.mode === "light"
              ? "#F8FAFF"
              : theme.palette.background,

          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* {!isDesktop && (
          // Bottom Nav
          <BottomNav />
        )} */}

        <Stack p={3} spacing={2} sx={{ maxHeight: "100vh" }}>
          <Stack
            alignItems={"center"}
            justifyContent="space-between"
            direction="row"
          >
            <Typography variant="h5">Chats</Typography>

            <Stack direction={"row"} alignItems="center" spacing={1}>
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
                  handleOpenDialog();
                }}
                sx={{ width: "max-content" }}
              >
                <Users />
              </IconButton>
              <IconButton
                sx={{ width: "max-content", position: "relative" }}
                onClick={handleOpenModal}
              >
                <CircleDashed />
                {statuses.length > 0 && (
                  <Tooltip placement="left-end" title="My Status">
                    <div className=" text-sm absolute -top-1 bg-green-500 rounded-full text-black w-5 flex items-center justify-center -left-0 animate-bounce">
                      {statuses.length}
                    </div>
                  </Tooltip>
                )}
              </IconButton>
            </Stack>
          </Stack>
          <Stack sx={{ width: "100%" }}>
            {/* <Search>
              <SearchIconWrapper>
                <MagnifyingGlass color="#709CE6" />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search> */}
            <Autocomplete
              value={val}
              //  isOptionEqualToValue={isOptionEqualToValue}
              onChange={(event, newValue) => {
                // console.log(newValue);
                if (newValue) {
                  if (newValue?.id == room_id) return;
                  // console.log('change')
                  dispatch(ClearCurrentMessagesAndCurrentConversation());
                  dispatch(SelectConversation({ room_id: newValue?.id }));
                  dispatch(
                    UpdateConversationUnread({ conversationId: newValue?.id })
                  );
                }
              }}
              options={list}
              // sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <MagnifyingGlass color="#709CE6" style={{ marginRight: 4 }} />
                        Search
                    </span>
                  }
                />
              )}
            />
          </Stack>
          <Stack spacing={1}>
            <Stack direction={"row"} spacing={1.5} alignItems="center">
              <ArchiveBox size={24} />
              <Button variant="text">Archive</Button>
            </Stack>
            <Divider />
          </Stack>
          <Stack sx={{ flexGrow: 1, overflowY: "scroll", height: "100%" }}>
            <SimpleBarStyle timeout={500} clickOnTrack={false}>
              <Stack spacing={2.4}>
                <Typography variant="subtitle2" sx={{ color: "#676667" }}>
                  Pinned
                </Typography>
                {/* Chat List */}
                {conversations
                  .filter((el) => el.pinned)
                  .map((el, idx) => {
                    return <ChatElement {...el} />;
                  })}
                <Typography variant="subtitle2" sx={{ color: "#676667" }}>
                  All Chats
                </Typography>
                {/* Chat List */}
                {conversations
                  .filter((el) => !el.pinned)
                  .map((el, idx) => {
                    return <ChatElement {...el} />;
                  })}
              </Stack>
            </SimpleBarStyle>
          </Stack>
        </Stack>
      </Box>
      {openDialog && (
        <Friends open={openDialog} handleClose={handleCloseDialog} />
      )}
      {openModal && (
        <Status
          openModal={openModal}
          handleCloseModal={handleCloseModal}
          handleopenStatusModal={handleopenStatusModal}
        />
      )}
      {openStatusModal && (
        <Carousels
          openStatusModal={openStatusModal}
          handleCloseStatusModal={handleCloseStatusModal}
          owner={true}
          status={null}
        />
      )}
    </>
  );
};

export default Chats;
