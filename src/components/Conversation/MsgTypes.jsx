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
} from "@mui/material";
import React, { useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Check,
  Checks,
  DotsThreeVertical,
  DownloadSimple,
  Image,
  X,
} from "phosphor-react";
import { Message_options } from "../../data";
import { useDispatch, useSelector } from "react-redux";
import { UpdateReply_msg } from "../../redux/slices/conversation";
import { showSnackbar } from "../../redux/slices/app";

// TODO HOF

const MessageOption = ({ replyToMsg }) => {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null); //store referance
  const open = Boolean(anchorEl); //convert referance to boollean
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); //referance
  };
  const handleClose = () => {
    setAnchorEl(null);
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
  const { room_id } = useSelector((state) => state.app);

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
            ? theme.palette.background.default
            : theme.palette.primary.main,
          borderRadius: 1.5,
          width: "max-content",
        }}
      >
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
            onClick={handleOpenModal} // Open modal on click of document preview area
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
      </Box>
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
      {menu && <MessageOption replyToMsg={el?.message} />}

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
        }}
      >
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
      </Box>
      {menu && <MessageOption replyToMsg={el?.message} />}
      <Stack
        justifyContent={"flex-end"}
        sx={{ position: "absolute", bottom: "0px", right: "-7px" }}
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
    </Stack>
  );
};

const ReplyMsg = ({ el, menu }) => {
  const theme = useTheme();
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
        }}
      >
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
      </Box>
      {menu && <MessageOption replyToMsg={el?.message} />}
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
        }}
      >
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
      </Box>
      {menu && <MessageOption replyToMsg={el?.message} />}
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
            ? theme.palette.background.default
            : theme.palette.primary.main,
          borderRadius: 1.5,
          width: "250px",
        }}
      >
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
      </Box>
      {menu && <MessageOption replyToMsg={el?.message} />}
      <Stack
        justifyContent="flex-end"
        sx={{ position: "absolute", bottom: "0px", right: "-5px" }}
      >
        {!el.incoming &&
          (el?.status === "Sent" ? (
            <Check size={22} color="#908989" />
          ) : el?.status === "Delivered" ? (
            <Checks size={22} color="#908989" />
          ) : (
            <Checks size={22} color="#0949dc" />
          ))}
      </Stack>

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
        }}
      >
        <Typography
          variant="body2"
          color={el.incoming ? theme.palette.text : "#fff"}
        >
          {el.message}
        </Typography>
      </Box>
      {menu && <MessageOption replyToMsg={el?.message} />}
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
