import express from "express";
import cors from "cors";
import routes from "./routes";
import mongo  from "mongoose";

const app = express();

app.use(express.json());

app.use(cors());

app.use(routes);

mongo.connect("mongodb://localhost:27017/vesta").then(() => {
  console.log("Connected to database");
});

app.listen(3030, () => {
  console.log("Running at port 3030");
});
