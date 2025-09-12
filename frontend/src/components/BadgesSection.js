// components/BadgesSection.jsx
import React from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

function BadgesSection({ badges }) {
  return (
    <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-400" />
          <span>Earned Badges</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges && badges.length > 0 ? (
          <TooltipProvider>
            <div className="flex flex-wrap gap-4">
              {badges.map((badge) => (
                <Tooltip key={badge._id}>
                  <TooltipTrigger asChild>
                    <img
                      src={badge.imageUrl}
                      alt={badge.name}
                      className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover transform transition-transform duration-300 hover:scale-110"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    <span className="font-semibold">{badge.name}</span>
                    <p className="text-gray-400">{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        ) : (
          <span className="text-sm text-gray-500">No badges earned yet.</span>
        )}
      </CardContent>
    </Card>
  );
}

export { BadgesSection };