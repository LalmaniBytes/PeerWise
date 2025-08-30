import express from "express";
import { OAuth2Client } from "google-auth-library";
import userModel from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // for password hashing
import { PendingUser } from "../config/db.js"; // ✅ import your model

const verifyGoogle = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/verify-google
verifyGoogle.post("/", async (req, res) => {
  try {
    const { token, email } = req.body; // token = Google ID token from frontend

    console.log("Email : ", email);

    if (!token || !email) {
      return res.status(400).json({ message: "Token and email are required." });
    }

    // 🔹 Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleId = payload.sub; // unique Google user ID
    const emailVerified = payload.email_verified;

    // 🔹 Ensure the Google email matches the one typed at signup
    if (!emailVerified || googleEmail !== email) {
      return res
        .status(401)
        .json({ message: "Google verification failed. Email mismatch." });
    }

    // 🔹 Find user in DB
    let user = await userModel.findOne({ email });

    // If not in DB, check pending registrations collection
    if (!user) {
      const pending = await PendingUser.findOne({ email });
      if (!pending) {
        return res
          .status(404)
          .json({ message: "No pending registration found." });
      }

      // Password already hashed at signup, so don’t hash again
      user = await userModel.create({
        username: pending.username,
        email,
        password: pending.password,
        isVerified: true,
        verifiedAt: new Date(),
        googleId,
      });

      // Cleanup pending entry
      await PendingUser.deleteOne({ email });
    } else {
      // If user exists, update verification status
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.googleId = googleId;
      await user.save();
    }

    // 🔹 Issue JWT
    const authToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "your_default_secret",
      { expiresIn: "20h" }
    );

    res.json({
      message: "Account verified successfully.",
      token: authToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    if (
      err.message.includes("Invalid token") ||
      err.message.includes("Wrong number of segments")
    ) {
      return res.status(401).json({ message: "Invalid Google token." });
    }

    console.error("Google verification error:", err);
    res
      .status(500)
      .json({ message: "Server error during Google verification." });
  }
});

export default verifyGoogle;
