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

// TODO HOF

const MessageOption = () => {
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
          {Message_options.map((el) => (
            <MenuItem onClick={handleClose}>{el.title}</MenuItem>
          ))}
        </Stack>
      </Menu>
    </>
  );
};

const DocMsg = ({ el, menu }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
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
            direction={"row"}
            spacing={3}
            alignItems={"center"}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
            }}
          >
            <Image size={48} />
            <Typography variant="caption">Abstract.png</Typography>
            <IconButton>
              <DownloadSimple />
            </IconButton>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: el.incoming ? theme.palette.text : "#fff",
            }}
          >
            {el.message}
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOption />}
    </Stack>
  );
};

const LinkMsg = ({ el, menu }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
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
            <img
              src={el.preview}
              alt={el.message}
              style={{ maxHeight: 210, borderRadius: "10px" }}
              loading="lazy"
            />
            <Stack spacing={2}>
              <Typography variant="subtitle2">creating chat app</Typography>
              <Typography
                variant="subtitle2"
                component={Link}
                sx={{
                  color: theme.palette.primary.main,
                }}
                to="https://www.youtube.com/watch?v=g4Z-kRkWnU0&list=PLdLUE-L26MMbXYkddCi6Cb1jy5dKczosk&index=4"
              >
                www.linkedin.com
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color={el.incoming ? theme.palette.text : "#fff"}
            >
              {el.message}
            </Typography>
          </Stack>
        </Stack>
      </Box>
      {menu && <MessageOption />}
    </Stack>
  );
};

const ReplyMsg = ({ el, menu }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
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
              {el.message}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el.reply}
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOption />}
    </Stack>
  );
};

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
        <Stack spacing={1} sx={{ maxWidth: "100%" }}>
          <img
            src={el?.src}
            alt={el.message}
            loading="lazy"
            style={{
          width: '100%',
          height: '210px',
          objectFit: 'cover',
          borderRadius: '10px',
          cursor: 'pointer', // Add cursor pointer to indicate clickable
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
      {menu && <MessageOption />}
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
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          backgroundColor: '#fff',
          boxShadow: 24,
          p: 4,
          borderRadius: '10px',
          outline: 'none',
          textAlign: 'center',
        }}>
          <img
            src={el?.src}
            alt={el.message}
            loading="lazy"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '10px',
            }}
          />
          <IconButton
            aria-label="Close modal"
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#f00',
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
      {menu && <MessageOption />}
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

export { Timeline, TextMsg, MediaMsg, ReplyMsg, LinkMsg, DocMsg };
