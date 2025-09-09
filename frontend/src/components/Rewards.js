import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function Rewards({ rewards, user, handleRewardRedeem }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">🎁 Available Rewards</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward._id} className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white">{reward.name}</CardTitle>
              <CardDescription className="text-gray-400">
                Costs {reward.cost} credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleRewardRedeem(reward._id)} disabled={user?.credits < reward.cost} className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold disabled:opacity-50">
                {user?.credits < reward.cost ? "Not enough credits" : "Redeem"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { Rewards };