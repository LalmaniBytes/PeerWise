import express from "express";
import { authenticateToken } from "../middleware/jwtAuth.js";
import { Response, Thread } from "../config/db.js";
import userModel from "../config/db.js";
import mongoose from "mongoose";

const leaderboardRouter = express.Router();

// Helper function to get leaderboard data using aggregation
const getLeaderboardData = async (metricType, limit = 100) => {
  let pipeline = [];
  const rankCalculationPipeline = [
    {
      $addFields: {
        rank: {
          $switch: {
            branches: [
              { case: { $gt: ["$metric", 5000] }, then: "Elite Master" },
              { case: { $gt: ["$metric", 2000] }, then: "Sage" },
              { case: { $gt: ["$metric", 500] }, then: "Guru" },
              { case: { $gt: ["$metric", 100] }, then: "Scholar" },
            ],
            default: "Newbies",
          },
        },
      },
    },
  ];

  if (metricType === "alltime") {
    // Pipeline for All-Time (based on user credits field)
    pipeline = [
      { $sort: { credits: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          username: 1,
          profilePicture: 1,
          metric: "$credits",
        },
      },
      ...rankCalculationPipeline,
    ];
  } else if (metricType === "upvoted") {
    // Pipeline for Most Upvoted (aggregating from responses)
    pipeline = [
      {
        $group: {
          _id: "$author",
          metric: { $sum: "$thumbs_up" },
        },
      },
      { $sort: { metric: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },
      {
        $project: {
          _id: "$authorDetails._id",
          username: "$authorDetails.username",
          profilePicture: "$authorDetails.profilePicture",
          metric: 1,
        },
      },
      ...rankCalculationPipeline,
    ];
  } else if (metricType === "bestanswer") {
    // Pipeline for Best Answer (aggregating from responses)
    pipeline = [
      { $match: { isBestAnswer: true } },
      {
        $group: {
          _id: "$author",
          metric: { $sum: 1 },
        },
      },
      { $sort: { metric: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },
      {
        $project: {
          _id: "$authorDetails._id",
          username: "$authorDetails.username",
          profilePicture: "$authorDetails.profilePicture",
          metric: 1,
        },
      },
      ...rankCalculationPipeline,
    ];
  } else if (metricType === "weekly") {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Pipeline for Weekly (aggregating from responses in the last 7 days)
    pipeline = [
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: "$author",
          upvotes: { $sum: "$thumbs_up" },
          downvotes: { $sum: "$thumbs_down" },
          bestAnswers: { $sum: { $cond: ["$isBestAnswer", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          metric: {
            $sum: [
              { $multiply: ["$upvotes", 5] },
              { $multiply: ["$downvotes", -2] },
              { $multiply: ["$bestAnswers", 25] },
            ],
          },
        },
      },
      { $sort: { metric: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },
      {
        $project: {
          _id: "$authorDetails._id",
          username: "$authorDetails.username",
          profilePicture: "$authorDetails.profilePicture",
          metric: 1,
        },
      },
      ...rankCalculationPipeline,
    ];
  } else {
    return [];
  }

  if (metricType === "alltime") {
    return await userModel.aggregate(pipeline).exec();
  } else {
    return await Response.aggregate(pipeline).exec();
  }
};

// GET /api/leaderboards/previews
leaderboardRouter.get("/previews", authenticateToken, async (req, res) => {
  try {
    const alltime = await getLeaderboardData("alltime", 3);
    const weekly = await getLeaderboardData("weekly", 3);
    const upvoted = await getLeaderboardData("upvoted", 3);
    const bestanswer = await getLeaderboardData("bestanswer", 3);

    res.json({ alltime, weekly, upvoted, bestanswer });
  } catch (error) {
    console.error("Error fetching leaderboard previews:", error);
    res.status(500).json({ detail: "Failed to fetch leaderboard previews" });
  }
});

// GET /api/leaderboards/:type
leaderboardRouter.get("/:type", authenticateToken, async (req, res) => {
  const { type } = req.params;
  try {
    const leaderboard = await getLeaderboardData(type);
    res.json(leaderboard);
  } catch (error) {
    console.error(`Error fetching ${type} leaderboard:`, error);
    res.status(500).json({ detail: `Failed to fetch ${type} leaderboard` });
  }
});

// GET /api/leaderboards/user/rankings
leaderboardRouter.get("/user/rankings", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const alltime = await getLeaderboardData("alltime");
    const weekly = await getLeaderboardData("weekly");
    const upvoted = await getLeaderboardData("upvoted");
    const bestanswer = await getLeaderboardData("bestanswer");

    const findUserRanking = (list) => {
      const userIndex = list.findIndex(
        (u) => u._id.toString() === userId.toString()
      );
      if (userIndex === -1) {
        return { rank: "N/A", metric: 0 };
      }
      return {
        rank: userIndex + 1,
        metric: list[userIndex].metric,
      };
    };

    const userRankings = {
      alltime: findUserRanking(alltime),
      weekly: findUserRanking(weekly),
      upvoted: findUserRanking(upvoted),
      bestanswer: findUserRanking(bestanswer),
    };

    res.json(userRankings);
  } catch (error) {
    console.error("Error fetching user rankings:", error);
    res.status(500).json({ detail: "Failed to fetch user rankings" });
  }
});

export default leaderboardRouter; 