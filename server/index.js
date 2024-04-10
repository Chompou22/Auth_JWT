import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import { UserRouter } from "./routes/user.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

// Middleware to handle CORS and JSON data
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/auth", UserRouter);

// Database connection
connectDB();

app.listen(process.env.PORT, () => {
  console.log("Server listening on port " + process.env.PORT);
});
