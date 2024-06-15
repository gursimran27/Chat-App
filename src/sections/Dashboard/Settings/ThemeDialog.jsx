import React from "react";
import {
  Dialog,
  Slide,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  useTheme,
  FormHelperText,
} from "@mui/material";
import useSettings from "../../../hooks/useSettings";
import { useDispatch } from "react-redux";
import { UpdateTheme } from "../../../redux/slices/theme";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ThemeDialog = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { onChangeMode } = useSettings();

  const [value, setValue] = React.useState(theme.palette.mode);

  const [error, setError] = React.useState(false);

  const [helperText, setHelperText] = React.useState("");

  const handleChange = (event) => {
    setValue(event);
    setHelperText(" ");
    setError(false);
  };

  const handleClick = () => {
    if (
      value === "light" ||
      value === "dark" ||
      theme.palette.mode === value.target.value
    ) {
      setHelperText("The theme selected is same as the current theme!");
      setError(true);
      return;
    } else onChangeMode(value);//passed evnet
    dispatch(UpdateTheme(value.target.value));
    handleClose();
  };

  return (
    <>
      <Dialog
        fullWidth
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle sx={{ mb: 2 }}>{"Choose Theme"}</DialogTitle>
        <DialogContent>
          <FormControl error={error}>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={theme.palette.mode}
              name="radio-buttons-group"
              onChange={handleChange}
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label="Light"
              />
              <FormControlLabel value="dark" control={<Radio />} label="Dark" />
              <FormControlLabel
                value="system"
                disabled
                control={<Radio />}
                label="System Default"
              />
            </RadioGroup>
            <FormHelperText>{helperText}</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={() => handleClick()}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ThemeDialog;
