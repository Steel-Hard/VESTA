import { Router } from "express";
import userController from "./userRoute"

const routes = Router();

routes.use("/auth", userController);


export default routes;