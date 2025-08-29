import express from "express";
import { authenticateToken } from "../middleware/jwtAuth.js";
import userModel from "./db.js"; // User model
import { Reward} from "./db.js"

const rewardRouter = express.Router();

rewardRouter.get("/", async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ createdAt: -1 }).lean();
    console.log("Rewards : ", rewards)
    res.json(rewards);
  } catch (err) {
    console.error("Error fetching rewards:", err);
    res.status(500).json({ detail: "Failed to fetch rewards" });
  }
});

// POST /rewards/:id/redeem — redeem reward
rewardRouter.post("/:id/redeem", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const rewardId = req.params.id;

  try {
    const reward = await Reward.findById(rewardId);
    if (!reward) return res.status(404).json({ detail: "Reward not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ detail: "User not found" });

    if (user.credits < reward.cost) {
      return res.status(400).json({ detail: "Not enough credits" });
    }

    // Deduct credits
    user.credits -= reward.cost;
    await user.save();

    res.json({
      message: "Reward redeemed successfully",
      remainingCredits: user.credits,
    });
  } catch (err) {
    console.error("Error redeeming reward:", err);
    res.status(500).json({ detail: "Failed to redeem reward" });
  }
});

export default rewardRouter