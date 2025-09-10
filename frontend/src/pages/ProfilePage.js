import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
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
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { Navigation } from "../components/Navigation";

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

  // State for editable form data, 'realName' restored
  const [formData, setFormData] = useState({
    username: "",
    realName: "",
    bio: "",
    email: "",
    password: "",
    newPassword: "",
  });

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
      setUserData(response.data);
      setFormData({
        username: response.data.username,
        realName: response.data.realName || "",
        bio: response.data.bio || "",
        email: response.data.email,
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
      // Update both username and realName together
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

  const getRankEmoji = (rank) => {
    switch (rank) {
      case "Diamond":
        return "💎";
      case "Platinum":
        return "💠";
      case "Gold":
        return "🥇";
      case "Silver":
        return "🥈";
      case "Bronze":
        return "🥉";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
          <CardHeader className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400">
              <img
                src={
                  userData.profilePicture ||
                  "https://placehold.co/100x100/1e293b/a5f3fc?text=P"
                }
                alt="Profile"
                className="object-cover w-full h-full"
              />
              <label className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs text-center cursor-pointer p-1">
                Edit
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              {isEditingName ? (
                <>
                  <div className="flex flex-col space-y-2">
                    <Input
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="bg-black/50 border-cyan-500/30 text-white"
                      placeholder="Username"
                    />
                    <Input
                      value={formData.realName}
                      onChange={(e) =>
                        setFormData({ ...formData, realName: e.target.value })
                      }
                      className="bg-black/50 border-cyan-500/30 text-white"
                      placeholder="Real Name"
                    />
                  </div>
                  <div className="flex items-center space-x-2 justify-center md:justify-start">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleUpdateProfile}
                    >
                      <Save className="w-4 h-4 text-green-400" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditingName(false)}
                    >
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </Button>
                </>
              )}

              {isEditingBio ? (
                <div className="flex items-center space-x-2">
                  <Textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="bg-black/50 border-cyan-500/30 text-white min-h-[100px]"
                  />
                  <Button size="icon" variant="ghost" onClick={handleUpdateBio}>
                    <Save className="w-4 h-4 text-green-400" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingBio(false)}
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ) : (
                <p className="text-gray-300 leading-relaxed pt-2">
                  {userData.bio || "Add a short bio about yourself."}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingBio(true)}
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </Button>
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-semibold">
                Current Rank:
              </span>
              <span className="text-lg">
                {getRankEmoji(userData.claimedRank)}{" "}
                {userData.claimedRank || "Unranked"}
              </span>
            </div>
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-cyan-400">
                {userData.questionsAsked || 0}
              </span>
              <span className="text-sm text-gray-400">Questions Asked</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-cyan-400">
                {userData.answersGiven || 0}
              </span>
              <span className="text-sm text-gray-400">Answers Given</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-400">
                {userData.totalCredits || 0}
              </span>
              <span className="text-sm text-gray-400">Total Credits</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-400">
                {userData.bestAnswerCount || 0}
              </span>
              <span className="text-sm text-gray-400">Best Answers</span>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="bg-black/95 border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle>Update Email</DialogTitle>
              <DialogDescription>
                Enter your new email address. You will need to verify it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <Input
                type="email"
                placeholder="New Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-black/50 border-cyan-500/30 text-white"
                required
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
              >
                Update
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
        >
          <DialogContent className="bg-black/95 border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and a new one.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                placeholder="Current Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-black/50 border-cyan-500/30 text-white"
                required
              />
              <Input
                type="password"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="bg-black/50 border-cyan-500/30 text-white"
                required
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
              >
                Change Password
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ProfilePage;
