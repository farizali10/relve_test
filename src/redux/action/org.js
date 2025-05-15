import axios from "axios";
import Cookies from "js-cookie";
import {
  loadingStart,
  btnLoadingStart,
  getOrganizationSuccess,
  getOrganizationFail,
  addOrganizationSuccess,
  addOrganizationFail,
} from "../reducer/orgReducer";

export const getOrganization = () => async (dispatch) => {
  try {
    dispatch(loadingStart());

    const token = Cookies.get("token");

    const { data } = await axios.get("/api/organization", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch(getOrganizationSuccess(data));
  } catch (error) {
    dispatch(
      getOrganizationFail(error.response?.data?.message || error.message)
    );
  }
};

export const addOrganization = (formdata, clearData) => async (dispatch) => {
  try {
    dispatch(btnLoadingStart());

    const token = Cookies.get("token");

    const { data } = await axios.post("/api/organization", formdata, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch(addOrganizationSuccess(data));
    if (clearData) clearData();
  } catch (error) {
    const errorMessage =
      error.response?.data?.message === "User already has an organization"
        ? "You have already created an organization."
        : error.response?.data?.message || error.message;

    dispatch(addOrganizationFail(errorMessage));
  }
};
