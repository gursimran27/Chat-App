import { Box, IconButton, Modal, Stack, useTheme } from "@mui/material";
import { PaperPlaneTilt, X } from "phosphor-react";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../socket";
import axios from "../../utils/axios";
import unSupport from "../../assets/OIP.jpeg";
import UseAnimations from "react-useanimations";
import loader from "react-useanimations/lib/loading";
import { showSnackbar } from "../../redux/slices/app";

const Status = ({ openModal, handleCloseModal, handleopenStatusModal }) => {

  const dispatch = useDispatch();

  const { statuses } = useSelector((state) => state.app.user);
  const user_id = window.localStorage.getItem("user_id");
  const { token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null); // to store the uploaded file-obj
  const [previewSource, setPreviewSource] = useState(null); // to store the dataURL representation of uploaded file obj
  const [fileType, setFileType] = useState("");

  const fileInputRef = useRef(null); //to access the hidden <input> field

  const handleClick = () => {
    fileInputRef.current.click(); //makes a click on hidden input field
  };

  //   fetch the file from input tag and set it in imageFile and call the previewFile func to convert file obj into a dataURL string format so that is can be used in img tag
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // console.log(file)
    if (file) {
      setImageFile(file);
      previewFile(file);
    }
  };

  //  this function accepets the file obj and convert it into a dataURL string form(which can be used in HTML in img tag) and then store dataURL string in previewSource
  const previewFile = (file) => {
    const reader = new FileReader(); // initiate a reader constructor
    reader.readAsDataURL(file); //convert to dataURl string format
    reader.onloadend = () => {
      setFileType(file.type);
      // after converting this is executed
      setPreviewSource(reader.result); //store the dataURL format of file-obj in  previewSource
    };
  };

  const handleFileUpload = async () => {
    // console.log(imageFile, previewFile);
    try {
      if (imageFile == null) return;
      // console.log("uploading...");
      setLoading(true);
      const formData = new FormData(); //used to gather form data from HTML forms.
      //   formData.append("conversation_id", room_id);
      // if(imageFile){
      formData.append("file", imageFile); // make a key-value pair so to send it in form-data section of request
      // }

      await axios
        .put("/user/uploadStatus", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          console.log(response);
          socket.emit("addStatus", {
            user_id: user_id,
            type: fileType.startsWith("image/")
              ? "img"
              : fileType.startsWith("video/")
              ? "video"
              : "doc",
            mediaUrl: response?.data?.mediaUrl,
          });
          dispatch(showSnackbar({ severity: "success", message: "Status uploaded successfully" }));
        })
        .catch((err) => {
          console.log(err);
        });

      setPreviewSource(null);
      setImageFile(null);
      setLoading(false);
      setFileType("");
      handleCloseModal();
    } catch (error) {
      console.log("ERROR MESSAGE - ", error.message);
      setPreviewSource(null);
      setImageFile(null);
      setLoading(false);
      setFileType("");
    }
  };
  return (
    <div className=" text-black">
      {/* Modal for displaying larger image */}
      <Modal
        open={openModal}
        onClose={()=>{
          if(loading){
            dispatch(showSnackbar({ severity: "error", message: "Uploading in progress, Please wait!" }));
            return;
          }
          handleCloseModal();
        }}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
      >
        <Box
          className=" bg-gray-700"
          sx={{
            color: "black",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "55%",
            height: "70%",
            // backgroundColor: "white",
            boxShadow: 24,
            p: 4,
            borderRadius: "10px",
            outline: "none",
            // display: "flex",
            // justifyContent: "center",
            // alignItems: "center",
            overflow: "auto", // Add scrollbar when content overflows
          }}
        >
          <div className={`flex flex-col ${previewSource ? "null" : "gap-28"}`}>
            <div className=" flex justify-between">
              <div className=" flex flex-col  items-start gap-4">
                <h1 className=" font-extrabold text-2xl">Add Status:</h1>
                <button
                  disabled={previewSource}
                  onClick={handleClick}
                  className={`border-2 border-black rounded-full bg-yellow-400 animate-pulse hover:animate-none transition-all duration-300 px-5 py-2 ${
                    previewSource ? "animate-none opacity-50" : null
                  }`}
                >
                  Select File
                </button>

                <input
                  type="file"
                  ref={fileInputRef} //!NOTE
                  onChange={handleFileChange}
                  style={{ display: "none" }} // Inline style to hide the element
                  // accept="image/png, image/gif, image/jpeg"
                />
              </div>

              {/* preview dialoag */}
              <Box
                sx={{
                  position: "relative",
                  display: previewSource ? "block" : "none", // Conditionally set display
                  color: "red", // Text color
                  width: "550px", // Width of the box
                  height: "400px", // Height of the box
                  // border: "1px solid black", // Border style
                  //   position: "absolute",
                  //   top: "-450px",
                  overflow: "auto", // Add scrollbar when content overflows
                  backgroundColor: "transparent",
                  // boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
                  // borderRadius: 1.5,
                }}
              >
                {fileType.startsWith("image/") && (
                  <img
                    src={previewSource}
                    // src="https://images.unsplash.com/photo-1502657877623-f66bf489d236?auto=format&fit=crop&w=800"
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "70%",
                    }}
                    width={550}
                    height={366}
                  />
                )}
                {fileType.startsWith("video/") && (
                  <video
                    controls
                    autoPlay
                    loop
                    muted
                    controlsList="nodownload"
                    style={{ width: "100%", height: "70%" }}
                  >
                    <source src={previewSource} type={fileType} />
                    Your browser does not support the video tag.
                  </video>
                )}
                {/* {fileType === "application/pdf" && (
                  <iframe
                    src={previewSource}
                    style={{ width: "100%", height: "70%" }}
                    title="PDF preview"
                  />
                )} */}
                {/* {fileType === "text/plain" && (
                  <iframe
                    src={previewSource}
                    style={{ width: "100%", height: "70%" }}
                    title="Text File preview"
                  />
                )} */}
                {/* unsupported Types */}
                {
                  !fileType.startsWith("video/") &&
                  !fileType.startsWith("image/") && (
                    <img
                      src={unSupport}
                      style={{
                        marginTop: "40px",
                        width: "90%",
                        height: "65%",
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginBottom: "30px",
                      }}
                    />
                  )}

                <div className=" flex flex-col mt-5">
                  {!loading ? (
                    <div className=" flex justify-evenly">
                      <button
                        className={` border-2 border-black rounded-full bg-yellow-400 animate-pulse hover:animate-none transition-all duration-300 px-5 py-2 text-black`}
                        disabled={
                          !fileType.startsWith("video/") &&
                          !fileType.startsWith("image/")
                        }
                        onClick={() => {
                          if (!imageFile) return;
                          handleFileUpload();
                        }}
                      >
                        Upload
                      </button>

                      <button
                        className=" border-2 border-black rounded-full bg-red-500 animate-pulse hover:animate-none transition-all duration-300 px-5 py-2 text-black"
                        onClick={() => {
                          setPreviewSource(null);
                          setImageFile(null);
                          setFileType("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className=" flex justify-center -mt-4">
                      <UseAnimations
                        animation={loader}
                        strokeColor="#0E96D8"
                        size={60}
                      />
                    </div>
                  )}
                </div>
              </Box>
            </div>

            <div className={`${previewSource ? "-mt-12" : null}`}>
              {statuses.length > 0 ? (
                <button className=" w-full border-2 border-black rounded-full bg-yellow-400 animate-pulse hover:animate-none transition-all duration-300 px-5 py-3"
                onClick={handleopenStatusModal}
                >
                  My Status
                </button>
              ) : (
                <div className=" text-3xl underline select-none">
                  No Status uploaded yet
                </div>
              )}
            </div>
          </div>

          <IconButton
            aria-label="Close modal"
            onClick={() => {
              if(loading){
                dispatch(showSnackbar({ severity: "error", message: "Uploading in progress, Please wait!" }));
                return;
              }
              setPreviewSource(null);
              setImageFile(null);
              setFileType("");
              handleCloseModal();
            }}
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


    </div>
  );
};

export default Status;
