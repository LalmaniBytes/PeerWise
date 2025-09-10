import React from "react";
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import { Toaster } from "./components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Import your page components
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { ThreadView } from "./components/ThreadView";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import IntroPage from "./pages/IntroPage";
import { LeaderboardsPage, LeaderboardTable } from "./pages/LeaderboardPage";

function App() {
  return (
    <div className="App">
      {/* AuthProvider is still at the top level */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* The Auth page is a regular, non-protected route */}
            <Route path="/auth" element={<AuthPage />} />

            {/* The main app content is now a protected route */}
            <Route
              path="/threads"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/threads/:threadId"
              element={
                <ProtectedRoute>
                  <ThreadView />
                </ProtectedRoute>
              } />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <RewardsPage />
                </ProtectedRoute>
              } />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            <Route
              path="/"
              element={
                <IntroPage />
              } />
            <Route
              path="/leaderboard"
              element={ 
                <ProtectedRoute>
                  <LeaderboardsPage />
                </ProtectedRoute>
              } />
            <Route
              path="/leaderboard/:leaderboardType"
              element={
                <ProtectedRoute>
                  <LeaderboardTable />
                </ProtectedRoute>
              } />
          </Routes>
        </BrowserRouter>
        <Toaster
          theme="dark"
          className="bg-black border-cyan-500/30"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'white',
            },
          }}
        />
      </AuthProvider>
    </div>
  );
}

function AppWrapper() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
}

export default AppWrapper;