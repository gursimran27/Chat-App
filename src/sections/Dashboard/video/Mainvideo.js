import { Box, Modal, Slide } from "@mui/material";

import { socket } from "../../../socket";
import { useEffect, useRef, useState } from "react";
import { cloneDeep } from "lodash";

import usePeer from "../../../hooks/usePeer";
import useMediaStream from "../../../hooks/useMediaStreamVideocall";
import usePlayer from "../../../hooks/usePlayerVideocall";

import Player from "../../../components/PlayerVideocall";
import Bottom from "../../../components/BottomVideocall";

import { useDispatch, useSelector } from "react-redux";
import {
  ResetVideoCallQueue,
  UpdateMainVideo,
} from "../../../redux/slices/videoCall";

const MainVideo = ({ open }) => {
  const { peer, myId } = usePeer();
  const { stream } = useMediaStream();
  const {
    players,
    setPlayers,
    playerHighlighted,
    nonHighlightedPlayers,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  } = usePlayer(myId, peer, stream);

  const [users, setUsers] = useState([]);

  const [call_details] = useSelector((state) => state.videoCall.call_queue);
  const { incoming } = useSelector((state) => state.videoCall);

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
            playing: true,
          },
        }));

        setUsers((prev) => ({
          ...prev,
          [newUserPeerId]: call,
        }));
        ref.current = true;
      });
    };
    socket.on("user-connected-videocall", handleUserConnected);

    return () => {
      socket.off("user-connected-videocall", handleUserConnected);
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

    const handleToggleVideo = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].playing = !copy[userId].playing;
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
      dispatch(ResetVideoCallQueue());
    };
    socket.on("user-toggle-audio-videocall", handleToggleAudio);
    socket.on("user-toggle-video", handleToggleVideo);
    socket.on("user-leave-videocall", handleUserLeave);
    return () => {
      socket.off("user-toggle-audio-videocall", handleToggleAudio);
      socket.off("user-toggle-video", handleToggleVideo);
      socket.off("user-leave-videocall", handleUserLeave);
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
            playing: true,
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
        playing: true,
      },
    }));
    if (!incoming) {
      socket?.emit("initiate:videocall", myId, call_details);
    }

    return () => {
      socket.off("initiate:call");
    };
  }, [myId, setPlayers, stream]);

  const handleDisconnect = () => {
    dispatch(UpdateMainVideo());
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
          <>
            <div
              className={` absolute w-9/12 left-0 right-0 mx-auto flex flex-row justify-center items-center gap-1 top-[20px] bottom-[50px]`}
              style={{ height: "calc(100vh - 20px - 100px)" }}
            >
              {Object.keys(nonHighlightedPlayers).length != 0 ? (
                Object.keys(nonHighlightedPlayers).map((playerId) => {
                  const { url, muted, playing } =
                    nonHighlightedPlayers[playerId];
                  return (
                    <Player
                      key={playerId}
                      url={url}
                      muted={muted}
                      playing={playing}
                      isActive={true}
                      me={true}
                    />
                  );
                })
              ) : (
                <>
                  <div className=" text-center mx-auto my-auto text-4xl mt-10 font-light text-blue-300 animate-pulse">
                    Connecting...
                  </div>
                  <div
                    className={` absolute w-9/12 left-0 right-0 mx-auto flex flex-row justify-center items-center gap-1 top-[20px] bottom-[50px]`}
                    style={{ height: "calc(100vh - 20px - 100px)" }}
                  >
                    {playerHighlighted && (
                      <Player
                        url={playerHighlighted.url}
                        muted={playerHighlighted.muted}
                        playing={playerHighlighted.playing}
                        isActive={true}
                        me={false}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <div className={` absolute flex flex-col overflow-y-auto w-[200px] right-[20px] top-[20px]`} style={{ height: "calc(100vh - 20px)" }}>
              {playerHighlighted &&
                Object.keys(nonHighlightedPlayers).length != 0 && (
                  <Player
                    url={playerHighlighted.url}
                    muted={playerHighlighted.muted}
                    playing={playerHighlighted.playing}
                    isActive={false}
                    me={false}
                  />
                )}
            </div>
            <Bottom
              muted={playerHighlighted?.muted}
              playing={playerHighlighted?.playing}
              toggleAudio={toggleAudio}
              toggleVideo={toggleVideo}
              leaveRoom={leaveRoom}
              clickable={ref.current}
            />
          </>
        </Box>
      </Modal>
    </div>
  );
};

export default MainVideo;
