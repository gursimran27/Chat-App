import React, { useEffect, useRef, useState } from "react";
import {
  FaMicrophone,
  FaPauseCircle,
  FaPlay,
  FaStop,
  FaTrash,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";
import WaveSurfer from "wavesurfer.js";
import { showSnackbar } from "../../redux/slices/app";
import { useDispatch, useSelector } from "react-redux";
import axios from "../../utils/axios";
import { socket } from "../../socket";
import useSound from "use-sound";
import sound from "../../assets/notifications/WhatsApp-Sending-Message-Sound-Effect.mp3";
import UseAnimations from "react-useanimations";
import loader from "react-useanimations/lib/loading";
import { useTheme } from "@mui/material/styles";

const CaptureAudio = ({ hide }) => {
  const user_id = window.localStorage.getItem("user_id");
  const { room_id } = useSelector((state) => state.app);
  const { token } = useSelector((state) => state.auth);
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const [play] = useSound(sound);

  const dispatch = useDispatch();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setrecordedAudio] = useState(null);
  const [waveform, setwaveform] = useState(null);
  const [recordingDuration, setrecordingDuration] = useState(0);
  const [currentPlayBackTime, setcurrentPlayBackTime] = useState(0);
  const [totalDuration, settotalDuration] = useState(0);
  const [isPlaying, setisPlaying] = useState(false);
  //   const [renderAudio, setrenderAudio] = useState(null);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const waveformRef = useRef(null);
  const renderAudio = useRef(null);

  const theme = useTheme();

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setrecordingDuration((prevDuration) => {
          settotalDuration(prevDuration + 1);
          return prevDuration + 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    socket.emit("updateRecordingAudio", {
      to: current_conversation?.user_id,
      from: user_id,
      conversationId: room_id,
      recordingAudio: true,
    });
  }, []); //first render

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "violet",
      progressColor: "purple",
      cursorColor: "#7ae3c3",
      barWidth: 2,
      height: 30,
      responsive: true,
    });

    setwaveform(wavesurfer);

    const updatePlaybackTime = () => {
      setcurrentPlayBackTime(wavesurfer.getCurrentTime());
    };

    wavesurfer.on("audioprocess", updatePlaybackTime);

    wavesurfer.on("finish", () => {
      setisPlaying(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  useEffect(() => {
    if (waveform) {
      handleStartRecording();
    }
  }, [waveform]);

  const handleStartRecording = async () => {
    setrecordingDuration(0);
    setcurrentPlayBackTime(0);
    settotalDuration(0);
    setIsRecording(true);

    socket.emit("updateRecordingAudio", {
      to: current_conversation?.user_id,
      from: user_id,
      conversationId: room_id,
      recordingAudio: true,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecoder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecoder;
      audioRef.current.srcObject = stream;

      const chunks = [];
      mediaRecoder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecoder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm; codecs=opus" });
        const audioURL = URL.createObjectURL(blob);
        const audio = new Audio(audioURL);
        setrecordedAudio(audio);

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "recording.webm", {
          type: "audio/webm",
          lastModified: Date.now(),
        });
        renderAudio.current = audioFile;

        waveform.load(audioURL);

        // Stop all tracks to release the resources
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecoder.start();
    } catch (error) {
      console.log("Error accessing microphone:", error);
      hide(false);
      dispatch(
        showSnackbar({
          severity: "error",
          message: "Microphone access denied",
        })
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      waveform.stop();

      //   const audioChunks = [];
      //   mediaRecorderRef.current.addEventListener("dataavaliable", (event) => {
      //     audioChunks.push(event.data);
      //   });

      //   mediaRecorderRef.current.addEventListener("stop", () => {
      //     const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
      //     const audioFile = new File([audioBlob], "recording.mp3");
      //     // setrenderAudio(audioFile);
      //     renderAudio.current = audioFile;
      //   });
      // console.log(renderAudio);
    }
    socket.emit("updateRecordingAudio", {
      to: current_conversation?.user_id,
      from: user_id,
      conversationId: room_id,
      recordingAudio: false,
    });
  };

  //   useEffect(() => {
  //     if (recordedAudio) {
  //       const updatePlayBackTime = () => {
  //         setcurrentPlayBackTime(recordedAudio.currentTime);
  //       };
  //       recordedAudio.addEventListener("timeupdate", updatePlayBackTime);

  //       return () => {
  //         recordedAudio.removeEventListener("timeupdate", updatePlayBackTime);
  //       };
  //     }
  //   }, [recordedAudio]);

  const handlePlayRecording = () => {
    if (recordedAudio) {
      //   waveform.stop();
      waveform.play();
      //   recordedAudio.play();
      setisPlaying(true);
    }
  };

  const handlePauseRecording = () => {
    waveform.pause();
    // recordedAudio.pause();
    setisPlaying(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const sendRecording = async () => {
    // console.log(renderAudio);
    try {
      // * no need as the send button will not work untill the audio strean not stoped
      // socket.emit("updateRecordingAudio", {
      //   to: current_conversation?.user_id,
      //   from: user_id,
      //   conversationId: room_id,
      //   recordingAudio: false,
      // });
      if (renderAudio.current == null) return;
      setLoading(true);
      const formData = new FormData(); //used to gather form data from HTML forms.
      formData.append("conversation_id", room_id);
      // if(imageFile){
      formData.append("file", renderAudio.current); // make a key-value pair so to send it in form-data section of request
      // }

      await axios
        .put("/user/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          //   console.log(response);
          socket.emit("file_message", {
            name: renderAudio.name,
            to: current_conversation?.user_id,
            from: user_id,
            conversation_id: room_id,
            type: "audio",
            msg: "audio-message",
            mediaUrl: response?.data?.mediaUrl,
          });
          play();
        })
        .catch((err) => {
          console.log(err);
        });

      setrecordedAudio(null);
      setLoading(false);
      hide(false);
    } catch (error) {
      console.log("ERROR MESSAGE - ", error.message);
      setrecordedAudio(null);
      setLoading(false);
    }
  };

  return (
    <div className=" flex text-2xl w-full justify-end items-center">
      <div className="pt-1">
        <FaTrash
          className={`text-[#ffffff] cursor-pointer hover:text-red-500 transition-colors duration-300 ${
            theme.palette.mode == "light" ? "text-gray-700" : null
          }`}
          onClick={() => {
            socket.emit("updateRecordingAudio", {
              to: current_conversation?.user_id,
              from: user_id,
              conversationId: room_id,
              recordingAudio: false,
            });
            hide(false);
          }}
        />
      </div>
      <div
        className={`mx-4 py-4 text-white text-lg flex gap-3 justify-center items-center rounded-full drop-shadow-lg bg-gray-900 w-96 ${
          theme.palette.mode == "light" ? "bg-slate-600" : null
        }`}
      >
        {isRecording ? (
          <div className="text-red-500 animate-pulse w-60 text-center">
            Recording <span>{recordingDuration}s</span>
          </div>
        ) : (
          <div className="ml-4">
            {recordedAudio && (
              <>
                {!isPlaying ? (
                  <FaPlay
                    onClick={handlePlayRecording}
                    className="hover:text-green-500 transition-colors duration-300 cursor-pointer"
                  />
                ) : (
                  <FaStop
                    onClick={handlePauseRecording}
                    className="hover:text-green-500 transition-colors duration-300 cursor-pointer"
                  />
                )}
              </>
            )}
          </div>
        )}
        <div className="w-60" ref={waveformRef} hidden={isRecording} />
        {recordedAudio && isPlaying && (
          <span className="mr-3">{formatTime(currentPlayBackTime)}</span>
        )}
        {recordedAudio && !isPlaying && (
          <span className="mr-3">{formatTime(totalDuration)}</span>
        )}

        <audio ref={audioRef} hidden />
      </div>
      <div className="mr-4">
        {!isRecording ? (
          <FaMicrophone
            size={24}
            className=" text-red-500 text-xl cursor-pointer"
            onClick={handleStartRecording}
          />
        ) : (
          <FaPauseCircle
            size={24}
            className=" text-red-500 text-xl cursor-pointer" 
            onClick={handleStopRecording}
          />
        )}
      </div>
      {!loading ? (
        <div>
          <MdSend
            className={`text-[#ffffff] cursor-pointer mr-4 hover:text-blue-500 transition-colors divide-purple-300 ${
              theme.palette.mode == "light" ? "text-gray-700" : null
            }`}
            title="send"
            onClick={sendRecording}
          />
        </div>
      ) : (
        <UseAnimations animation={loader} strokeColor="#0E96D8" size={60} />
      )}
    </div>
  );
};

export default CaptureAudio;
