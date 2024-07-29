import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ResetAudioCallQueue, UpdateMain } from "../../../redux/slices/audioCall";
import { Box, Dialog, Modal, Slide } from "@mui/material";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { socket } from "../../../socket";

const Main = ({ open }) => {
  const dispatch = useDispatch();

  const [call_details] = useSelector((state) => state.audioCall.call_queue);

  const call_ended = ()=>{
    socket.emit("audio_call_ended", { ...call_details });
  }

  const myMeeting = async (element) => {
    const appID = 1468240143;
    const serverSecret = "dd3294d91b03e24fb31f728e6f93c93f";

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      call_details?.roomID,
      Date.now().toString(),
      call_details?.userName
    ); //userID, userName

    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    // start the call
    zp.joinRoom({
      container: element,
      //   sharedLinks: [
      //     {
      //       name: "copy",
      //       url: `http://localhost:3000/room/${call_details?.roomID}`,
      //     },
      //   ],
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall, // To implement 1-on-1 calls, modify the parameter here to [ZegoUIKitPrebuilt.OneONoneCall].
      },
      showScreenSharingButton: true,
      showPreJoinView: false,
      turnOnCameraWhenJoining: false,
      //   showLayoutButton: true,
      //   showPinButton: true,
      showRoomTimer: true,
        showLeavingView: false,
      onJoinRoom: () => null,
      onLeaveRoom: () => {
        call_ended();
      },
      onUserJoin: () => null,
      onUserLeave: () => null,
      maxUsers: 2,
    });
  };

  const handleDisconnect = () => {
    dispatch(UpdateMain());
  };
  return (
    <div className=" bg-red-500  w-[100vw] h-[100vh]">
      <Modal
        open={open}
        onClose={handleDisconnect}
        aria-labelledby="document-modal-title"
        aria-describedby="document-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "100vw",
            maxHeight: "100vh",
            width: "100%",
            height: "100%",
            // backgroundColor: "#fff",
            // boxShadow: 24,
            p: 4,
            // borderRadius: "10px",
            // outline: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "auto", // Add scrollbar when content overflows
          }}
        >
          <div ref={myMeeting} style={{ width: "100%", height: "100%", maxWidth:'100%', maxHeight:'100%' }} />
        </Box>
      </Modal>
    </div>
  );
};

export default Main;
