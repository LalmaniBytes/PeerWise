import express, { response } from "express";
import mongoose from "mongoose";
import { authenticateToken } from "../middleware/jwtAuth.js"; // your auth middleware path
import User from "./db.js"; // user model path
import { Response, Thread } from "./db.js";
import { io } from "../server.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const threadRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

const upload = multer({ storage });
// GET /threads — get all threads
threadRouter.get("/", async (req, res) => {
  try {
    const threads = await Thread.find()
      .populate("author", "username")
      .sort({ createdAt: -1 }) // ✅ use correct field name
      .lean();

    const threadsWithExtras = await Promise.all(
      threads.map(async (t) => {
        const responseCount = await Response.countDocuments({ thread: t._id });
        return {
          _id: t._id, // ✅ include _id explicitly
          title: t.title,
          description: t.description,
          createdAt: t.createdAt,
          author_username: t.author ? t.author.username : "Unknown",
          response_count: responseCount,
        };
      })
    );

    res.json(threadsWithExtras);
  } catch (err) {
    console.error("Error fetching threads:", err);
    res.status(500).json({ detail: "Failed to fetch threads" });
  }
});

// GET /threads/:id
threadRouter.get("/:id", async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate("author", "username")
      .lean();
    console.log("Threads : ", thread);
    if (!thread) return res.status(404).json({ detail: "Thread not found" });

    const responseCount = await Response.countDocuments({ thread: thread._id });
    res.json({
      ...thread,
      author_username: thread.author?.username,
      response_count: responseCount,
    });
  } catch (err) {
    res.status(500).json({ detail: "Failed to fetch thread" });
  }
});

// POST /threads
// POST /threads
threadRouter.post("/", authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  try {
    const newThread = await Thread.create({
      title,
      description,
      author: req.user.id, // ✅ using req.user.id instead of _id mismatch
    });
    await newThread.populate("author", "username");
    io.emit("new-thread", {
      _id: newThread._id,
      title: newThread.title,
      description: newThread.description,
      author_username: newThread.author.username,
      response_count: 0,
      created_at: newThread.created_at,
    });

    res.status(201).json({
      _id: newThread._id, // ✅ explicitly return id
      title: newThread.title,
      description: newThread.description,
      author_username: newThread.author.username,
      response_count: 0,
      created_at: newThread.created_at,
    });
  } catch (err) {
    console.error("Thread creation error:", err);
    res.status(500).json({ detail: "Failed to create thread" });
  }
});

// GET /threads/:id/responses
threadRouter.get("/:id/responses", async (req, res) => {
  try {
    // console.log("From params:", req.params.id);

    if (!req.params.id || req.params.id === "undefined") {
      // console.log("id: ", req.params.id);
      return res
        .status(400)
        .json({ detail: "Invalid or missing thread ID in request." });
    }
    // console.log("Fetching responses for thread ID:", req.params.id);

    const responses = await Response.find({ thread: req.params.id })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .lean();

    const processed = responses.map((r, index) => {
      if (!r.author) {
        console.warn(`Missing author on response at index ${index}`, r._id);
      }

      return {
        ...r,
        author_username: r.author ? r.author.username : "Unknown",
      };
    });

    res.json(processed);
  } catch (err) {
    console.error("Error fetching responses:", err);
    res.status(500).json({ detail: "Failed to fetch responses" });
  }
});

