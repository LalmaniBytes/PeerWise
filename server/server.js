import express from "express";
import env from "dotenv";
import cors from "cors";
import helmet from "helmet";
import signup from "./auth/signup.js";
import login from "./auth/login.js";
import profile from "./auth/profile.js";
import threads from "./config/threads.js";
import router from "./routes/forum.js";
import rewardRouter from "./config/rewards.js";
import http from "http";
import { Server } from "socket.io";
import verifyGoogle from "./auth/verify-google.js";
import signin from "./auth/signin.js";
import cancelPending from "./auth/cancelPending.js";
import path from "path";
import fs from "fs";
import userModel from "./config/db.js";
import webpush from "web-push";
import { authenticateToken } from "./middleware/jwtAuth.js";
import leaderboardRouter from "./config/leaderboards.js";
import { fileURLToPath } from "url";

const app = express();
env.config();

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const corsOptions = {
  origin: ["http://localhost:3000", "https://peerwise-1.onrender.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "http://localhost:3000",
          "https://peerwise-1.onrender.com",
          "data:",
        ],
      },
    },
  })
);

app.use(express.json());

app.get("/test-cors", (req, res) => {
  res.json({ msg: "CORS is working 🎉" });
});

app.get("/uploads", (req, res) => {
  res.send("uploads found");
});

app.get("/uploads/:filename", (req, res) => {
  const decodedFilename = decodeURIComponent(req.params.filename);
  const filePath = path.join(process.cwd(), "uploads", decodedFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ detail: "File not found" });
  }

  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  res.sendFile(filePath, { headers: { "Content-Disposition": "inline" } });
});

app.use("/signup", signup);
app.use("/login", cors(corsOptions), login);
app.use("/profile", profile);
app.use("/threads", threads);
app.use("/", router);
app.use("/rewards", rewardRouter);
app.use("/verify-google", verifyGoogle);
app.use("/signin", signin);
app.use("/cancel-pending", cancelPending);
app.use("/leaderboards", leaderboardRouter);
app.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.pushSubscription = req.body;
    await user.save();
    res.status(201).json({ message: "Push subscription saved." });
  } catch (err) {
    console.error("Error saving subscription:", err);
    res.status(500).send("Failed to save subscription.");
  }
});

// IMPORTANT: Define __dirname and the static/catch-all routes here
// This must be AFTER all API routes but BEFORE the server creation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join( ".." ,  "frontend", "build")));

app.get("/*", (req, res) => {
  res.sendFile(path.join( ".." ,  "frontend", "build", "index.html"));
});

// Now, create the server and Socket.IO instance
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://peerwise-1.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

const userSockets = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("register-user", (userId) => {
    userSockets[userId] = socket.id;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("join-thread", (threadId) => {
    socket.join(threadId);
    console.log(`✅ User ${socket.id} joined thread ${threadId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    for (const userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        console.log(`User ${userId} deregistered on disconnect.`);
        break;
      }
    }
  });
});

export { io, userSockets };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
