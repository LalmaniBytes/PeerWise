import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Navigation } from "./Navigation";
import { CreateThreadDialog } from "./CreateThreadDialog";
import { ThreadList } from "./ThreadList";
import RewardsPage from "../pages/RewardsPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserCard from "./UserCard";
import { useRef } from "react";

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const socket = useSocket(null);
  const searchInputRef = useRef(null);

  const searchTerm = searchParams.get("q");
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (
        event.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault();
        searchInputRef.current?.focus(); // Focus the search bar
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/threads`;
      if (searchTerm) {
        url = `${API_URL}/threads/search?q=${searchTerm}`;
      }

      const response = await axios.get(url, { withCredentials: true });

      if (searchTerm) {
        setThreads(response.data.threads);
        setUsers(response.data.users);
      } else {
        setThreads(response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, searchTerm]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new-thread", (newThread) => {
      if (!searchTerm) {
        setThreads((prev) => [newThread, ...prev]);
      }
    });
    return () => {
      socket.off("new-thread");
    };
  }, [socket, searchTerm]);

  return (
    <div className="min-h-screen bg-black">
      <Navigation searchInputRef={searchInputRef} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="problems" className="space-y-8">
          <TabsList className="bg-black/50 border border-cyan-500/20">
            <TabsTrigger
              value="problems"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Problems
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
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
              <CreateThreadDialog onThreadCreated={fetchData} />
            </div>
            {loading ? (
              <p className="text-white text-center">Loading...</p>
            ) : (
              // Start of the streamlined rendering logic
              <div className="space-y-6">
                {users.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                      Users Found
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {users.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))}
                    </div>
                  </div>
                )}
                {threads.length > 0 && (
                  <div>
                    {users.length > 0 && (
                      <h2 className="text-xl font-bold text-white mb-4">
                        Threads Found
                      </h2>
                    )}
                    <ThreadList threads={threads} />
                  </div>
                )}
                {users.length === 0 && threads.length === 0 && searchTerm && (
                  <p className="text-white text-center">
                    No results found for "{searchTerm}".
                  </p>
                )}
                {!searchTerm && threads.length === 0 && !loading && (
                  <p className="text-white text-center">
                    No threads available. Be the first to ask!
                  </p>
                )}
              </div>
              // End of the streamlined rendering logic
            )}
          </TabsContent>
          <TabsContent value="rewards">
            <RewardsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export { Dashboard };
