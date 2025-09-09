import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Navigation } from "./Navigation";
import { CreateThreadDialog } from "./CreateThreadDialog";
import { ThreadList } from "./ThreadList";
// Correctly import RewardsPage and other components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [rewards, setRewards] = useState([]);
  const { user, fetchProfile } = useAuth();
  const socket = useSocket(null);

  useEffect(() => {
    if (user) {
      fetchThreads();
      fetchRewards();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new-thread", (newThread) => {
      setThreads((prev) => [newThread, ...prev]);
    });
    return () => {
      socket.off("new-thread");
    };
  }, [socket]);

  const fetchThreads = async () => {
    try {
      const response = await axios.get(`${API_URL}/threads`);
      setThreads(response.data);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await axios.get(`${API_URL}/rewards`);
      setRewards(response.data);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    }
  };

  const handleThreadClick = (thread) => {
    navigate(`/threads/${thread._id}`);
  };

  const claimRank = async (rank) => {
    try {
      await axios.post(`${API_URL}/profile/claim`, { rank });
      toast.success(`You claimed ${rank} 🎉`);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to claim rank");
    }
  };

  const handleRewardRedeem = async (rewardId) => {
    try {
      await axios.post(`${API_URL}/rewards/${rewardId}/redeem`);
      toast.success("Reward redeemed successfully! 🎉");
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to redeem reward");
    }
  };

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
            {/* We'll use a link to the new rewards page now */}
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              data-testid="rewards-tab"
              onClick={() => navigate("/rewards")}
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
                <p className="text-gray-400">
                  Help solve problems and earn credits for your expertise!
                </p>
              </div>
              <CreateThreadDialog onThreadCreated={fetchThreads} />
            </div>
            <ThreadList
              threads={threads}
              handleThreadClick={handleThreadClick}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export { Dashboard };
