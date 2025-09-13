import express from "express";
import userModel from "../config/db.js";
import { PendingUser } from "../config/db.js";

const signup = express.Router();
// Temporary in-memory storage for pending registrations
signup.post("/", async (req, res) => {
  const { username, email, password, realName } = req.body;
  console.log("userData : ", { username, email, password, realName });
  try {
    console.log("Signup route hit");
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {fro
      return res.status(409).json({ detail: "Username already exists." });
    }
    if (!email.endsWith("@gmail.com")) {
      return res
        .status(400)
        .json({ detail: "Only Gmail addresses are allowed" });
    }

    // Check if user is already pending registration
    const pending = await PendingUser.findOne({ email });
    if (pending) {
      return res
        .status(409)
        .json({ detail: "Registration already pending for this email." });
    }

    // Check if user already exists in DB
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ detail: "Email already registered." });
    }

    // Store temporarily for Google verification
    await PendingUser.create({ username, email, password , realName});
    res.status(200).json({
      message:
        "Signup received. Please verify your Gmail using Google sign in.",
      user: { username, email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ detail: "Server error during registration" });
  }
});

// Export the pending registrations store for use in /signin route
export default signup;
