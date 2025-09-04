import mongoose from "mongoose";

const uri =
  "mongodb+srv://lalmanimishra1508:Lalmani1508@peerwise.6o0g4sv.mongodb.net/PeerWise?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas via Mongoose"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const responseSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },

    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    file_url: { type: String },
    thumbs_up: { type: Number, default: 0 },
    thumbs_down: { type: Number, default: 0 },
    youtube_url: { type: String, default: "" },
    voters: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        voteType: { type: String, enum: ["up", "down"] },
      },
    ],
  },
  { timestamps: true }
);

const Response = mongoose.model("Response", responseSchema);

const threadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
const Thread = mongoose.model("Thread", threadSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  credits: { type: Number, default: 0 },
  rank: { type: String ,default: "None" },
  isVerified: { type: Boolean, default: false }, // whether Gmail has been confirmed via OAuth
  verifiedAt: { type: Date }, // when Gmail was verified
  googleId: { type: String },
});
const userModel = mongoose.model("User", userSchema);

const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  cost: { type: Number, required: true }, // credits required to redeem
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Reward = mongoose.model("Reward", rewardSchema);

const pendingUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // store hashed later
    createdAt: { type: Date, default: Date.now, expires: "10m" },
    // 🔹 auto-delete after 10 minutes
  },
  { timestamps: true }
);

const PendingUser = mongoose.model("PendingUser", pendingUserSchema);

export { Thread, Response, Reward, PendingUser };
export default userModel;
