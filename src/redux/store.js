import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./reducer/userReducer";
import organizationReducer from "./reducer/orgReducer";

const store = configureStore({
  reducer: {
    user: userReducer,
    organization: organizationReducer,
  },
});

export default store;
