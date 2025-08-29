import express from "express";
import userModel, { Response } from "../config/db.js";
import { authenticateToken } from "../middleware/jwtAuth.js";

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
    // console.log("user :", user);
    const responses = await Response.find().populate("author");
    let likes = 0;
    let dislikes = 0;

    responses.forEach((response) => {
      if (response.author._id.equals(user._id)) {
        likes = response.thumbs_up;
        dislikes = response.thumbs_down;
      }
    });
    // console.log("Likes : ", likes);
    // console.log("Dislikes ", dislikes);
    const credits = likes * 5 + -2 * dislikes;
    user.credits = credits;
    const rank = calculateRank(credits)
    user.rank = rank;
    // console.log("Rank : " , rank)
    await user.save();

    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default profile;
