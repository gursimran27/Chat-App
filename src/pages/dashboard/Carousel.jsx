import { Box, IconButton, Modal, Tooltip } from "@mui/material";
import { X } from "phosphor-react";
import React, { useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import { faker } from "@faker-js/faker";
import video from "./testvideo.mp4";
import { useDispatch, useSelector } from "react-redux";
import { MdDelete } from "react-icons/md";
import { showSnackbar } from "../../redux/slices/app";
import { socket } from "../../socket";

const Carousels = ({ openStatusModal, handleCloseStatusModal, owner, status }) => {
  const user_id = window.localStorage.getItem("user_id");
  const dispatch = useDispatch();

  const [autoPlay, setautoPlay] = useState(true);

  const handleVideoPlay = () => {
    setautoPlay(false);
  };

  const handleVideoPause = () => {
    setautoPlay(true);
  };
  const { statuses } = useSelector((state) => state.app.user);

  if(!status){
    status = [...statuses];
  }

  if (status.length <= 0) {
    handleCloseStatusModal();
    return;
  }

  const handleDeleteStatus = async (statusId)=>{
    socket.emit("deleteStatus", {
      user_id: user_id,
      statusId: statusId,
    });
    dispatch(showSnackbar({ severity: "success", message: "Status deleted successfuly" }));
  }

  return (
    <div>
      {/* Modal for displaying larger image */}
      <Modal
        open={openStatusModal}
        onClose={handleCloseStatusModal}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
      >
        <Box
          className="bg-transparent"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "45%",
            height: "90%",
            //   backgroundColor: "",
            // boxShadow: 24,
            p: 4,
            borderRadius: "10px",
            outline: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "auto", // Add scrollbar when content overflows
          }}
        >
          <div className=" flex items-center justify-center w-full, h-[90%] select-none overflow-hidden">
            <Carousel
              width={600}
              autoPlay={autoPlay}
              centerMode={false}
              emulateTouch={true}
              infiniteLoop={true}
              interval={2000}
              showThumbs={false}
              showStatus={true}
              showIndicators={true}
              stopOnHover={true}
              useKeyboardArrows={true}
            >
              {status.map((status) => {
                return status?.type == "img" ? (
                  <div
                    style={{
                      width: "100%",
                      height: "500px",
                    }}
                  >
                    <img
                      src={status?.content}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                    {owner && (
                      <Tooltip placement="top" title="Delete status">
                        <buttom
                          className="flex justify-center items-center absolute top-4 left-5 ml-4 mt-0 p-2 bg-transparent animate-bounce hover:animate-none transition-all duration-300 cursor-pointer"
                          onClick={() => handleDeleteStatus(status?._id)}
                        >
                          <MdDelete size={34} className=" text-red-500" />
                        </buttom>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "500px",
                      objectFit: "contain",
                    }}
                  >
                    <video
                      controls
                      muted
                      controlsList="nodownload"
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      onEnded={handleVideoPause}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    >
                      <source src={status?.content} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {owner && (
                      <Tooltip placement="top" title="Delete status">
                        <buttom
                          className="flex justify-center items-center absolute top-4 left-5 ml-5 mt-0 p-2 bg-transparent animate-bounce hover:animate-none transition-all duration-300 cursor-pointer"
                          onClick={() => handleDeleteStatus(status?._id)}
                        >
                          <MdDelete size={34} className=" text-red-500" />
                        </buttom>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </Carousel>
          </div>

          <IconButton
            aria-label="Close modal"
            onClick={handleCloseStatusModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 20,
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
    </div>
  );
};

export default Carousels;
