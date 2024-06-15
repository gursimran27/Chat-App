import { createSlice } from "@reduxjs/toolkit";



const initialState = {
    theme:'light',
}


const themeSlice = createSlice({
    name:'theme',
    initialState,
    reducers:{
        // Toggle Sidebar
        toggleTheme(state) {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
        },
        updateTheme(state, action) {
            state.theme = action.payload.value;
        },
    }
});


// Reducer
export default themeSlice.reducer;



// ----------------------------------------------------------redux Thunk async functions

export function ToggleTheme() {
    return async (dispatch, getState) => {
      dispatch(themeSlice.actions.toggleTheme());
    };
  }

  export function UpdateTheme(value) {
    return async (dispatch, getState) => {
        // console.log("value",value);
      dispatch(themeSlice.actions.updateTheme({ value }));
    };
  }