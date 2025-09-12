import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Award, Trophy, ArrowLeft, Star, ThumbsUp, Timer } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

import { useAuth } from "../AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_API_URL;

const getRankColoring = (rank) => {
  switch (rank) {
    case "Elite Master":
      return "bg-gradient-to-r from-yellow-300 to-amber-500 text-white w-fit px-2 py-0.5 rounded-md text-xs font-semibold shadow-md shadow-amber-500/50";
    case "Sage":
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-white w-fit px-2 py-0.5 rounded-md text-xs font-semibold shadow-md shadow-gray-500/50";
    case "Guru":
      return "bg-gradient-to-r from-purple-500 to-blue-500 text-white w-fit px-2 py-0.5 rounded-md text-xs font-semibold shadow-md shadow-purple-500/50";
    case "Scholar":
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white w-fit px-2 py-0.5 rounded-md text-xs font-semibold shadow-md shadow-blue-500/50";
    case "Newbie":
      return "bg-gradient-to-r from-green-500 to-lime-500 text-white w-fit px-2 py-0.5 rounded-md text-xs font-semibold shadow-md shadow-lime-500/50";
    default:
      return "";
  }
};
// Reusable component for the leaderboard cards on the main page
const LeaderboardCard = ({ title, data, metricName, link }) => {
  return (
    <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center space-x-2">
          {title === "All-Time" && <Trophy className="w-6 h-6 text-yellow-400" />}
          {title === "Weekly" && <Timer className="w-6 h-6 text-green-400" />}
          {title === "Most Upvoted" && <ThumbsUp className="w-6 h-6 text-purple-400" />}
          {title === "Best Answer" && <Star className="w-6 h-6 text-orange-400" />}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length > 0 ? (
          <TooltipProvider>
            {data.map((entry, index) => (
              <div key={entry._id} className="flex items-center space-x-3 text-white">
                <span className="text-lg font-bold w-6">{index + 1}.</span>
                <img
                  src={entry.profilePicture || "https://placehold.co/40x40/155e75/E2E8F0?text=P"}
                  alt={entry.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold">{entry.username}</div>
                    {/* ✅ Displaying the badges here */}
                    {entry.badges?.map(badge => (
                      <Tooltip key={badge._id}>
                        <TooltipTrigger asChild>
                          <img
                            src={badge.imageUrl}
                            alt={badge.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{badge.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  {/* ✅ Applying the shiny rank style */}
                  <div className={`text-sm font-bold mt-1 ${getRankColoring(entry.rank)}`}>
                    {entry.rank}
                  </div>
                </div>
                <div className="text-lg font-bold text-cyan-400">{entry.metric}</div>
              </div>
            ))}
          </TooltipProvider>
        ) : (
          <p className="text-gray-400">No data available yet.</p>
        )}
        <Link to={link}>
          <Button variant="outline" className="w-full mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            View All
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

// Reusable component for the full leaderboard table
const LeaderboardTable = () => {
  const { leaderboardType } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/leaderboards/${leaderboardType}`, {
        withCredentials: true,
      });
      setLeaderboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
      toast.error("Failed to fetch leaderboard data.");
    } finally {
      setLoading(false);
    }
  }, [leaderboardType]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  const top3 = leaderboardData.slice(0, 3);
  const restOfTheList = leaderboardData.slice(3);

  const getMetricTitle = () => {
    switch (leaderboardType) {
      case "alltime":
        return "Credits";
      case "weekly":
        return "Credits this week";
      case "upvoted":
        return "Upvotes";
      case "bestanswer":
        return "Best Answers";
      default:
        return "Score";
    }
  };

  const getLeaderboardTitle = () => {
    switch (leaderboardType) {
      case "alltime":
        return "All-Time Leaders";
      case "weekly":
        return "Weekly Standings";
      case "upvoted":
        return "Most Upvoted";
      case "bestanswer":
        return "Best Answer Champions";
      default:
        return "Leaderboard";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Button
        onClick={() => navigate("/leaderboard")}
        variant="outline"
        className="mb-6 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leaderboards
      </Button>

      <h1 className="text-4xl font-bold text-center text-white mb-8">{getLeaderboardTitle()}</h1>

      {/* Top 3 display section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TooltipProvider>
          {top3.map((entry, index) => (
            <Card key={entry._id} className="bg-black/50 border-yellow-500/30 backdrop-blur-xl text-white text-center">
              <CardContent className="flex flex-col items-center p-6">
                <div className="relative">
                  <img
                    src={entry.profilePicture || "https://placehold.co/80x80/155e75/E2E8F0?text=P"}
                    alt={entry.username}
                    className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
                  />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black font-extrabold text-2xl w-10 h-10 rounded-full flex items-center justify-center border-2 border-black">
                    {index + 1}
                  </div>
                </div>
                <h3 className="mt-4 text-2xl font-bold">{entry.username}</h3>
                {/* ✅ Applying the shiny rank style */}
                <p className={`text-lg font-bold p-1 rounded-full text-center mt-1 w-28 ${getRankColoring(entry.rank)}`}>
                  {entry.rank}
                </p>
                {/* ✅ Displaying the badges here */}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {entry.badges?.map(badge => (
                    <Tooltip key={badge._id}>
                      <TooltipTrigger asChild>
                        <img
                          src={badge.imageUrl}
                          alt={badge.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{badge.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <p className="text-3xl font-extrabold text-yellow-400 mt-2">{entry.metric}</p>
                <p className="text-sm text-gray-400">{getMetricTitle()}</p>
              </CardContent>
            </Card>
          ))}
        </TooltipProvider>
      </div>

      {/* Full leaderboard table */}
      <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-cyan-500/20">
              <thead className="bg-black/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getMetricTitle()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/20">
                {restOfTheList.map((entry, index) => (
                  <tr key={entry._id} className={user && user._id === entry._id ? "bg-cyan-500/10" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{index + 4}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <img
                          src={entry.profilePicture || "https://placehold.co/40x40/155e75/E2E8F0?text=P"}
                          alt={entry.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-white">{entry.username}</div>
                            {/* ✅ Displaying the badges here */}
                            <TooltipProvider>
                              {entry.badges?.map(badge => (
                                <Tooltip key={badge._id}>
                                  <TooltipTrigger asChild>
                                    <img
                                      src={badge.imageUrl}
                                      alt={badge.name}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{badge.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          </div>
                          {/* ✅ Applying the shiny rank style */}
                          <div className={`text-sm font-bold p-1 rounded-full text-center mt-1 w-24 ${getRankColoring(entry.rank)}`}>
                            {entry.rank}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400 font-bold">{entry.metric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


// Main component for the leaderboards landing page
function Leaderboard() {
  const navigate = useNavigate()
  const [previews, setPreviews] = useState({
    alltime: [],
    weekly: [],
    upvoted: [],
    bestanswer: [],
  });
  const [userRankings, setUserRankings] = useState({});
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchLeaderboards = useCallback(async () => {
    setLoading(true);
    try {
      const previewsResponse = await axios.get(`${API_URL}/leaderboards/previews`, {
        withCredentials: true,
      });
      setPreviews(previewsResponse.data);

      if (user) {
        const userRankingsResponse = await axios.get(`${API_URL}/leaderboards/user/rankings`, {
          withCredentials: true,
        });
        setUserRankings(userRankingsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
      toast.error("Failed to load leaderboards. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <p>Loading leaderboards...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-white mb-8">Leaderboards</h1>

      {/* User's personal ranking widget */}
      {user && (
        <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center space-x-2">
              <Award className="w-6 h-6 text-cyan-400" />
              <span>Your Standing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(userRankings).length > 0 ? (
              <TooltipProvider>
                {Object.keys(userRankings).map(type => (
                  <div key={type} className="flex items-center justify-between text-white border-b border-cyan-500/10 pb-2 last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm capitalize text-gray-400">{type}</span>
                      <span className="text-lg font-bold text-cyan-400">#{userRankings[type].rank}</span>
                    </div>
                    <div className="text-lg font-semibold">{userRankings[type].metric}</div>
                  </div>
                ))}
              </TooltipProvider>
            ) : (
              <p className="text-gray-400">Your rankings are not yet available. Participate to get on the leaderboards!</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard previews section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        <LeaderboardCard
          title="All-Time"
          data={previews.alltime}
          metricName="Credits"
          link="/leaderboard/alltime"
        />
        <LeaderboardCard
          title="Weekly"
          data={previews.weekly}
          metricName="Credits"
          link="/leaderboard/weekly"
        />
        <LeaderboardCard
          title="Most Upvoted"
          data={previews.upvoted}
          metricName="Upvotes"
          link="/leaderboard/upvoted"
        />
        <LeaderboardCard
          title="Best Answer"
          data={previews.bestanswer}
          metricName="Best Answers"
          link="/leaderboard/bestanswer"
        />
      </div>
    </div>
  );
}

export { LeaderboardCard, LeaderboardTable , Leaderboard};



