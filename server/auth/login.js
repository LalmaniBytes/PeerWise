import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import userModel from "../config/db.js";
import bcrypt from "bcryptjs";

const login = express.Router();

login.get("/", (req, res) => {
  ("✅ Login route file loaded");
  res.send("Login route is working!");
});

login.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(403).json({ message: "No such user found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Incorrect password!" });
    }
    // if (!user.isVerified) {
    //   return res
    //     .status(403)
    //     .json({ message: "Please verify your Gmail first." });
    // }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "your_default_secret",
      { expiresIn: "20h" }
    );

    console.log("Login successful");
    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        credits: user.credits,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error!" });
  }
});

export default login;
