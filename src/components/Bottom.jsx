import { Mic, PhoneOff, MicOff } from "lucide-react";

const Bottom = (props) => {
  const { muted, toggleAudio, leaveRoom, clickable } = props;

  return (
    <div className=" absolute flex justify-center gap-10 bottom-5 left-0 right-0 mx-auto w-[300px]">
      {clickable && (
        <div>
          {muted ? (
            <MicOff
              className={`p-4 rounded-full text-white cursor-pointer transition-colors duration-300 bg-[#d90429]`}
              size={55}
              onClick={toggleAudio}
            />
          ) : (
            <Mic
              className={`p-4 rounded-full text-white cursor-pointer transition-colors duration-300 bg-[#343a40] hover:bg-[#d90429]`}
              size={55}
              onClick={toggleAudio}
            />
          )}
        </div>
      )}
      <div
        className={` ${
          !clickable
            ? `w-[100%] text-center flex justify-center items-center`
            : null
        }`}
      >
        <PhoneOff
          size={55}
          className={`p-4 rounded-full text-white cursor-pointer transition-colors duration-300 bg-[#343a40] hover:bg-[#d90429]`}
          onClick={leaveRoom}
        />
      </div>
    </div>
  );
};

export default Bottom;
