import express from "express";
import { authenticateToken } from "../middleware/jwtAuth.js";
import { error } from "console";
import { Response, Thread } from "../config/db.js";
import userModel from "../config/db.js";
import bcrypt from "bcrypt";
import axios from "axios";

const publicProfile = express.Router();

function calculateRank(credits) {
  if (credits > 5000) return "Elite Master";
  if (credits > 2000) return "Sage";
  if (credits > 500) return "Guru";
  if (credits > 100) return "Scholar";
  return "Newbie";
}

// ✅ Corrected route definition to accept an ID parameter
publicProfile.get("/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Id : ", id);
  try {
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await userModel
      .findById(id)
      .populate("badges")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch user stats
    const questionsAsked = await Thread.countDocuments({ author: user._id });
    const answersGiven = await Response.countDocuments({ author: user._id });

    // Assuming totalUpvotes is a field on your userModel
    // If not, you'll need to calculate it from the responses
    // For now, let's assume it's already on the user model.
    const totalUpvotes = user.totalUpvotes || 0;
    const bestAnswerCount = user.bestAnswerCount || 0;
    const totalCredits = user.credits;
    const rank = calculateRank(totalCredits);
    const newRank = calculateRank(totalCredits);
    if (user.rank !== newRank) {
      user.rank = newRank;
      await user.save();
    }
    // Respond with the public profile data
    res.json({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      bio: user.bio,
      rank: user.rank,
      questionsAsked,
      answersGiven,
      totalUpvotes,
      bestAnswerCount,
      totalCredits,
      badges: user.badges,
    });
  } catch (err) {
    console.error("Public profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default publicProfile;
