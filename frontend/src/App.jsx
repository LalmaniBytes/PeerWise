import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { ThumbsUp, ThumbsDown, Plus, User, Trophy, Sparkles, Zap, Play, Crown, Medal, Star, Gem, Award } from "lucide-react";
import { io } from "socket.io-client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import jwt_decode from "jwt-decode";


function AppWrapper() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
}

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = process.env.REACT_APP_API_URL;
// const socket = io(API_URL, {
//   withCredentials: true,
//   transports: ["websocket", "polling"], // allow fallback
//   path: "/socket.io", // must match backend
// });
const useSocket = (threadId) => {
  // ✅ Create global socket connection once
  const socket = useMemo(() => {
    if (!process.env.REACT_APP_SOCKET_URL) return null;

    return io(process.env.REACT_APP_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      path: "/socket.io",
    });
  }, []);

  // ✅ Join/leave specific thread room
  useEffect(() => {
    if (!socket || !threadId) return;

    socket.emit("join-thread", threadId);

    return () => {
      socket.emit("leave-thread", threadId); // optional, backend can ignore if not implemented
    };
  }, [socket, threadId]);

  return socket;
};

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [pendingEmail, setPendingEmail] = useState("");
  const [needsGoogleVerify, setNeedsGoogleVerify] = useState(false);


  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`, {
        withCredentials: true,
      });
      setUser(response.data);
      if (!response.data.isVerified) {
        setPendingEmail(response.data.email);
        setNeedsGoogleVerify(true);
      } else {
        setNeedsGoogleVerify(false);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {

      const response = await axios.post(
        `${API_URL}/login`,
        { email, password },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("API_URL 👉", process.env.REACT_APP_API_URL);
      const { token: authToken, user: userData } = response.data;
      if (!userData.isVerified) {
        setPendingEmail(email);      // store email for Google verification
        setNeedsGoogleVerify(true);
        return false; // prevent full login
      }
      setToken(authToken);
      setUser(userData);
      localStorage.setItem("token", authToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      toast.success("Welcome back to PeerWise! 🎉");
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Login failed"
      );
      return false;
    }
  };

  const register = async (username, email, password) => {
    console.log("SIgnup frontend")
    try {
      const response = await axios.post(`${API_URL}/signup`,
        { username, email, password },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });
      console.log("Response grabbed")
      const newUser = response.data.user;
      setPendingEmail(newUser.email);  // store email for Google verification
      setNeedsGoogleVerify(true);      // show verification UI
      setUser(newUser);
      toast.success("Welcome to PeerWise! 🎉");
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Registration failed"
      );
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPendingEmail("");
    setNeedsGoogleVerify(false);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user, setUser, login, register, logout, fetchProfile, needsGoogleVerify,
        setNeedsGoogleVerify,
        pendingEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Component
const Auth = () => {


  // const [needsGoogleVerify, setNeedsGoogleVerify] = useState(false);

  const { login, register, needsGoogleVerify, setNeedsGoogleVerify, pendingEmail, setUser, logout } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const response = await axios.post(`${API_URL}/verify-google`, { token, email: pendingEmail });
      const { token: authToken, user: verifiedUser } = response.data;

      localStorage.setItem("token", authToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      setUser(verifiedUser); // ✅ only now set user
      setNeedsGoogleVerify(false);
      toast.success("Google verification successful!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google login failed");
    }
  };




  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(formData.username, formData.email, formData.password);
    }
  };

  if (needsGoogleVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="p-8 bg-black/80 text-center border-cyan-500/30 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Verify Your Gmail</h2>
          <p className="mb-6">
            Verifying Gmail for <span className="font-semibold">{pendingEmail}</span>
          </p>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google login failed")}
          />
          <Button
            onClick={async() => {
              try {
                await axios.delete(`${API_URL}/cancel-pending/${pendingEmail}`);
                toast.info("Registration canceled.");
              } catch (err) {
                console.error(err);
                toast.error("Failed to cancel registration.");
              }
              logout(); // clear logged in user + pending state
              setFormData({ email: "", password: "", username: "" });

            }}
            variant="outline"
            className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 mt-4"
          >
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent)]"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
          </div>
        ))}
      </div>

      <Card className="w-full max-w-md bg-black/80 border-cyan-500/30 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            PeerWise
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin ? "Welcome back to the future of problem solving" : "Join the revolution of peer learning"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                name="username"
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                required
              />
            )}

            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <Input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-black/90 border-b border-cyan-500/20 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-green-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              PeerWise
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-semibold" data-testid="user-credits">{user?.credits || 0}</span>
            </div>

            <div className="flex items-center space-x-2 text-white">
              <User className="w-4 h-4" />
              <span>{user?.username}</span>
            </div>

            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Thread Creation Dialog
const CreateThreadDialog = ({ onThreadCreated }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/threads`, formData);
      toast.success("Problem posted! The community will help you soon! 🚀");
      setFormData({ title: '', description: '' });
      setOpen(false);
      onThreadCreated();
    } catch (error) {
      toast.error("Failed to create thread");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Ask for Help
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-black/95 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            What problem can we help you solve?
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Describe your problem clearly and the community will provide video solutions!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Problem title..."
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500"
            required
          />

          <Textarea
            placeholder="Describe your problem in detail..."
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 min-h-[120px]"
            required
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
          >
            Post Problem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Dashboard
const Dashboard = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState('');
  const [rewards, setRewards] = useState([]);
  const { user, fetchProfile } = useAuth();
  const socket = useSocket(selectedThread?._id);

  useEffect(() => {
    if (!socket) return;

    socket.on("new-response", (response) => {
      // no need to check response.thread if room is joined
      setResponses((prev) => [response, ...prev]);
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t._id === response.thread
            ? { ...t, response_count: (t.response_count || 0) + 1 }
            : t
        )
      );
    });

    socket.on("update-votes", (voteData) => {
      setResponses((prev) =>
        prev.map((r) => (r._id === voteData._id ? { ...r, ...voteData } : r))
      );
    });
    socket.on("new-thread", (thread) => {
      setThreads((prev) => [thread, ...prev]); // prepend new thread to list
    });

    return () => {
      socket.off("new-response");
      socket.off("update-votes");
      socket.off("new-thread");
    };
  }, [socket]);


  useEffect(() => {
    if (user) {
      fetchThreads();
      fetchRewards();
    }
  }, [user]);

  const fetchThreads = async () => {
    try {
      const response = await axios.get(`${API_URL}/threads`);
      setThreads(response.data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const fetchResponses = async (threadId) => {
    console.log("ThreadId : ", threadId)
    try {
      const response = await axios.get(`${API_URL}/threads/${threadId}/responses`);
      console.log(response.data)
      setResponses(response.data);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await axios.get(`${API_URL}/rewards`);
      console.log(response.data)
      setRewards(response.data);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  };

  const handleThreadClick = (thread) => {
    setSelectedThread(thread);
    fetchResponses(thread._id);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    try {
      await axios.post(`${API_URL}/threads/${selectedThread._id}/responses`, {
        content: newResponse
      });
      toast.success("Response posted! 💡");
      setNewResponse('');
      setSelectedThread((prev) =>
        prev ? { ...prev, response_count: prev.response_count + 1 } : prev
      );
      // fetchResponses(selectedThread._id);
    } catch (error) {
      toast.error("Failed to post response");
    }
  };

  const handleVote = async (responseId, voteType) => {
    console.log("Your are on the correct path !")
    try {
      await axios.post(`${API_URL}/threads/responses/${responseId}/vote`, {
        vote_type: voteType
      });
      toast.success(voteType === 'up' ? "Thanks for the thumbs up! 👍" : "Thanks for the feedback! 👎");

      // Refresh responses to get updated vote counts
      if (selectedThread) {
        await fetchResponses(selectedThread._id);
      }

      // Refresh user profile to get updated credits
      await fetchProfile();
    } catch (error) {
      console.error('Vote error:', error);
      toast.error(error.response?.data?.detail || "Failed to vote");
    }
  };

  const handleRewardRedeem = async (rewardId) => {
    try {
      const response = await axios.post(`${API_URL}/rewards/${rewardId}/redeem`);
      toast.success("Reward redeemed successfully! 🎉");

      // Refresh user profile to update credits
      await fetchProfile();
    } catch (error) {
      console.error('Reward redemption error:', error);
      const errorMessage = error.response?.data?.detail || "Failed to redeem reward";
      toast.error(errorMessage);
    }
  };

  const isYouTubeUrl = (url) => {
    return /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/i.test(url);
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (selectedThread) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />


        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            onClick={() => setSelectedThread(null)}
            variant="outline"
            className="mb-6 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            ← Back to Problems
          </Button>

          {/* Thread Details */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-white">{selectedThread.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>by {selectedThread.author_username}</span>
                <span>{new Date(selectedThread.created_at).toLocaleDateString()}</span>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  {selectedThread.response_count} responses
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{selectedThread.description}</p>
            </CardContent>
          </Card>

          {/* Response Form */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
                Share Your Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResponseSubmit} className="space-y-4">
                <Textarea
                  name="content"
                  placeholder="Share your solution! YouTube links are especially appreciated... 🎥"
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 min-h-[100px]"
                  required
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
                >
                  Post Solution
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Responses */}
          <div className="space-y-4">
            {responses.map((response) => (
              <Card key={response._id} className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full flex items-center justify-center">
                        <span className="text-black font-semibold text-sm">
                          {response.author_username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{response.author_username}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(response.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {response.is_youtube_link && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <Play className="w-3 h-3 mr-1" />
                        YouTube
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-300 mb-3">{response.content}</p>

                    {response.youtube_url && (
                      <div className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <Play className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-medium">Video Solution</span>
                        </div>
                        <a
                          href={response.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline break-all"
                        >
                          {response.youtube_url}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Check if user already upvoted
                        const hasUpvoted = response.voters?.some(
                          v => v.user?.toString() === user._id && v.voteType === 'up'
                        );

                        // If already upvoted, send "undo", else "up"
                        handleVote(response._id, 'up');
                      }}
                      size="sm"
                      variant="outline"
                      className={`border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all duration-200 ${response.voters?.some(v => v.user === user._id && v.voteType === 'up') ? 'bg-green-500/20' : ''
                        }`}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {response.thumbs_up}
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Check if user already downvoted
                        const hasDownvoted = response.voters?.some(
                          v => v.user?.toString() === user._id && v.voteType === 'down'
                        );

                        // If already downvoted, send "undo", else "down"
                        handleVote(response._id, 'down');
                      }}
                      size="sm"
                      variant="outline"
                      className={`border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200 ${response.voters?.some(v => v.user?.toString() === user._id && v.voteType === 'down') ? 'bg-red-500/20' : ''
                        }`}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      {response.thumbs_down}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="problems" className="space-y-8">
          <TabsList className="bg-black/50 border border-cyan-500/20">
            <TabsTrigger
              value="problems"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              data-testid="problems-tab"
            >
              Problems
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              data-testid="rewards-tab"
            >
              Rewards
            </TabsTrigger>

          </TabsList>

          <TabsContent value="problems" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
                  Community Problems
                </h1>
                <p className="text-gray-400">Help solve problems and earn credits for your expertise!</p>
              </div>
              <CreateThreadDialog onThreadCreated={fetchThreads} />
            </div>

            <div className="grid gap-6">
              {threads.map((thread) => (
                <Card
                  key={thread._id}
                  className="bg-black/50 border-cyan-500/20 backdrop-blur-xl hover:border-cyan-500/40 transition-all cursor-pointer"
                  onClick={() => handleThreadClick(thread)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-white hover:text-cyan-400 transition-colors">
                        {thread.title}
                      </CardTitle>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {thread.response_count} responses
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>by {thread.author_username}</span>
                      <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 line-clamp-2">{thread.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
                Rewards Store
              </h1>
              <p className="text-gray-400">Spend your hard-earned credits on awesome rewards!</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card key={reward._id} className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      {reward.name}
                      <Badge className="bg-gradient-to-r from-cyan-500 to-green-500 text-black">
                        {reward.cost} credits
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{reward.description}</p>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRewardRedeem(reward._id);
                      }}
                      disabled={user?.credits < reward.cost}
                      className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      data-testid={`redeem-${reward._id}`}
                    >
                      {user?.credits < reward.cost ? 'Not enough credits' : 'Redeem'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, needsGoogleVerify } = useAuth();
  if (!user) return <Auth />;
  if (needsGoogleVerify) return <Auth />; // enforce verification
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
        <Toaster
          theme="dark"
          className="bg-black border-cyan-500/30"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'white',
            },
          }}
        />
      </AuthProvider>
    </div>
  );
}

export default App;