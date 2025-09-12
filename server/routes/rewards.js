import express from "express";
import { authenticateToken } from "../middleware/jwtAuth.js";
import { Reward, Badge }  from "../config/db.js";
import userModel  from "../config/db.js";

const rewardRoute = express.Router();

rewardRoute.get("/", async (req, res) => {
  try {
    
    const rewards = await Reward.find().populate("badge");
    res.status(200).json(rewards);
  } catch (error) {
    console.error("Failed to fetch rewards:", error);
    res.status(500).json({ detail: "Failed to fetch rewards" });
  }
});

rewardRoute.post("/:id/redeem", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { shippingAddress } = req.body;
  const userId = req.user.id;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    const reward = await Reward.findById(id).populate("badge");
    if (!reward) {
      return res.status(404).json({ detail: "Reward not found" });
    }

    if (user.credits < reward.cost) {
      return res
        .status(400)
        .json({ detail: "Not enough credits to redeem this item." });
    }

    if (reward.type === "title") {
      const hasTitle = user.badges.some(
        (badge) => badge.toString() === reward.badge._id.toString()
      );
      if (hasTitle) {
        return res
          .status(400)
          .json({ detail: "You have already redeemed this title." });
      }
      user.credits -= reward.cost;
      user.title = reward.name;
      user.badges.push(reward.badge._id); // Add the badge ID to the user's badges array
      await user.save();
    }

    else if (reward.type === "merchandise") {
      // In a production app, you would process the order,
      // save the shipping address, and send a confirmation email.
      // For this example, we just deduct the credits.
      user.credits -= reward.cost;
      await user.save();
    }

    res.status(200).json({ detail: `'${reward.name}' redeemed successfully!` });
  } catch (error) {
    console.error("Redemption error:", error);
    res.status(500).json({ detail: "Failed to redeem reward" });
  }
});

export default rewardRoute;