// POST /threads/:id/responses
threadRouter.post(
  "/:id/responses",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const { content } = req.body;
    const { vote_type } = req.body; // Expected: "up" or "down"
    const userId = req.user.id;
    const { id } = req.params;
    const voteType = vote_type;
    // const voteType = vote_type;
    // console.log("Vote route hit");
    // console.log("Params:", req.params);
    // console.log("Body:", req.body);
    // console.log("User:", req.user);
    try {
      const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const newResponse = await Response.create({
        content,
        author: req.user.id,
        thread: req.params.id,
        file_url: fileUrl,
      });
      await newResponse.populate("author", "username");

      // Find the thread to get the author's ID
      const thread = await Thread.findById(id)
      if (!thread) {
        return res.status(404).json({ detail: "Thread not found" });
      }

      // ✅ New notification logic
      // Check if the responder is not the thread author
      const isThreadAuthor = thread.author.toString() === userId.toString();
      if (!isThreadAuthor) {
        const threadAuthorSocketId = userSockets[thread.author.toString()];
        if (threadAuthorSocketId) {
          console.log("User checked your threads !")
          io.to(threadAuthorSocketId).emit("new-notification", {
            message: `Someone responded to your problem: "${thread.title}"`,
            link: `/`, // You can adjust this link if you have a specific thread page
          });
        }
      }

      io.to(req.params.id).emit("new-response", {
        _id: newResponse._id,
        content: newResponse.content,
        author_username: newResponse.author.username,
        createdAt: newResponse.createdAt,
        file_url: newResponse.file_url,
        thumbs_up: newResponse.thumbs_up,
        thumbs_down: newResponse.thumbs_down,
        voters: newResponse.voters,
        thread: req.params.id,
      });
      res.status(201).json({
        ...newResponse.toObject(),
        author_username: newResponse.author.username,
        createdAt: newResponse.createdAt,
      });
    } catch (err) {
      res.status(500).json({ detail: "Failed to post response" });
    }
  }
);

// app.get("/uploads/:filename", (req, res) => {
//   const filePath = path.join(process.cwd(), "uploads", req.params.filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ detail: "File not found" });
//   }

//   // Serve file inline (so browser can preview it) or as attachment
//   res.sendFile(filePath, { headers: { "Content-Disposition": "inline" } });
// });

// POST /responses/:id/vote
// POST /responses/:id/vote
// POST /responses/:id/vote
threadRouter.post(
  "/responses/:id/vote",
  authenticateToken,
  async (req, res) => {
    const { vote_type } = req.body;
    const userId = req.user.id;
    const { id } = req.params;
    const voteType = vote_type;
    // const voteType = vote_type;
    console.log("Vote route hit");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("User:", req.user);
    console.log("userId : ", userId);

    try {
      console.log("This is working !");
      if (!["up", "down"].includes(vote_type)) {
        return res.status(400).json({ detail: "Invalid vote type" });
      }

      const response = await Response.findById(id);
      console.log("Response : ", response);
      if (!response)
        return res.status(404).json({ detail: "Response not found" });

      // Check if user already voted
      const existingVoteIndex = response.voters.findIndex(
        (v) => v.user?.toString() === userId
      );
      console.log("Exsting user index : ", existingVoteIndex);
      const selfVoter = userId === response.author.toString();
      if (selfVoter) {
        return res
          .status(403)
          .json({ detail: "You cannot vote on your own response." });
      }

      if (existingVoteIndex !== -1) {
        const existingVote = response.voters[existingVoteIndex];

        if (existingVote.voteType === vote_type) {
          // Same vote clicked → undo
          if (vote_type === "up") {
            response.thumbs_up -= 1;
          }
          if (vote_type === "down") response.thumbs_down -= 1;

          response.voters.splice(existingVoteIndex, 1); // remove vote
        } else {
          // Switch vote
          if (existingVote.voteType === "up") response.thumbs_up -= 1;
          if (existingVote.voteType === "down") response.thumbs_down -= 1;

          if (voteType === "up") response.thumbs_up += 1;
          if (voteType === "down") response.thumbs_down += 1;

          response.voters[existingVoteIndex].voteType = vote_type; // update vote
        }
      } else {
        // First-time vote
        if (voteType === "up") response.thumbs_up += 1;
        if (voteType === "down") response.thumbs_down += 1;
        console.log("Voters before save:", response.voters);
        response.voters.push({ user: userId, voteType });
      }
      // console.log("Response : ", response)

      await response.save();
      io.to(response._id.toString()).emit("credits-updated", {
        credits: response.credits,
        rank: response.rank,
      });
      io.to(response.thread.toString()).emit("update-votes", {
        _id: response._id,
        thumbs_up: response.thumbs_up,
        thumbs_down: response.thumbs_down,
        voters: response.voters,
      });
      res.json({
        _id: response._id,
        thumbs_up: response.thumbs_up,
        thumbs_down: response.thumbs_down,
        voters: response.voters,
      });
    } catch (err) {
      console.error("Vote error:", err);
      res.status(500).json({ detail: "Failed to vote" });
    }
  }
);

export default threadRouter;
