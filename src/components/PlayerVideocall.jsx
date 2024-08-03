import ReactPlayer from "react-player";
import { Mic, MicOff, UserSquare2, Video, VideoOff } from "lucide-react";

const PlayerVideocall = (props) => {
  const { url, muted, playing, isActive, me } = props;
  return (
    <div
      className={` relative overflow-hidden mb-5 h-full ${
        !isActive ? "rounded-md h-min w-[200px] shadow-lg" : "rounded-lg"
      } ${!playing ? "flex items-center justify-center" : null}`}
    >
      {playing ? (
        <>
        <ReactPlayer
          url={url}
          muted={me? muted : true}
          playing={playing}
          width="100%"
          height="100%"
        />
        </>
      ) : (
        <>
        <ReactPlayer
          url={url}
          muted={me? muted : true}
          playing={true}
          width="100%"
          height="100%"
          style={{display:'none'}}
        />
        <UserSquare2 className={` text-white`} size={isActive ? 400 : 150} />
        </>
      )}


      <div
        className={` text-white absolute left-0 top-2 flex justify-center items-center gap-1`}
      >
        {isActive && me ? (
          muted ? (
            <MicOff className={"text-white"} size={20} />
          ) : (
            <Mic className={"text-white"} size={20} />
          )
        ) : undefined}
        {isActive && me ? (
          !playing ? (
            <VideoOff className={"text-white"} size={20} />
          ) : (
            <Video className={"text-white"} size={20} />
          )
        ) : undefined}
      </div>
    </div>
  );
};

export default PlayerVideocall;
