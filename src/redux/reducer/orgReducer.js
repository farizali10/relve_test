import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  organization: null,
  loading: false,
  btnLoading: false,
  error: null,
  message: null,
};

const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    loadingStart: (state) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    btnLoadingStart: (state) => {
      state.btnLoading = true;
      state.error = null;
      state.message = null;
    },
    getOrganizationSuccess: (state, action) => {
      state.loading = false;
      state.organization = action.payload;
    },
    getOrganizationFail: (state, action) => {
      state.loading = false;
      state.organization = null;
      state.error = action.payload;
    },
    addOrganizationSuccess: (state, action) => {
      state.btnLoading = false;
      state.organization = action.payload.organization;
      state.message = action.payload.message;
      state.error = null;
    },
    addOrganizationFail: (state, action) => {
      state.btnLoading = false;
      state.error = action.payload;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearOrganization: (state) => {
      state.organization = null;
      state.error = null;
      state.message = null;
      state.loading = false;
      state.btnLoading = false;
    },
  },
});

export const {
  loadingStart,
  btnLoadingStart,
  getOrganizationSuccess,
  getOrganizationFail,
  addOrganizationSuccess,
  addOrganizationFail,
  clearMessage,
  clearError,
  clearOrganization,
} = organizationSlice.actions;

export default organizationSlice.reducer;
