import express from "express";
import { authenticateToken } from "../middleware/jwtAuth.js";
import { error } from "console";
import { Response, Thread } from "../config/db.js";
import userModel from "../config/db.js";
import bcrypt from "bcrypt";

const profile = express.Router();

function calculateRank(credits) {
  if (credits >= 1000) return "Diamond";
  if (credits >= 500) return "Platinum";
  if (credits >= 200) return "Gold";
  if (credits >= 50) return "Silver";
  return "Bronze";
}

profile.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // The credits field is now the single source of truth
    const questionsAsked = await Thread.countDocuments({ author: user._id });
    const answersGiven = await Response.countDocuments({ author: user._id });

    // The values are already stored on the user object
    const bestAnswerCount = user.bestAnswerCount;
    const totalCredits = user.credits;
    const rank = user.rank;

    res.json({
      ...user.toObject(),
      questionsAsked,
      answersGiven,
      bestAnswerCount,
      totalCredits,
      rank,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

profile.post("/claim", authenticateToken, async (req, res) => {
  try {
    const { rank } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const costMap = {
      Bronze: 50,
      Silver: 200,
      Gold: 500,
      Platinum: 800,
      Diamond: 1000,
    };
    const cost = costMap[rank];

    if (user.credits < cost) {
      return res.status(400).json({ message: "Not enough " });
    }
    user.credits = user.credits - cost;
    user.claimedRank = rank;
    await user.save();
    console.log("Rank :", user.claimedRank);
    res.json({
      success: true,
      claimedRank: user.claimedRank,
      credits: user.credits,
    });
  } catch (err) {
    console.log("Claim error : ", err);
    res.status(500).json({ message: "Server error" });
  }
});
profile.put("/update", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ detail: "User not found" });

    // Update a single field based on the request body
    const { username, realName, bio } = req.body;

    if (username) user.username = username;
    if (realName) user.realName = realName;
    if (bio) user.bio = bio;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ detail: "Failed to update profile" });
  }
});

profile.put("/update-email", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ detail: "User not found" });

    const { newEmail } = req.body;
    if (!newEmail)
      return res.status(400).json({ detail: "New email is required" });

    user.email = newEmail;
    user.isVerified = false; // Set to false to trigger re-verification
    await user.save();

    // ⚠️ You'll need to send a new verification email here
    res.status(200).json({
      message: "Email updated successfully. Please verify your new email.",
    });
  } catch (err) {
    console.error("Email update error:", err);
    res.status(500).json({ detail: "Failed to update email" });
  }
});
profile.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ detail: "User not found" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ detail: "Current and new passwords are required" });
    }

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ detail: "Invalid current password" });
    }

    // Hash and save the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ detail: "Failed to change password" });
  }
});
export default profile;
