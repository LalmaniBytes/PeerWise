import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User, Trophy, Zap, ChevronDown, Bell, Search, Menu, TrophyIcon, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';

function Navigation({searchInputRef}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isClickOpen, setIsClickOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Sync local search state with URL on initial load
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClickOpen(false);
      }
    }
    if (isClickOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClickOpen]);

  // Dropdown handlers
  const handleDropdownClick = () => {
    setIsClickOpen(!isClickOpen);
    setIsHoverOpen(false);
  };
  const handleMouseEnter = () => {
    if (!isClickOpen) {
      setIsHoverOpen(true);
    }
  };
  const handleMouseLeave = () => {
    setIsHoverOpen(false);
  };
  const isDropdownVisible = isHoverOpen || isClickOpen;

  // Debounced search handler
  const debounceTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (newQuery.trim()) {
        navigate(`/threads?q=${newQuery}`);
      } else {
        navigate('/threads');
      }
    }, 500);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/threads?q=${searchQuery}`);
    } else {
      navigate('/threads');
    }
    setIsMobileMenuOpen(false);
  };

  const handleBellClick = () => {
    // Add navigation to notifications page here
    setIsMobileMenuOpen(false);
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
          
          {/* Search bar for desktop */}
          <div className="hidden md:flex flex-1 mx-8">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                ref={searchInputRef}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
              />
            </form>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop Menu */}
                <div className="relative hidden md:flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
                    <TrophyIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-semibold" data-testid="user-credits">{user?.credits || 0}</span>
                  </div>
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
                      <User className="w-4 h-4" />
                      <span>{user?.username}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownVisible ? 'rotate-180' : 'rotate-0'}`} />
                    </div>
                    {isDropdownVisible && (
                      <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-cyan-500/20 backdrop-blur-xl rounded-md shadow-lg py-1 z-50">
                        <Link to="/profile" onClick={() => setIsClickOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link to="/dashboard" onClick={() => setIsClickOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                          <Zap className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link to="/leaderboard" onClick={() => setIsClickOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                          <TrophyIcon className="w-4 h-4" />
                          <span>Leaderboard</span>
                        </Link>
                        <div className="border-t border-cyan-500/20 my-1"></div>
                        <button onClick={() => { logout(); setIsClickOpen(false); }} className="flex items-center w-full space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                          <LogOut className="w-4 h-4 mr-2" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 relative" onClick={handleBellClick}>
                    <Bell className="h-4 w-4" />
                    {user?.unreadNotifications > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-black" />}
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-cyan-500 to-green-500 text-black font-semibold hover:from-cyan-400 hover:to-green-400">
                  Sign In
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {/* Mobile search bar (visible on mobile only) */}
        <div className="md:hidden px-4 pb-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
            />
          </form>
        </div>

        {/* Mobile menu content (collapsed) */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} py-2 px-4`}>
          {user && (
            <div className="flex flex-col space-y-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
                  <TrophyIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">{user?.credits || 0}</span>
                </div>
                <Button variant="ghost" size="icon" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 relative" onClick={handleBellClick}>
                  <Bell className="h-4 w-4" />
                  {user?.unreadNotifications > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-black" />}
                </Button>
              </div>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                <Zap className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                <TrophyIcon className="w-4 h-4" />
                <span>Leaderboard</span>
              </Link>
              <div className="border-t border-cyan-500/20 my-1"></div>
              <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center w-full space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
export { Navigation };