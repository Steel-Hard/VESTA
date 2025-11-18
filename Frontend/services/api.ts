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
      console.log(error);
      return Promise.reject(new AppError(error.response.data.message));
    } else {
      console.log(error);
      return Promise.reject(error);
    }
  }
);
