import { createSlice } from "@reduxjs/toolkit";

import axios from "../../utils/axios";
import { showSnackbar } from "./app";
import { SelectConversation } from "./app";

// ----------------------------------------------------------------------

const initialState = {
  isLoggedIn: false,
  token: "",
  isLoading: false,
  user: null,
  user_id: null,
  email: "",
  error: false,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateIsLoading(state, action) {
      state.error = action.payload.error;
      state.isLoading = action.payload.isLoading;
    },
    logIn(state, action) {
      state.isLoggedIn = action.payload.isLoggedIn;
      state.token = action.payload.token;
      state.user_id = action.payload.user_id;
    },
    signOut(state, action) {
      state.isLoggedIn = false;
      state.token = "";
      state.user_id = null;
    },
    updateRegisterEmail(state, action) {
      state.email = action.payload.email;
    },
  },
});

// Reducer
export default slice.reducer;

// ==========================================Thunk action================================================

export function NewPassword(formValues, navigate) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateIsLoading({ isLoading: true, error: false }));

    await axios
      .post(
        "/auth/reset-password",
        {
          ...formValues,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(function (response) {
        console.log(response);
        navigate("/auth/login");
        // dispatch(
        //     slice.actions.logIn({
        //       isLoggedIn: true,
        //       token: response.data.token,
        //     })
        //   );
        dispatch(
          showSnackbar({ severity: "success", message: response.data.message })
        );
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: false })
        );
      })
      .catch(function (error) {
        console.log(error);
        dispatch(showSnackbar({ severity: "error", message: error.message }));
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: true })
        );
      });
  };
}

export function ForgotPassword(formValues) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateIsLoading({ isLoading: true, error: false }));

    await axios
      .post(
        "/auth/forgot-password",
        {
          ...formValues,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(function (response) {
        console.log(response);

        dispatch(
          showSnackbar({ severity: "success", message: response.data.message })
        );
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: false })
        );
      })
      .catch(function (error) {
        console.log(error);
        dispatch(showSnackbar({ severity: "error", message: error.message }));
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: true })
        );
      });
  };
}

export function LoginUser(formValues) {
  return async (dispatch, getState) => {
    // Make API call here

    dispatch(slice.actions.updateIsLoading({ isLoading: true, error: false }));

    await axios
      .post(
        "/auth/login",
        {
          ...formValues,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(async function (response) {
        console.log(response);
        window.localStorage.setItem("user_id", response.data.user_id);
        await dispatch(
          showSnackbar({ severity: "success", message: response.data.message })
          );
          await dispatch(
            slice.actions.updateIsLoading({ isLoading: false, error: false })
            );
          console.log("hiii");
          await dispatch(
            slice.actions.logIn({
              isLoggedIn: true,
              token: response.data.token,
              user_id: response.data.user_id,
            })
          );
      })
      .catch(function (error) {
        console.log(error);
        dispatch(showSnackbar({ severity: "error", message: error.message }));
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: true })
        );
      });
  };
}

export function LogoutUser() {
  return async (dispatch, getState) => {
    window.localStorage.removeItem("user_id");
    dispatch(slice.actions.signOut());
    dispatch(SelectConversation({ room_id: null }));
    dispatch(showSnackbar({ severity: "success", message: "Logged Out..." }));
  };
}

export function RegisterUser(formValues, navigate) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateIsLoading({ isLoading: true, error: false }));

    await axios
      .post(
        "/auth/register",
        {
          ...formValues,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(function (response) {
        console.log(response);
        dispatch(
          slice.actions.updateRegisterEmail({ email: formValues.email })
        );

        navigate("/auth/verify");

        dispatch(
          showSnackbar({ severity: "success", message: response.data.message })
        );
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: false })
        );
      })
      .catch(function (error) {
        console.log(error);
        dispatch(showSnackbar({ severity: "error", message: error.message }));
        dispatch(
          slice.actions.updateIsLoading({ error: true, isLoading: false })
        );
        dispatch(slice.actions.updateRegisterEmail({ email: "" }));
      });
    // .finally(() => {
    //   if (!getState().auth.error) {
    //     window.location.href = "/auth/verify";
    //   }
    // });
  };
}

export function VerifyEmail(formValues) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateIsLoading({ isLoading: true, error: false }));

    await axios
      .post(
        "/auth/verify",
        {
          ...formValues,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(function (response) {
        console.log(response);

        dispatch(slice.actions.updateRegisterEmail({ email: "" }));

        window.localStorage.setItem("user_id", response.data.user_id);
        dispatch(
          slice.actions.logIn({
            isLoggedIn: true,
            token: response.data.token,
            user_id: response.data.user_id,
          })
        );

        dispatch(
          showSnackbar({ severity: "success", message: response.data.message })
        );
        dispatch(
          slice.actions.updateIsLoading({ isLoading: false, error: false })
        );
      })
      .catch(function (error) {
        console.log(error);
        dispatch(showSnackbar({ severity: "error", message: error.message }));
        dispatch(
          slice.actions.updateIsLoading({ error: true, isLoading: false })
        );
      });
  };
}
