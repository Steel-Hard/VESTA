import { AppError } from "@/utils/AppError";
import axios from "axios";

const baseURL = "http://192.168.0.4:3030/";

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    "content-type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.data) {
      return Promise.reject(new AppError(error.response.data.message));
    } else {
      return Promise.reject(error);
    }
  }
);
