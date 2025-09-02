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

const app = express();
env.config();

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
    crossOriginResourcePolicy: { policy: "cross-origin" }, // 👈 allow cross-origin resources
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

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "https://peerwise-1.onrender.com");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", "true");
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }
//   next();
// });
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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://peerwise-1.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io", // 👈 force it to mount here
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // When frontend joins a specific thread room
  socket.on("join-thread", (threadId) => {
    socket.join(threadId);
    console.log(`✅ User ${socket.id} joined thread ${threadId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Export io so routes can use it
export { io };

// --- Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
