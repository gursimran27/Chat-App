import { faker } from "@faker-js/faker";
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
  ResetAudioCallQueue,
  UpdateAudioCallDialog,
  UpdateMain,
} from "../../../redux/slices/audioCall";
import { socket } from "../../../socket";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CallNotification = ({ open, handleClose }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.app);
  const [call_details] = useSelector((state) => state.audioCall.call_queue);

  const handleAccept = () => {
    socket.emit("audio_call_accepted", { ...call_details });
    // dispatch(UpdateAudioCallDialog({ state: true }));
    dispatch(UpdateMain());
  };

  const handleDeny = () => {
    //
    socket.emit("audio_call_denied", { ...call_details });
    dispatch(ResetAudioCallQueue());
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