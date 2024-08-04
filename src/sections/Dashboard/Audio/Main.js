// import React from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { ResetAudioCallQueue, UpdateMain } from "../../../redux/slices/audioCall";
import { Box, Dialog, Modal, Slide } from "@mui/material";
// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
// import { socket } from "../../../socket";

// const Main = ({ open }) => {
//   const dispatch = useDispatch();

//   const [call_details] = useSelector((state) => state.audioCall.call_queue);

//   const call_ended = ()=>{
//     socket.emit("audio_call_ended", { ...call_details });
//   }

//   let myMeeting = async (element) => {
//     const appID = 1468240143;
//     const serverSecret = "dd3294d91b03e24fb31f728e6f93c93f";

//     const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       appID,
//       serverSecret,
//       call_details?.roomID,
//       Date.now().toString(),
//       call_details?.userName
//     ); //userID, userName

//     // Create instance object from Kit Token.
//     const zp = ZegoUIKitPrebuilt.create(kitToken);

//     // start the call
//     zp.joinRoom({
//       container: element,
//       //   sharedLinks: [
//       //     {
//       //       name: "copy",
//       //       url: `http://localhost:3000/room/${call_details?.roomID}`,
//       //     },
//       //   ],
//       scenario: {
//         mode: ZegoUIKitPrebuilt.OneONoneCall, // To implement 1-on-1 calls, modify the parameter here to [ZegoUIKitPrebuilt.OneONoneCall].
//       },
//       showScreenSharingButton: true,
//       showPreJoinView: false,
//       turnOnCameraWhenJoining: false,
//       //   showLayoutButton: true,
//       //   showPinButton: true,
//       showRoomTimer: true,
//         showLeavingView: false,
//       onJoinRoom: () => null,
//       onLeaveRoom: () => {
//         call_ended();
//       },
//       onUserJoin: () => null,
//       onUserLeave: () => null,
//       maxUsers: 2,
//     });
//   };

//   const handleDisconnect = () => {
//     dispatch(UpdateMain());
//   };
//   return (
//     <div className=" bg-red-500  w-[100vw] h-[100vh]">
//       <Modal
//         open={open}
//         onClose={handleDisconnect}
//         aria-labelledby="document-modal-title"
//         aria-describedby="document-modal-description"
//       >
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             maxWidth: "100vw",
//             maxHeight: "100vh",
//             width: "100%",
//             height: "100%",
//             // backgroundColor: "#fff",
//             // boxShadow: 24,
//             p: 4,
//             // borderRadius: "10px",
//             // outline: "none",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             overflow: "auto", // Add scrollbar when content overflows
//           }}
//         >
//           <div ref={myMeeting} style={{ width: "100%", height: "100%", maxWidth:'100%', maxHeight:'100%' }} />
//         </Box>
//       </Modal>
//     </div>
//   );
// };

// export default Main;

import { socket } from "../../../socket";
import { useEffect, useRef, useState } from "react";
import { cloneDeep } from "lodash";

import usePeer from "../../../hooks/usePeer";
import useMediaStream from "../../../hooks/useMediaStream";
import usePlayer from "../../../hooks/usePlayer";

import Player from "../../../components/Player";
import Bottom from "../../../components/Bottom";

import { UserSquare2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  ResetAudioCallQueue,
  UpdateMain,
} from "../../../redux/slices/audioCall";

