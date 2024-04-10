import bcrypt from "bcrypt";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/User.js";
dotenv.config();

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ message: "user already existed" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashpassword,
    });

    await newUser.save();
    res.json({ status: true, message: "record registered successfully" });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Wrong password" });
    }
    const accessToken = jwt.sign(
      { email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const refreshToken = jwt.sign(
      { email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("accessToken", accessToken, {
      maxAge: 60 * 60 * 24 * 30 * 1000,
      httpOnly: true,
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 60 * 60 * 24 * 30 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.json({ status: true, message: "Login successful" });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "5m",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `To reset your password, click the following link: http://localhost:5173/resetPassword/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ status: false, message: "Internal server error" });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({ status: true, message: "Email sent" });
      }
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params; // a token stored a single user information by bcrypt and hashing it.
  const { password } = req.body;

  try {
    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decoded);
    const id = decoded.id;
    const hashPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate({ _id: id }, { password: hashPassword });
    res.json({ status: true, message: "Updated password successfully" });
  } catch (err) {
    res.json({ status: false, message: "Invalid token received" });
  }
});

const renewToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken; // check refresh token
    let exist = false;

    if (!refreshToken) {
      res.status(401).json({ status: false, message: "No refreshToken" });
    } else {
      const decoded = await jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      if (decoded) {
        const accessToken = jwt.sign(
          { email: decoded.email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1h",
          }
        );

        res.cookie("accessToken", accessToken, {
          maxAge: 60 * 60 * 1000, // 1 hour
          httpOnly: true,
        });

        exist = true;
        res.status(200).json({ status: true, message: "Token renewed" });
      }
    }

    return exist;
  } catch (err) {
    res.status(401).json({ status: false, message: "Invalid token" });
  }
};

const verifyUser = async (req, res, next) => {
  console.log("verifyUser middleware executed");
  try {
    const accessToken = req.cookies.accessToken; // check access token
    console.log("Access token:", accessToken);

    if (!accessToken) {
      if (renewToken) {
        next();
      }
      return res
        .status(401)
        .json({ status: false, message: "No accessToken or RenewToken" });
    }
    const decoded = await jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    console.log("Decoded token data:", decoded);
    next();
  } catch (err) {
    res.status(401).json({ status: false, message: "Invalid token" });
  }
};

router.get("/verify", verifyUser, (req, res) => {
  res.json({ status: true, message: "Authorized" });
});

router.get("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ status: true, message: "Logged out" });
});

export { router as UserRouter };
