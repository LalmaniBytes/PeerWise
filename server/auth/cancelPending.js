import express from "express";
import { PendingUser } from "../config/db.js"; // if you moved pending to DB

const cancelPending = express.Router();

cancelPending.delete("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // If using MongoDB model
    const result = await PendingUser.findOneAndDelete({ email });

    if (!result) {
      return res.status(404).json({ message: "No pending registration found" });
    }

    res.json({ message: "Pending registration canceled successfully" });
  } catch (err) {
    console.error("Cancel pending error:", err);
    res.status(500).json({ message: "Server error while canceling registration" });
  }
});

export default cancelPending;
