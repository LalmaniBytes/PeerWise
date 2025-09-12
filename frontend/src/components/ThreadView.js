import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Play,
  Star,
  Share2,
  MoreVertical,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useAuth } from "../AuthContext";
import { Input } from "./ui/input";
import { formatThreadTime } from "../lib/utils";
import { useParams, useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

// Reusing the rank coloring function you provided
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

const isYouTubeUrl = (url) =>
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/i.test(url);
const extractYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

function ThreadView() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [selectedThread, setSelectedThread] = useState(null);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const { user, fetchProfile } = useAuth();
  const [hasBestAnswer, setHasBestAnswer] = useState(false);

  const fetchThreadDetails = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_URL}/threads/${id}`, {
        withCredentials: true,
      });
      setSelectedThread(response.data);
    } catch (error) {
      console.error("Failed to fetch thread details:", error);
      toast.error("Failed to load thread details. It may not exist.");
    }
  }, []);

  const fetchResponsesForThread = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_URL}/threads/${id}/responses`, {
        withCredentials: true,
      });
      setResponses(response.data);
      setHasBestAnswer(response.data.some((r) => r.isBestAnswer));
    } catch (error) {
      console.error("Failed to fetch responses:", error);
    }
  }, []);

  const handleBestAnswer = useCallback(
    async (responseId) => {
      try {
        await axios.post(
          `${API_URL}/threads/responses/${responseId}/best-answer`,
          {},
          { withCredentials: true }
        );
        toast.success(
          "Best answer awarded! +25 credits awarded to the author. 🎉"
        );
        fetchResponsesForThread(threadId);
        fetchProfile();
      } catch (error) {
        console.error("Error awarding best answer:", error);
        toast.error(
          error.response?.data?.detail || "Failed to award best answer."
        );
      }
    },
    [fetchResponsesForThread, fetchProfile, threadId]
  );

  const handleResponseSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newResponse.trim() && !file) return;
      try {
        const formData = new FormData();
        formData.append("content", newResponse);
        if (file) formData.append("file", file);
        await axios.post(`${API_URL}/threads/${threadId}/responses`, formData, {
          withCredentials: true,
        });
        toast.success("Response posted! 💡");
        setNewResponse("");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchResponsesForThread(threadId);
      } catch (error) {
        toast.error("Failed to post response");
      }
    },
    [newResponse, file, threadId, fetchResponsesForThread]
  );

  const handleVote = useCallback(
    async (responseId, voteType) => {
      try {
        await axios.post(
          `${API_URL}/threads/responses/${responseId}/vote`,
          { vote_type: voteType },
          { withCredentials: true }
        );
        toast.success(
          voteType === "up"
            ? "Thanks for the thumbs up! 👍"
            : "Thanks for the feedback! 👎"
        );
        fetchResponsesForThread(threadId);
        await fetchProfile();
      } catch (error) {
        console.error("Vote error:", error);
        toast.error(error.response?.data?.detail || "Failed to vote");
      }
    },
    [threadId, fetchResponsesForThread, fetchProfile]
  );

  const handleBackButtonClick = () => {
    navigate("/threads");
  };
  const handleDeleteThread = useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this thread? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/threads/${threadId}`, {
        withCredentials: true,
      });
      toast.success("Thread deleted successfully. Goodbye! 👋");
      navigate("/threads"); // Navigate back to the main threads page
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast.error(error.response?.data?.detail || "Failed to delete thread.");
    }
  }, [threadId, navigate]);
  const handleShare = async () => {
    const shareData = {
      title: selectedThread.title,
      text: `Check out this problem on our app: ${selectedThread.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const shareText = `${shareData.text} ${shareData.url}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}`;
        window.open(twitterUrl, "_blank");

        await navigator.clipboard.writeText(shareData.url);
        toast.info("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast.error("Failed to share.");
    }
  };

  const formatThreadTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hrs ago`;
    } else {
      return created.toLocaleDateString();
    }
  };

  useEffect(() => {
    if (threadId) {
      fetchThreadDetails(threadId);
      fetchResponsesForThread(threadId);
    }
  }, [threadId, fetchThreadDetails, fetchResponsesForThread]);

  if (!selectedThread) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <p>Loading thread...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={handleBackButtonClick}
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
        >
          ← Back to Problems
        </Button>
      </div>
      <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-white">
            {selectedThread.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:bg-cyan-500/10"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border-cyan-500/20">
              <DropdownMenuItem
                onClick={handleShare}
                className="flex items-center space-x-2 text-white hover:text-cyan-400 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </DropdownMenuItem>
              {selectedThread?.author?._id === user?._id && (
                <DropdownMenuItem
                  onClick={handleDeleteThread}
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {/* Author's Identity Section */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={
                selectedThread.author?.profilePicture ||
                "https://placehold.co/40x40/155e75/E2E8F0?text=A"
              }
              alt={selectedThread.author?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <Link to={`/publicProfile/${selectedThread.author?._id}`}>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white hover:text-cyan-400">
                    {selectedThread.author?.username}
                  </span>
                  {/* Title/Rank Display */}
                  <div
                    className={`text-sm font-bold p-1 rounded-full text-center ${getRankColoring(
                      selectedThread.author?.rank
                    )}`}
                  >
                    {selectedThread.author?.rank}
                  </div>
                  {/* Badges Display */}
                  <TooltipProvider>
                    {selectedThread.author?.badges?.map((badge) => (
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
              </Link>
              <span className="text-xs text-gray-500">
                Posted {formatThreadTime(selectedThread.createdAt)}
              </span>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed">
            {selectedThread.description}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl mb-8">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
            Share Your Solution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResponseSubmit} className="space-y-4">
            <Textarea
              name="content"
              placeholder="Share your solution! (YouTube link or upload a file)"
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 min-h-[100px]"
            />
            <Input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              className="bg-black/50 border-cyan-500/30 text-white"
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
            >
              Post Solution
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {responses.map((response) => {
          const youtubeId = isYouTubeUrl(response.content)
            ? extractYouTubeId(response.content)
            : null;
          return (
            <Card
              key={response._id}
              className="bg-black/50 border-cyan-500/20 backdrop-blur-xl"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <p className="text-sm text-gray-400">
                      <span className="text-cyan-400 font-semibold">
                        {response.author.username}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatThreadTime(response.createdAt)}
                      </span>
                    </p>
                  </div>
                  {response.isBestAnswer ? (
                    <span className="text-green-400 flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">Best Answer</span>
                    </span>
                  ) : (
                    user?._id === selectedThread.author._id &&
                    !hasBestAnswer &&
                    user?._id !== response.author?._id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBestAnswer(response._id)}
                        className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Best Answer
                      </Button>
                    )
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-gray-300 mb-3">{response.content}</p>
                  {response.file_url && (
                    <div className="mt-3">
                      {(() => {
                        const fileUrl = response.file_url.startsWith("http")
                          ? response.file_url
                          : `${API_URL}${response.file_url}`;
                        const fileName = response.file_url.split("/").pop();
                        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(
                          fileUrl
                        );
                        return isImage ? (
                          <img
                            src={fileUrl}
                            alt={fileName || "uploaded file"}
                            className="max-w-full rounded"
                          />
                        ) : (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline break-all"
                          >
                            📎 {fileName}
                          </a>
                        );
                      })()}
                    </div>
                  )}
                  {youtubeId && (
                    <div className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Play className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-medium">
                          Video Solution
                        </span>
                      </div>
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        className="w-full h-64 rounded-lg"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleVote(response._id, "up");
                    }}
                    size="sm"
                    variant="outline"
                    className={`border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all duration-200 ${
                      response.voters?.some(
                        (v) => v.user === user._id && v.voteType === "up"
                      )
                        ? "bg-green-500/20"
                        : ""
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {response.thumbs_up}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleVote(response._id, "down");
                    }}
                    size="sm"
                    variant="outline"
                    className={`border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200 ${
                      response.voters?.some(
                        (v) =>
                          v.user?.toString() === user._id &&
                          v.voteType === "down"
                      )
                        ? "bg-red-500/20"
                        : ""
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {response.thumbs_down}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { ThreadView };