const Main = ({ open }) => {
  const { peer, myId } = usePeer();
  const { stream } = useMediaStream();
  const {
    players,
    setPlayers,
    playerHighlighted,
    nonHighlightedPlayers,
    toggleAudio,
    leaveRoom,
  } = usePlayer(myId, peer, stream);

  const [users, setUsers] = useState([]);

  const [call_details] = useSelector((state) => state.audioCall.call_queue);
  const { incoming } = useSelector((state) => state.audioCall);

  const dispatch = useDispatch();

  const ref = useRef(false);

  // call the joined person and send strams also and also receive the streams from him/her
  useEffect(() => {
    if (!socket || !peer || !stream) return;
    const handleUserConnected = (newUserPeerId) => {
      // console.log(`user connected in room with userId ${newUser} and name ${remoteName}`);

      const call = peer.call(newUserPeerId, stream);

      call.on("stream", (incomingStream) => {
        // console.log(`incoming stream from ${newUser}`);
        setPlayers((prev) => ({
          ...prev,
          [newUserPeerId]: {
            url: incomingStream,
            muted: true,
          },
        }));

        setUsers((prev) => ({
          ...prev,
          [newUserPeerId]: call,
        }));
        ref.current = true;
      });
    };
    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("user-connected", handleUserConnected);
    };
  }, [peer, setPlayers, socket, stream]);

  useEffect(() => {
    if (!socket) return;
    const handleToggleAudio = (userId) => {
      //here userId is peerId
      // console.log(`user with id ${userId} toggled audio`);
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].muted = !copy[userId].muted;
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      // console.log(`user ${userId} is leaving the room`);
      users[userId]?.close(); //as users contain the call obj
      const playersCopy = cloneDeep(players);
      delete playersCopy[userId];
      setPlayers(playersCopy);
      peer?.disconnect();
      stream.getTracks().forEach(track => track.stop());
      dispatch(ResetAudioCallQueue());
    };
    socket.on("user-toggle-audio", handleToggleAudio);
    socket.on("user-leave", handleUserLeave);
    return () => {
      socket.off("user-toggle-audio", handleToggleAudio);
      socket.off("user-leave", handleUserLeave);
    };
  }, [players, setPlayers, socket, users]);

  // the receiver answer calls and send its streams also
  useEffect(() => {
    if (!peer || !stream) return;
    peer.on("call", (call) => {
      const { peer: callerId } = call;
      call.answer(stream); //send streams also

      call.on("stream", (incomingStream) => {
        setPlayers((prev) => ({
          ...prev,
          [callerId]: {
            url: incomingStream,
            muted: true,
          },
        }));

        setUsers((prev) => ({
          ...prev,
          [callerId]: call,
        }));
        ref.current = true;
      });
    });
  }, [peer, setPlayers, stream]);

  // opening streams of current user and send SDP
  useEffect(() => {
    if (!stream || !myId) return;
    console.log(`setting my stream ${myId}`);
    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        url: stream,
        muted: true,
      },
    }));
    if (!incoming) {
      socket?.emit("initiate:call", myId, call_details);
    }

    return () => {
      socket.off("initiate:call");
    };
  }, [myId, setPlayers, stream]);

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
            backgroundColor: "black",
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
          {
            Object.keys(nonHighlightedPlayers).length != 0 &&
            <span className=" absolute top-2` text-4xl mt-10 font-light text-blue-300  select-none">Connected</span>
          }
          <div
            className={`absolute w-9/12 left-0 right-0 mx-auto flex flex-row justify-center items-center gap-1 top-[20px] bottom-[50px]`}
            style={{ height: "calc(100vh - 20px - 100px)" }}
          >
            {Object.keys(nonHighlightedPlayers).length != 0 ? (
              Object.keys(nonHighlightedPlayers).map((playerId) => {
                const { url, muted } = nonHighlightedPlayers[playerId];
                return (
                  <Player
                    key={playerId}
                    url={url}
                    muted={muted}
                    isActive={true}
                  />
                );
              })
            ) : (
              <>
                <div className=" text-center mx-auto my-auto text-4xl mt-10 font-light text-blue-300 animate-pulse">
                  Connecting...
                </div>
                <div
                  className={`absolute w-9/12 left-0 right-0 mx-auto flex flex-row justify-center items-center gap-1 top-[20px] bottom-[50px]`}
                  style={{ height: "calc(100vh - 20px - 100px)" }}
                >
                  <UserSquare2 color="white" size={400} />
                </div>
              </>
            )}
          </div>
          <Bottom
            muted={playerHighlighted?.muted}
            playing={playerHighlighted?.playing}
            toggleAudio={toggleAudio}
            leaveRoom={leaveRoom}
            clickable={ref.current}
          />
        </Box>
      </Modal>
    </div>
  );
};

export default Main;
