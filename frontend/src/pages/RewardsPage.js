import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Award,
  Shirt,
  Star,
  BookOpen,
  User as UserIcon,
  Coffee,
  ShoppingBag,
  Gem,
  Medal,
  Dices,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const API_URL = process.env.REACT_APP_API_URL;

// Reusable function to get icons for rewards
const getIconForReward = (reward) => {
  if (reward.type === "title") {
    switch (reward.name) {
      case "The Pundit":
        return <BookOpen className="w-8 h-8 text-cyan-400" />;
      case "The Luminary":
        return <Gem className="w-8 h-8 text-yellow-400" />;
      case "The Maven":
        return <Award className="w-8 h-8 text-green-400" />;
      case "The Sentinel":
        return <Medal className="w-8 h-8 text-purple-400" />;
      case "The LoreMaven":
        return <Dices className="w-8 h-8 text-orange-400" />;
      default:
        return null;
    }
  } else if (reward.type === "merchandise") {
    switch (reward.name) {
      case "Platform-Branded T-Shirt":
        return <Shirt className="w-8 h-8 text-white" />;
      case "Logo Sticker Pack":
        return <ShoppingBag className="w-8 h-8 text-white" />;
      case "Customized Mug":
        return <Coffee className="w-8 h-8 text-white" />;
      default:
        return null;
    }
  }
};

// Fallback mock data for development
const mockRewards = [
  { _id: "1", name: "The Pundit", description: "A title for the wise.", cost: 1500, type: "title", badge: { imageUrl: "https://placehold.co/40x40/155e75/E2E8F0?text=P" } },
  { _id: "2", name: "The Luminary", description: "A title for the brilliant.", cost: 2000, type: "title", badge: { imageUrl: "https://placehold.co/40x40/1e293b/a5f3fc?text=L" } },
  { _id: "3", name: "Platform-Branded T-Shirt", description: "Wear your pride!", cost: 10000, type: "merchandise", imageUrl: "https://placehold.co/100x100/1e293b/a5f3fc?text=T-Shirt" },
];

function RewardsPage() {
  const { user, fetchProfile, setUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRewardsData = async () => {
    try {
      const response = await axios.get(`${API_URL}/rewards`, {
        withCredentials: true,
      });
      setRewards(response.data);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
      toast.error("Failed to load rewards. Using mock data.");
      setRewards(mockRewards);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRewardsData();
    } else {
      setLoading(false);
      setRewards(mockRewards);
    }
  }, [user]);

  const handleRedeem = async (reward) => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards.");
      return;
    }
    if (user.credits < reward.cost) {
      toast.error("Not enough credits to redeem this item.");
      return;
    }

    if (reward.type === "merchandise") {
      // ✅ Suggestion: Replace this with a proper modal for better UX
      const shippingAddress = window.prompt(
        "Please enter your shipping address to redeem this item:"
      );
      if (!shippingAddress) {
        toast.info("Redemption canceled.");
        return;
      }
      toast.info("Redeeming merchandise...");
    }

    try {
      await axios.post(
        `${API_URL}/rewards/${reward._id}/redeem`,
        { shippingAddress: reward.type === "merchandise" ? shippingAddress : undefined },
        { withCredentials: true }
      );
      toast.success(`'${reward.name}' redeemed successfully! 🎉`);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to redeem reward");
    }
  };

  const titles = rewards.filter((r) => r.type === "title");
  const merchandise = rewards.filter((r) => r.type === "merchandise");
  const userBadges = user?.badges || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p>Loading rewards marketplace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* User's Credits and Badges Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-6 sm:p-8 rounded-xl border border-cyan-500/20 bg-black/50 text-white shadow-lg animate-fade-in">
        <div className="flex items-center space-x-4">
          <Award className="w-10 h-10 text-yellow-400" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Your Credits</h2>
            <p className="text-sm text-gray-400">
              Redeem them for exclusive items!
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="text-4xl font-extrabold text-cyan-400">
            {user?.credits || 0}
          </p>
        </div>
      </div>
      
      {/* My Badges Section (New) */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
          <Star className="w-8 h-8 text-yellow-400" />
          <span>My Earned Badges</span>
        </h2>
        <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
          <CardContent className="p-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <TooltipProvider>
              {userBadges.length > 0 ? (
                userBadges.map((badge) => (
                  <Tooltip key={badge._id}>
                    <TooltipTrigger asChild>
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover transform transition-transform duration-300 hover:scale-110 cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-gray-400">{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))
              ) : (
                <span className="text-gray-500">No badges earned yet.</span>
              )}
            </TooltipProvider>
          </CardContent>
        </Card>
      </section>

      {/* Custom Titles Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          <span>Custom Titles</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {titles.map((reward) => {
            const isClaimed = user?.badges.some(
              (userBadge) => reward?.badge?._id?.toString() === userBadge?._id?.toString()
            );
            const isDisabled = !user || user.credits < reward.cost || isClaimed;

            return (
              <Card key={reward._id} className="bg-black/50 border-cyan-500/20 backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl text-white">{reward.name}</CardTitle>
                  {getIconForReward(reward)}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400">{reward.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-cyan-400">{reward.cost} Credits</span>
                    <Button
                      onClick={() => handleRedeem(reward)}
                      disabled={isDisabled}
                      className={`
                        bg-green-500/30 text-green-400 hover:bg-green-500/50 
                        ${
                          isDisabled &&
                          "opacity-50 cursor-not-allowed bg-gray-600/30 text-gray-400"
                        }
                      `}
                    >
                      {isClaimed ? "Claimed" : "Redeem"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Merchandise Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
          <ShoppingBag className="w-8 h-8 text-purple-400" />
          <span>Merchandise</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchandise.map((reward) => (
            <Card key={reward._id} className="bg-black/50 border-cyan-500/20 backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="text-xl text-white flex justify-between items-center">
                  <span>{reward.name}</span>
                  {getIconForReward(reward)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center items-center">
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="rounded-lg w-full max-w-xs"
                  />
                </div>
                <p className="text-gray-400">{reward.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-cyan-400">
                    {reward.cost} Credits
                  </span>
                  <Button
                    onClick={() => handleRedeem(reward)}
                    disabled={!user || user.credits < reward.cost}
                    className={`
                      bg-green-500/30 text-green-400 hover:bg-green-500/50
                      ${
                        (!user || user.credits < reward.cost) &&
                        "opacity-50 cursor-not-allowed bg-gray-600/30 text-gray-400"
                      }
                    `}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default RewardsPage;