import express from "express";
import userModel, { Response } from "../config/db.js";
import { authenticateToken } from "../middleware/jwtAuth.js";
import { error } from "console";

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
    // select everything except password
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // compute likes/dislikes if you want to show them
    const responses = await Response.find().populate("author");
    let likes = 0;
    let dislikes = 0;
    responses.forEach((response) => {
      if (response.author?._id?.equals(user._id)) {
        likes += response.thumbs_up;
        dislikes += response.thumbs_down;
      }
    });
    const computedCredits = likes * 5 - 2 * dislikes;

    // do NOT overwrite user.credits here
    // just compute the rank for display
    const rank = calculateRank(user.credits); // use stored credits
    user.rank = rank;

    // optionally include computed credits as a separate field
    res.json({
      ...user.toObject(),
      computedCredits, // if you want to show what they’ve earned
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

export default profile;
