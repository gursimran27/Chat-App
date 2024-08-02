
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slide,
  Stack,
} from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ResetVideoCallQueue,
  UpdateVideoCallDialog,
  UpdateMainVideo,
} from "../../../redux/slices/videoCall";
import { socket } from "../../../socket";


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CallNotification = ({ open, handleClose }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.app);
  const [call_details] = useSelector((state) => state.videoCall.call_queue);

  const handleAccept = () => {
    socket.emit("video_call_accepted", { ...call_details });
    // dispatch(UpdateAudioCallDialog({ state: true }));
    dispatch(UpdateMainVideo());
  };

  const handleDeny = () => {
    //
    socket.emit("video_call_denied", { ...call_details });
    dispatch(ResetVideoCallQueue());
    handleClose();
  };

  return (
    <>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleDeny}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogContent>
          <Stack direction="row" spacing={10} p={2} justifyContent={"center"}
              alignItems={"center"}>
            <Stack direction={"column"}
              justifyContent={"center"}
              alignItems={"center"}>
              <Avatar
                sx={{ height: 100, width: 100 }}
                src={
                  call_details?.from?.avatar ||
                  `https://api.dicebear.com/5.x/initials/svg?seed=${call_details?.from?.firstName} ${call_details?.from?.lastName}`
                }
              />
              <span className=" capitalize">{call_details?.from?.firstName}</span>
            </Stack>
            <div className=" text-xl font-bold">Incomming...</div>
            <Stack direction={"column"}
              justifyContent={"center"}
              alignItems={"center"}>
              <Avatar
                sx={{ height: 100, width: 100 }}
                src={
                  call_details?.to?.avatar ||
                  `https://api.dicebear.com/5.x/initials/svg?seed=${call_details?.to?.firstName} ${call_details?.to?.lastName}`
                }
              />
              <span className=" capitalize">{call_details?.to?.firstName}</span>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAccept} variant="contained" color="success">
            Accept
          </Button>
          <Button onClick={handleDeny} variant="contained" color="error">
            Deny
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CallNotification;