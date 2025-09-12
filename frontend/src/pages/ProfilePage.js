import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button ,} from "../components/ui/button";
import { Trash } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  User as UserIcon,
  Mail,
  Key,
  Edit,
  Save,
  X,
  Trophy as TrophyIcon,
  Zap,
  Star,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

import { useAuth } from "../AuthContext";
import { Navigation } from "../components/Navigation";
import punditBadge from '../media/pundit.png'
import luminaryBadge from '../media/luminary.png'
import mavenBadge from '../media/maven.png'
import sentinelBadge from '../media/sentinel.png'
import loremavenBadge from '../media/loremaven.png'

const badgeImages = {
  Pundit: punditBadge,
  Luminary: luminaryBadge,
  Maven: mavenBadge,
  Sentinel: sentinelBadge,
  LoreMaven: loremavenBadge,
};

const API_URL = process.env.REACT_APP_API_URL;

function ProfilePage() {
  const { user, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // State for editable form data
  const [formData, setFormData] = useState({
    username: "",
    realName: "",
    bio: "",
    email: "",
    password: "",
    newPassword: "",
  });

  // ✅ UPDATED: The new rank emojis
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
      case "Newbies":
        return "🌱";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/profile`, {
        withCredentials: true,
      });
      const profileData = response.data;
      setUserData(profileData);
      setFormData({
        username: profileData.username,
        realName: profileData.realName || "",
        bio: profileData.bio || "",
        email: profileData.email,
        password: "",
        newPassword: "",
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError("Failed to load user profile. Please try again.");
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatePayload = {
        username: formData.username,
        realName: formData.realName,
      };
      await axios.put(`${API_URL}/profile/update`, updatePayload, {
        withCredentials: true,
      });
      toast.success("Profile updated successfully! 🎉");
      fetchUserData();
      setIsEditingName(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    }
  };

  const handleUpdateBio = async () => {
    try {
      const updatePayload = { bio: formData.bio };
      await axios.put(`${API_URL}/profile/update`, updatePayload, {
        withCredentials: true,
      });
      toast.success("Bio updated successfully! 🎉");
      fetchUserData();
      setIsEditingBio(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update bio.");
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/profile/update-email`,
        { newEmail: formData.email },
        { withCredentials: true }
      );
      toast.success(
        "Email updated successfully! Please verify the new address."
      );
      setIsEmailModalOpen(false);
      fetchUserData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update email.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/profile/change-password`,
        {
          currentPassword: formData.password,
          newPassword: formData.newPassword,
        },
        { withCredentials: true }
      );
      toast.success("Password changed successfully! 🔒");
      setIsPasswordModalOpen(false);
      setFormData({ ...formData, password: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataPayload = new FormData();
    formDataPayload.append("profilePicture", file);
    try {
      await axios.put(`${API_URL}/profile/update-picture`, formDataPayload, {
        withCredentials: true,
      });
      toast.success("Profile picture updated!");
      fetchUserData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload picture.");
    }
  };

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
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  if (!userData) {
    return null;
  }
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.")) {
        return;
    }
    try {
        await axios.delete(`${API_URL}/profile/delete-account`, { withCredentials: true });
        toast.success("Your account has been deleted. Goodbye! 👋");
        navigate('/')
    } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to delete account.");
    }
};

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* User Info & Stats Banner */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl animate-fade-in">
            <CardHeader className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Profile Picture */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400">
                <img
                  src={userData.profilePicture || "https://placehold.co/100x100/1e293b/a5f3fc?text=P"}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
                <label className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs text-center cursor-pointer p-1">
                  Edit
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                {/* Username & Real Name */}
                {isEditingName ? (
                  <>
                    <div className="flex flex-col space-y-2">
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="bg-black/50 border-cyan-500/30 text-white"
                        placeholder="Username"
                      />
                      <Input
                        value={formData.realName}
                        onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                        className="bg-black/50 border-cyan-500/30 text-white"
                        placeholder="Real Name"
                      />
                    </div>
                    <div className="flex items-center space-x-2 justify-center md:justify-start">
                      <Button size="icon" variant="ghost" onClick={handleUpdateProfile}>
                        <Save className="w-4 h-4 text-green-400" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                        <X className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-3xl bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                      {userData.username}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {userData.realName || "No real name provided"}
                    </CardDescription>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)}>
                      <Edit className="w-4 h-4 text-gray-400" />
                    </Button>
                  </>
                )}

                {/* User Bio */}
                {isEditingBio ? (
                  <div className="flex items-center space-x-2">
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="bg-black/50 border-cyan-500/30 text-white min-h-[100px]"
                    />
                    <Button size="icon" variant="ghost" onClick={handleUpdateBio}>
                      <Save className="w-4 h-4 text-green-400" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingBio(false)}>
                      <X className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-300 leading-relaxed pt-2">
                    {userData.bio || "Add a short bio about yourself."}
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingBio(true)}>
                      <Edit className="w-4 h-4 text-gray-400" />
                    </Button>
                  </p>
                )}
                
                {/* Dynamic Title and Rank Display */}
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold">
                    {getRankEmoji(userData.rank)}
                  </span>
                  {/* ✅ FIX: Add tooltip to the rank display */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xl font-bold text-yellow-400 cursor-pointer">
                        {userData.title && userData.title !== "None" ? userData.title : userData.rank}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                      <span className="font-semibold">Current Rank</span>
                      <p className="text-gray-400">Your rank is based on total credits.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="mt-6 border-t border-cyan-500/20 pt-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-cyan-400">{userData.questionsAsked || 0}</span>
                  <span className="text-sm text-gray-400">Problems Asked</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-cyan-400">{userData.answersGiven || 0}</span>
                  <span className="text-sm text-gray-400">Solutions Given</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-green-400">{userData.totalCredits || 0}</span>
                  <span className="text-sm text-gray-400">Total Credits</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-green-400">{userData.bestAnswerCount || 0}</span>
                  <span className="text-sm text-gray-400">Best Answers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Section */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Star className="w-6 h-6 text-yellow-400" />
                <span>Earned Badges</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userData.badges && userData.badges.length > 0 ? (
                <TooltipProvider>
                  <div className="flex flex-wrap gap-4">
                    {userData.badges.map((badge) => (
                      <Tooltip key={badge._id}>
                        <TooltipTrigger asChild>
                          <img
                            src={badgeImages[badge.name] || badge.imageUrl}
                            alt={badge.name}
                            className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover transform transition-transform duration-300 hover:scale-110"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <span className="font-semibold">{badge.name}</span>
                          <p className="text-gray-400">{badge.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              ) : (
                <span className="text-sm text-gray-500">No badges earned yet.</span>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300">{userData.email}</span>
                </span>
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Update Email
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300">Password</span>
                </span>
                <Button
                  onClick={() => setIsPasswordModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Change Password
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <TrophyIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300">Redeem Rewards</span>
                </span>
                <Button
                  onClick={() => navigate("/rewards")}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
                >
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Trash className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Delete Account</span>
                </span>
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  size="sm"
                  className="bg-red-500/30 text-red-400 hover:bg-red-500/50"
                >
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modals */}
          <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
            {/* ... (existing email modal content) */}
          </Dialog>
          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            {/* ... (existing password modal content) */}
          </Dialog>

        </div>
      </div>
    </TooltipProvider>
  );
}

export default ProfilePage;