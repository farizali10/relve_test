import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuth: false,
  loading: false,
  btnLoading: false,
  error: null,
  message: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    btnLoadingStart: (state) => {
      state.btnLoading = true;
      state.error = null;
      state.message = null;
    },
    loadingStart: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    registerSuccess: (state, action) => {
      state.btnLoading = false;
      state.user = action.payload.user;
      state.isAuth = true;
      state.message = action.payload.message;
      state.error = null;
    },
    registerFail: (state, action) => {
      state.btnLoading = false;
      state.user = null;
      state.isAuth = false;
      state.error = action.payload;
    },
    loginSuccess: (state, action) => {
      state.btnLoading = false;
      state.user = action.payload.user;
      state.isAuth = true;
      state.message = action.payload.message;
      state.error = null;
    },
    loginFail: (state, action) => {
      state.btnLoading = false;
      state.user = null;
      state.isAuth = false;
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.isAuth = false;
      state.message = "Logged out successfully.";
      state.error = null;
    },
    getUserSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isAuth = true;
      state.error = null;
    },
    getUserFail: (state, action) => {
      state.loading = false;
      state.user = null;
      state.isAuth = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
});

export const {
  btnLoadingStart,
  loadingStart,
  registerSuccess,
  registerFail,
  loginSuccess,
  loginFail,
  logoutSuccess,
  getUserSuccess,
  getUserFail,
  clearError,
  clearMessage,
} = userSlice.actions;

export default userSlice.reducer;
