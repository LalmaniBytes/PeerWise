import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

function RankStore({ user, claimRank }) {
  const ranks = [
    { name: "Bronze", cost: 50, emoji: "🥉" },
    { name: "Silver", cost: 200, emoji: "🥈" },
    { name: "Gold", cost: 500, emoji: "🥇" },
    { name: "Platinum", cost: 800, emoji: "💠" },
    { name: "Diamond", cost: 1000, emoji: "💎" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">🎖️ Rank Store</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ranks.map((rank) => (
          <Card
            key={rank.name}
            className="bg-black/50 border-cyan-500/20 backdrop-blur-xl"
          >
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                {rank.emoji} {rank.name}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Costs {rank.cost} credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.claimedRank === rank.name ? (
                <Button
                  disabled
                  className="w-full bg-green-600/30 text-green-400 cursor-default"
                >
                  ✅ Claimed
                </Button>
              ) : (
                <Button
                  onClick={() => claimRank(rank.name)}
                  disabled={user?.credits < rank.cost}
                  className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold disabled:opacity-50"
                >
                  {user?.credits < rank.cost ? "Not enough credits" : "Claim"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { RankStore }; // This is the crucial change
