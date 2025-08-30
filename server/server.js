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

app.use(helmet());
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

app.use("/signup", signup);

app.use("/login", cors(corsOptions), login);
app.use("/profile", profile);
app.use("/threads", threads);
app.use("/", router);
app.use("/rewards", rewardRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://peerwise-1.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
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
