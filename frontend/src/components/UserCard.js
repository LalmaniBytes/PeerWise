// UserCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { User, TrophyIcon } from 'lucide-react';

// Your existing utility function for rank coloring
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

const UserCard = ({ user }) => {
  return (
    <Link to={`/publicProfile/${user._id}`} className="block">
      <div className="bg-black/50 p-4 rounded-lg flex items-center space-x-3 transition-transform duration-200 hover:scale-105 hover:shadow-lg border border-cyan-500/30">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{user.username}</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <TrophyIcon className="w-4 h-4 text-cyan-400" />
            <span>{user.credits}</span>
          </div>
          {/* ✅ New: Conditionally render the rank badge */}
          {user.rank && user.rank !== "None" && (
            <p className={`mt-1 ${getRankColoring(user.rank)}`}>
              {user.rank}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default UserCard;