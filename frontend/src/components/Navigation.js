import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { User, Trophy, Zap, ChevronDown, User as UserIcon, Trophy as TrophyIcon, Bell } from 'lucide-react';
import { useAuth } from '../AuthContext';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isClickOpen, setIsClickOpen] = useState(false);
  const dropdownRef = useRef(null);

  // useEffect hook to handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClickOpen(false); // Close the dropdown if click is outside
      }
    }
    // Only add the listener when the dropdown is open due to a click
    if (isClickOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClickOpen]);

  const handleDropdownClick = () => {
    setIsClickOpen(!isClickOpen); // Toggle the click-based state
    setIsHoverOpen(false); // Close hover dropdown if open
  };

  const handleMouseEnter = () => {
    if (!isClickOpen) { // Don't open on hover if already open from a click
      setIsHoverOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHoverOpen(false); // Close hover dropdown
  };

  const isDropdownVisible = isHoverOpen || isClickOpen;
  
  // Placeholder state and function for notifications
  const [unreadNotifications, setUnreadNotifications] = useState(0); 
  const handleBellClick = () => {
      console.log("Notification bell clicked! Navigating to notifications page.");
      // For now, this just logs a message. You can add navigation here later.
      // navigate('/notifications');
  };

  return (
    <nav className="bg-black/90 border-b border-cyan-500/20 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-green-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <Link to="/threads" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              PeerWise
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Credits Display */}
            <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-semibold" data-testid="user-credits">{user?.credits || 0}</span>
            </div>

            {/* Dropdown Menu for User (hybrid hover and click) */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="flex items-center space-x-2 text-white cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={handleDropdownClick}
              >
                <UserIcon className="w-4 h-4" />
                <span>
                  {user?.username}{" "}
                  {user?.claimedRank === "Diamond" && "💎"}
                  {user?.claimedRank === "Platinum" && "💠"}
                  {user?.claimedRank === "Gold" && "🥇"}
                  {user?.claimedRank === "Silver" && "🥈"}
                  {user?.claimedRank === "Bronze" && "🥉"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownVisible ? 'rotate-180' : 'rotate-0'}`} />
              </div>

              {/* Dropdown Menu Content */}
              {isDropdownVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-cyan-500/20 backdrop-blur-xl rounded-md shadow-lg py-1 z-50">
                  <Link to="/profile" onClick={() => setIsClickOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                    <UserIcon className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link to="/threads" onClick={() => setIsClickOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                    <Zap className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/leaderboard" onClick={() => setIsClickOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                    <TrophyIcon className="w-4 h-4" />
                    <span>Leaderboard</span>
                  </Link>
                  <div className="border-t border-cyan-500/20 my-1"></div>
                  <button onClick={() => { logout(); setIsClickOpen(false); }} className="flex items-center w-full space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* New Notification Bell Icon and Button */}
            <div className="relative">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 relative"
                    onClick={handleBellClick}
                >
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-black" />
                    )}
                </Button>
            </div>

            {/* Logout Button (kept for mobile/non-dropdown scenarios) */}
            <Button onClick={logout} variant="outline" size="sm" className="hidden sm:inline-flex border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export { Navigation };