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
app.options("*", cors(corsOptions)); // enable preflight for all routes

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

app.get("/", (req, res) => {
  res.send("Listning to the route !");
});

app.get("/uploads", (req, res) => {
  console.log("efgf");
  res.send("uploads found");
});

app.get("/uploads/:filename", (req, res) => {
  const decodedFilename = decodeURIComponent(req.params.filename);
  const filePath = path.join(process.cwd(), "uploads", decodedFilename);
  console.log("Checking uploads file");
  console.log("Looking for file:", filePath);

  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return res.status(404).json({ detail: "File not found" });
  }

  // ✅ Set CORS headers explicitly for the file response
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Serve file inline
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://peerwise-1.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

// ✅ New: Store a mapping of user IDs to their socket IDs
const userSockets = {};

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // ✅ NEW: Listen for 'register-user' event from frontend
  socket.on("register-user", (userId) => {
    userSockets[userId] = socket.id;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  // When frontend joins a specific thread room
  socket.on("join-thread", (threadId) => {
    socket.join(threadId);
    console.log(`✅ User ${socket.id} joined thread ${threadId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    // ✅ NEW: Clean up the userSockets map on disconnect
    for (const userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        console.log(`User ${userId} deregistered on disconnect.`);
        break;
      }
    }
  });
});

// ✅ Export io and the new userSockets map
export { io, userSockets };

// --- Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
