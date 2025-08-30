import express from "express";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../config/db.js";

const signin = express.Router();

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

signin.post("/", async (req, res) => {
  const { email, token } = req.body;

  try {
    if (!pendingRegistrations[email]) {
      return res.status(400).json({ detail: "No pending registration for this email." });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const verifiedEmail = payload.email;

    if (verifiedEmail !== email) {
      return res.status(401).json({ detail: "Google verification failed." });
    }

    // Retrieve stored registration details
    const { username, password } = pendingRegistrations[email];

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in MongoDB
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      isVerified: true, // verified via Google
    });

    // Delete from pending registrations
    delete pendingRegistrations[email];

    // Generate JWT token
    const authToken = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || "your_default_secret",
      { expiresIn: "20h" }
    );

    res.status(201).json({
      message: "Signup successful! User verified via Google.",
      token: authToken,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ detail: "Server error during Google verification." });
  }
});

export default signin;
