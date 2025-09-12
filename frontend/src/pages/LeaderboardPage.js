// LeaderboardPage.jsx

import React from 'react';
import { Navigation } from '../components/Navigation';
import TitleDashboard, { Leaderboard } from '../components/Leaderboard';

function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <Leaderboard/>
    </div>
  );
}

export default LeaderboardPage;