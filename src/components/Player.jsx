import { Mic, MicOff } from "lucide-react";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

const Player = (props) => {
  const { url, muted, isActive } = props;
  const audioRef = useRef(null);

  const [call_details] = useSelector((state) => state.audioCall.call_queue);
  const { incoming } = useSelector((state) => state.audioCall);

  let fName;
  let lName;
  let avatar = null;
  if (incoming) {
    fName = call_details?.from?.firstName;
    lName = call_details?.from?.lastName;
    avatar = call_details?.from?.avatar || null;
  } else {
    fName = call_details?.to?.firstName;
    lName = call_details?.to?.lastName;
    avatar = call_details?.to?.avatar || null;
  }

  useEffect(() => {
    if (audioRef.current && url) {
      audioRef.current.srcObject = url;
    }
  }, [url]);
  return (
    <>
      <div className=" flex flex-col justify-center items-center relative rounded-full">
        <img
          src={
            avatar ||
            `https://api.dicebear.com/5.x/initials/svg?seed=${fName} ${lName}`
          }
          className={"object-contain rounded-3xl select-none max-w-[400px] max-h-[400px]"}
          width={400}
          height={400}
        />
        <span className={`text-white text-3xl font-light capitalize select-none`}>
          {fName}{' '}{lName}
        </span>

        <audio ref={audioRef} autoPlay muted={muted} controls={false} />

        <div
          className={`text-white absolute left-2 top-4 flex justify-center items-center gap-1`}
        >
          {isActive ? (
            muted ? (
              <MicOff className={"text-white"} size={25} />
            ) : (
              <Mic className={"text-white"} size={25} />
            )
          ) : undefined}
        </div>
      </div>
    </>
  );
};

export default Player;
