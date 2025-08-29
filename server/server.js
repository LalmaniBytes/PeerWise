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

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://peerwise-1.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

env.config();
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://peerwise-1.onrender.com");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Listning to the route !");
});

app.use("/signup", signup);

app.use("/login", login);
app.use("/profile", profile);
app.use("/threads", threads);
app.use("/", router);
app.use("/rewards", rewardRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
