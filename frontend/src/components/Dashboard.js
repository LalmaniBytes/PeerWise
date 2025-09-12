import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Navigation } from "./Navigation";
import { CreateThreadDialog } from "./CreateThreadDialog";
import { ThreadList } from "./ThreadList";
import RewardsPage from "../pages/RewardsPage"; // ✅ Import the RewardsPage component
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const { user } = useAuth(); // Removed the rewards state
  const socket = useSocket(null);

  useEffect(() => {
    if (user) {
      fetchThreads();
      // ✅ Removed fetchRewards() here, as RewardsPage will handle its own data
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
      const response = await axios.get(`${API_URL}/threads`, { withCredentials: true });
      setThreads(response.data);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    }
  };

  const handleThreadClick = (thread) => {
    navigate(`/threads/${thread._id}`);
  };

  // ✅ Removed handleRewardRedeem and claimRank functions, they now live inside RewardsPage

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
            {/* ✅ This button now just switches the tab */}
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
          {/* ✅ New TabsContent section for rewards */}
          <TabsContent value="rewards">
            <RewardsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export { Dashboard };