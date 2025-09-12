// DashboardPage.jsx

import React from 'react';
import { Navigation } from '../components/Navigation';
import TitleDashboard from '../components/TitleDashboard';

function TitleDashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation/>
      <TitleDashboard />
    </div>
  );
}

export default TitleDashboardPage;