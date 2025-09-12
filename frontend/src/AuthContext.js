import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { subscribeUserToPush } from "./PushNotification";

const socket = io(process.env.REACT_APP_SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
  path: "/socket.io",
});

const API_URL = process.env.REACT_APP_API_URL;
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [pendingEmail, setPendingEmail] = useState("");
  const [needsGoogleVerify, setNeedsGoogleVerify] = useState(false);

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("register-user", user._id);
      subscribeUserToPush();
      socket.on("credits-updated", ({ credits, rank }) => {
        setUser((prev) => prev ? { ...prev, credits, rank } : prev);
      });
      socket.on("new-notification", ({ message, link }) => {
        toast.info(message, {
          action: {
            label: "View",
            onClick: () => {
              window.location.href = link;
            },
          },
        });
      });
      return () => {
        socket.off("credits-updated");
        socket.off("new-notification");
      };
    }
  }, [socket, user?._id]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`, { withCredentials: true });
      console.log("Profile data fetched:", response.data);
      setUser({ ...response.data, rank: response.data.rank, claimedRank: response.data.claimedRank });
      if (!response.data.isVerified && response.data.justSignedUp) {
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
      const response = await axios.post(`${API_URL}/login`, { email, password }, { withCredentials: true, headers: { "Content-Type": "application/json" } });
      const { token: authToken, user: userData } = response.data;
      setToken(authToken);
      setUser(userData);
      localStorage.setItem("token", authToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      toast.success("Welcome back to PeerWise! 🎉");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Login failed");
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, { username, email, password }, { withCredentials: true, headers: { "Content-Type": "application/json" } });
      const newUser = response.data.user;
      setPendingEmail(newUser.email);
      setNeedsGoogleVerify(true);
      setUser(newUser);
      toast.success("Welcome to PeerWise! 🎉");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || "Registration failed");
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
    <AuthContext.Provider value={{ user, setUser, login, register, logout, fetchProfile, needsGoogleVerify, setNeedsGoogleVerify, pendingEmail }}>
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

export { AuthProvider, useAuth };