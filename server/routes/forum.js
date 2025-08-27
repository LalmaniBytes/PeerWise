// routes/forum.js
import express from "express";
import userModel from "../config/db.js";
import { Thread, Response, Reward } from "../config/db.js";
import { authenticateToken } from "../middleware/jwtAuth.js";

const router = express.Router();

/**
 * GET /threads/:id/responses
 */
router.get("/threads/:id/responses", authenticateToken, async (req, res) => {
  try {
    const responses = await Response.find({ thread: req.params.id }).populate(
      "author",
      "username email"
    );
    res.json(responses);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching responses", error: err.message });
  }
});

/**
 * POST /threads/:id/responses
 */
// POST /threads/:id/responses
router.post("/threads/:id/responses", authenticateToken, async (req, res) => {
  try {
    const response = new Response({
      content: req.body.content, // ✅ match schema
      thread: req.params.id,
      author: req.user.id,
    });
    await response.save();
    res.json({ message: "Response added successfully", response });
  } catch (err) {
    console.error("Response error:", err);
    res
      .status(500)
      .json({ message: "Error adding response", error: err.message });
  }
});

// POST /responses/:id/vote
router.post("/responses/:id/vote", authenticateToken, async (req, res) => {
  try {
    const { vote_type } = req.body;
    const response = await Response.findById(req.params.id);

    if (!response)
      return res.status(404).json({ message: "Response not found" });

    if (!Array.isArray(response.voters)) response.voters = [];

    // prevent self-vote
    if (response.author.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot vote on your own response" });
    }

    // prevent duplicate vote
    if (response.voters.some((voterId) => voterId.toString() === req.user.id)) {
      return res.status(400).json({ message: "Already voted!" });
    }

    if (vote_type === "up") {
      response.thumbs_up++;
      const user = await userModel.findById(response.author);
      if (user) {
        user.credits = (user.credits || 0) + 10;
        await user.save();
      }
    } else if (vote_type === "down") {
      response.thumbs_down++;
    } else {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    response.voters.push(req.user.id);
    await response.save();

    res.json({
      message: "Vote recorded",
      thumbs_up: response.thumbs_up,
      thumbs_down: response.thumbs_down,
    });
  } catch (err) {
    console.error("🔥 Vote error:", err);
    res.status(500).json({ message: "Error voting", error: err.message });
  }
}); 

/**
 * GET /rewards
 */
router.get("/rewards", authenticateToken, async (req, res) => {
  try {
    const rewards = await Reward.find();
    res.json(rewards);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching rewards", error: err.message });
  }
});

/**
 * POST /rewards/:id/redeem
 */
router.post("/rewards/:id/redeem", authenticateToken, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: "Reward not found" });

    const user = await userModel.findById(req.user.id);
    if (user.credits < reward.cost) {
      return res.status(400).json({ message: "Not enough credits!" });
    }

    user.credits -= reward.cost;
    await user.save();

    res.json({
      message: "Reward redeemed successfully!",
      credits: user.credits,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error redeeming reward", error: err.message });
  }
});

export default router;
