import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Trophy as TrophyIcon,
  Zap,
  Star,
  ThumbsUp,
  User as UserIcon,
  MessageCircle,
  Award,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Navigation } from "../components/Navigation";
import punditBadge from '../media/pundit.png'
import luminaryBadge from '../media/luminary.png'
import mavenBadge from '../media/maven.png'
import sentinelBadge from '../media/sentinel.png'
import loremavenBadge from '../media/loremaven.png'

const API_URL = process.env.REACT_APP_API_URL;

const badgeImages = {
  Pundit: punditBadge,
  Luminary: luminaryBadge,
  Maven: mavenBadge,
  Sentinel: sentinelBadge,
  LoreMaven: loremavenBadge,
};
//

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

const getRankEmoji = (rank) => {
  switch (rank) {
    case "Elite Master":
      return "👑";
    case "Sage":
      return "🧠";
    case "Guru":
      return "💡";
    case "Scholar":
      return "🎓";
    case "Newbie":
      return "🌱";
    default:
      return "";
  }
};

function PublicProfilePage() {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPublicProfile = useCallback(async () => {
    if (!userId) {
      setError("Invalid user ID in URL.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // ✅ Updated API endpoint to match the new route
      const response = await axios.get(`${API_URL}/publicProfile/${userId}`);
      setUserData(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError("Failed to load user profile. User may not exist.");
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPublicProfile();
  }, [fetchPublicProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header and Summary */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl animate-fade-in text-center">
            <CardHeader className="flex flex-col items-center pt-8">
              {/* Profile Picture */}
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-400">
                <img
                  src={userData.profilePicture || "https://placehold.co/120x120/1e293b/a5f3fc?text=P"}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="mt-4 flex flex-col items-center space-y-2">
                {/* Username */}
                <CardTitle className="text-3xl bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                  {userData.username}
                </CardTitle>
                {/* Current Rank and Title */}
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold">
                    {getRankEmoji(userData.rank)}
                  </span>
                  <div className={`text-md font-bold ${getRankColoring(userData.rank)}`}>
                    {userData.rank}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bio */}
              <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">
                {userData.bio || "This user has not provided a public bio yet."}
              </p>
              {/* Key Stats */}
              <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-cyan-400">{userData.totalCredits || 0}</span>
                  <span className="text-sm text-gray-400">Total Credits</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-cyan-400">{userData.answersGiven || 0}</span>
                  <span className="text-sm text-gray-400">Answers Given</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-green-400">{userData.bestAnswerCount || 0}</span>
                  <span className="text-sm text-gray-400">Best Answers</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-green-400">{userData.totalUpvotes || 0}</span>
                  <span className="text-sm text-gray-400">Total Upvotes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges and Rewards Section */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Award className="w-6 h-6 text-yellow-400" />
                <span>Earned Badges</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userData.badges && userData.badges.length > 0 ? (
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  {userData.badges.map((badge) => (
                    <Tooltip key={badge._id}>
                      <TooltipTrigger asChild>
                        <img
                          src={badgeImages[badge.name] || badge.imageUrl}
                          alt={badge.name}
                          className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover transform transition-transform duration-300 hover:scale-110 cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-gray-400">{badge.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500">This user has not earned any badges yet.</span>
              )}
              <div className="mt-6 flex justify-center">
                <Link to="/rewards">
                  <Button className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold">
                    Start Your Own Journey
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default PublicProfilePage;