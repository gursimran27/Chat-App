// routes
// theme
// components
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import ThemeSettings from "./components/settings";
import ThemeProvider from "./theme";
import Router from "./routes";
import { closeSnackBar } from "./redux/slices/app";
import Slide from '@mui/material/Slide';
// import { socket } from "./socket";
import "./App.css"

const vertical = "top";
const horizontal = "center";

const Alert = React.forwardRef((props, ref) => (
  <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
));

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

function App() {
  const dispatch = useDispatch();

  // const snackbar = useSelector((state) => state.app.snackbar) || {};
  // const { open = false, severity = '', message = '' } = snackbar;
              // or
  const { severity, message, open } = useSelector(
    (state) => state.app.snackbar
  );


  return (
    <>
      <ThemeProvider>
        <ThemeSettings>
          {" "}
          <Router />{" "}
        </ThemeSettings>
      </ThemeProvider>

      {message && open ? (
        <Snackbar
          anchorOrigin={{ vertical, horizontal }}
          open={open}
          autoHideDuration={4000}
          key={vertical + horizontal}
          TransitionComponent={SlideTransition}
          onClose={() => {
            console.log("This is clicked");
            dispatch(closeSnackBar());
          }}
        >
          <Alert
            onClose={() => {
              console.log("This is clicked");
              dispatch(closeSnackBar());
            }}
            severity={severity}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>
      ) : (
        <></>
      )}
    </>
  );
}

export default App;