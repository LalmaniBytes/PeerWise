import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { MessageCircle, Lightbulb, Trophy, Zap } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

function IntroPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* --- Header Section --- */}
        <header className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
          <Zap className="w-16 h-16 text-cyan-400 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mt-4 max-w-4xl">
            Stuck on a tough problem? Get real answers, fast.
          </h1>
          <p className="mt-4 text-xl text-gray-400 max-w-2xl">
            Join a community of peers and experts ready to help you solve
            problems and earn rewards for your contributions.
          </p>
        </header>

        {/* --- Problem-Solution Section --- */}
        <section className="grid md:grid-cols-2 gap-8 py-20">
          {/* Left Column (The Problem) */}
          <Card className="bg-gray-900/50 border-cyan-500/20 backdrop-blur-xl p-8 flex flex-col items-center text-center">
            <div className="w-48 h-48 bg-gray-800 rounded-full flex items-center justify-center opacity-60">
              {/* Placeholder for a visual element of a frustrated person */}
              <p className="text-gray-400 text-sm">
                Frustrated student illustration
              </p>
            </div>
            <h2 className="text-3xl font-bold mt-8">
              Tired of generic search results?
            </h2>
            <p className="text-lg text-gray-400 mt-2">
              Frustrated with slow forums?
            </p>
          </Card>

          {/* Right Column (The Solution) */}
          <Card className="bg-gradient-to-br from-cyan-900/60 to-green-900/60 border-green-500/30 backdrop-blur-xl p-8 flex flex-col items-center text-center">
            <div className="w-48 h-48 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full flex items-center justify-center opacity-80">
              {/* Placeholder for a visual element of a solved problem */}
              <p className="text-black text-sm font-semibold">
                Platform UI mockup with a solution
              </p>
            </div>
            <h2 className="text-3xl font-bold mt-8">
              Get direct help from peers.
            </h2>
            <p className="text-lg text-gray-300 mt-2">
              Every question is an opportunity to learn and be rewarded.
            </p>
          </Card>
        </section>

        {/* --- "How It Works" Section --- */}
        <section className="py-20 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <Card className="bg-black/50 border-cyan-500/20 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold mt-4">Ask</h3>
              <p className="text-gray-400 mt-2">
                Post your question in any subject.
              </p>
            </Card>
            <Card className="bg-black/50 border-cyan-500/20 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold mt-4">Answer</h3>
              <p className="text-gray-400 mt-2">
                Get high-quality responses from peers and experts.
              </p>
            </Card>
            <Card className="bg-black/50 border-cyan-500/20 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold mt-4">Reward</h3>
              <p className="text-gray-400 mt-2">
                Upvote the best answer and earn credits for your contributions.
              </p>
            </Card>
          </div>
        </section>

        {/* --- Call to Action (CTA) Section --- */}
        <section className="text-center py-20">
          <h2 className="text-3xl font-bold">
            Ready to get your first answer?
          </h2>
          <Link to="/auth">
            <Button className="mt-8 text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold transition-all">
              Get Your First Answer
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

export default IntroPage;
