import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Award,
  Sparkles,
  ThumbsUp,
  Star,
  UserCheck,
  Zap,
  Clock,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BadgesSection } from "./BadgesSection"
const API_URL = process.env.REACT_APP_API_URL;

// ✅ UPDATED: The new rank goals and their thresholds
const rankGoals = {
  "Newbies": 100,
  "Scholar": 500,
  "Guru": 2000,
  "Sage": 5000,
  "Elite Master": Infinity,
};

// ✅ UPDATED: The rank colors for the new rank names
const getRankColor = (rank) => {
  switch (rank?.toLowerCase()) {
    case 'newbies': return 'text-amber-600';
    case 'scholar': return 'text-slate-300';
    case 'guru': return 'text-yellow-400';
    case 'sage': return 'text-gray-400';
    case 'elite master': return 'text-cyan-400';
    default: return 'text-white';
  }
};

const getProgressBarColor = (progress) => {
  if (progress < 25) return 'bg-red-500';
  if (progress < 50) return 'bg-orange-500';
  if (progress < 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

const TitleDashboard = () => {
  const { user, fetchProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const profileResponse = await axios.get(`${API_URL}/profile`, { withCredentials: true });
      const userProfile = profileResponse.data;

      const leaderboardResponse = await axios.get(`${API_URL}/leaderboards/previews`, { withCredentials: true });
      const leaderboardPreviews = leaderboardResponse.data;

      const combinedData = {
        userProfile,
        leaderboardPreviews,
      };
      setDashboardData(combinedData);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  if (loading || !dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const { userProfile, leaderboardPreviews } = dashboardData;

  const currentGoal = rankGoals[userProfile.rank] || 0;
  const creditsNeeded = currentGoal - userProfile.credits;
  const progressPercentage = (userProfile.credits / currentGoal) * 100;
  const progressBarWidth = isNaN(progressPercentage) ? '0%' : `${Math.min(100, progressPercentage)}%`;
  const progressBarColor = getProgressBarColor(progressPercentage);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <section className="relative p-6 sm:p-12 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-900 to-cyan-900 animate-fade-in-down">
          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl sm:text-6xl font-extrabold flex items-center justify-between">
              <span className={`transition-transform duration-300 hover:scale-105 ${getRankColor(userProfile.rank)}`}>
                {userProfile.rank}
              </span>
              <span className="text-4xl sm:text-6xl text-white font-extrabold animate-pulse-fade">
                {userProfile.credits}
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300">
              Total Credits
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-400 font-semibold">
                <span>Next Goal: {Object.keys(rankGoals)[Object.keys(rankGoals).indexOf(userProfile.rank) + 1] || "Top Rank"}</span>
                <span>{creditsNeeded > 0 ? `${creditsNeeded} credits to go` : "Goal Reached! 🎉"}</span>
              </div>
              <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressBarColor} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: progressBarWidth }}
                ></div>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <Zap className="w-8 h-8 text-yellow-400 animate-spin-slow" />
              <div>
                <h3 className="text-xl font-bold">Personal Best</h3>
                <p className="text-gray-300">
                  You have earned **{userProfile.bestAnswerCount}** Best Answers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Leaderboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.keys(leaderboardPreviews).map((key) => {
              const preview = leaderboardPreviews[key];
              const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const metricName = key === 'upvoted' ? 'Upvotes' : 'Credits';
              const userRanking = userProfile.rankings?.[key] || { rank: 'N/A', metric: 'N/A' };
              const userInTop3 = preview.find(entry => entry._id === userProfile._id);
              return (
                <Card key={key} className="bg-black/50 border-cyan-500/20 backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center space-x-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <span>{title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {preview.slice(0, 3).map((entry, index) => (
                      <div key={entry._id} className="flex items-center space-x-3 text-white">
                        <span className="text-lg font-bold w-6">{index + 1}.</span>
                        <img src={entry.profilePicture} alt={entry.username} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1">
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-sm text-gray-400">{entry.rank}</div>
                        </div>
                        <div className="text-lg font-bold text-cyan-400">{entry[key === 'upvoted' ? 'upvotes' : 'credits']}</div>
                      </div>
                    ))}
                    {!userInTop3 && (
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold mt-4">
                        <div className="flex-1">
                          Your Rank: {userRanking.rank !== 'N/A' ? `#${userRanking.rank}` : 'N/A'}
                        </div>
                        <span>{userRanking.metric} {metricName}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        <BadgesSection badges={userProfile.badges} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-white">Recent Contributions</h2>
            <div className="text-gray-400">
              <p>This section is not available until the backend route is implemented.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Milestones</h2>
            <div className="text-gray-400">
              <p>This section is not available until the backend route is implemented.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TitleDashboard;