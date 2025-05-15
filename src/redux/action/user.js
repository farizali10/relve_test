import axios from "axios";
import Cookies from "js-cookie";
import {
  btnLoadingStart,
  registerSuccess,
  registerFail,
  loginSuccess,
  loginFail,
  logoutSuccess,
  getUserSuccess,
  getUserFail,
  clearError,
  clearMessage,
} from "../reducer/userReducer";

export const registerUser = (formdata) => async (dispatch) => {
  try {
    dispatch(btnLoadingStart());

    const { data } = await axios.post("/api/user/register", formdata);

    Cookies.set("token", data.token, { expires: 5, secure: true, path: "/" });

    dispatch(registerSuccess(data));
  } catch (error) {
    dispatch(registerFail(error.response?.data?.message || error.message));
  }
};

export const loginUser = (email, password) => async (dispatch) => {
  try {
    dispatch(btnLoadingStart());

    const { data } = await axios.post("/api/user/login", { email, password });

    Cookies.set("token", data.token, { expires: 5, secure: true, path: "/" });

    dispatch(loginSuccess(data));
  } catch (error) {
    dispatch(loginFail(error.response?.data?.message || error.message));
  }
};

export const getUser = () => async (dispatch) => {
  try {
    dispatch(loadingStart());

    const { data } = await axios.get("/api/user/me");

    dispatch(getUserSuccess(data));
  } catch (error) {
    dispatch(getUserFail(error.response?.data?.message || error.message));
  }
};

export const logoutUser = () => (dispatch) => {
  Cookies.remove("token", { path: "/" });
  dispatch(logoutSuccess());
};

export const clearUserError = () => (dispatch) => {
  dispatch(clearError());
};

export const clearUserMessage = () => (dispatch) => {
  dispatch(clearMessage());
};
