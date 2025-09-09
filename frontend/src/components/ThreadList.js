import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatThreadTime } from "../lib/utils";

function ThreadList({ threads }) {
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

  return (
    <div className="grid gap-6">
      {threads.map((thread) => (
        <Link key={thread._id} to={`/threads/${thread._id}`}>
          <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl hover:border-cyan-500/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl text-white hover:text-cyan-400 transition-colors">
                  {thread.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400"
                >
                  {thread.response_count} responses
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>by {thread.author_username}</span>
                <span>{formatThreadTime(thread.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 line-clamp-2">{thread.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
export { ThreadList };
