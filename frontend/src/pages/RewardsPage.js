import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Rewards } from '../components/Rewards';
import { RankStore } from '../components/RankStore';
import { Navigation } from '../components/Navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function RewardsPage() {
    const navigate = useNavigate();
    const [rewards, setRewards] = useState([]);
    const { user, fetchProfile } = useAuth();

    useEffect(() => {
        if (user) {
            fetchRewards();
        }
    }, [user]);

    const fetchRewards = async () => {
        try {
            const response = await axios.get(`${API_URL}/rewards`, { withCredentials: true });
            setRewards(response.data);
        } catch (error) {
            console.error('Failed to fetch rewards:', error);
        }
    };

    const handleRewardRedeem = async (rewardId) => {
        try {
            await axios.post(`${API_URL}/rewards/${rewardId}/redeem`, null, { withCredentials: true });
            toast.success("Reward redeemed successfully! 🎉");
            fetchProfile();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to redeem reward");
        }
    };

    const claimRank = async (rank) => {
        try {
            await axios.post(`${API_URL}/profile/claim`, { rank }, { withCredentials: true });
            toast.success(`You claimed ${rank} 🎉`);
            fetchProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to claim rank");
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <Navigation />
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                <Tabs defaultValue="rewards" className="space-y-8">
                    <TabsList className="bg-black/50 border border-cyan-500/20">
                        <TabsTrigger 
                            value="problems" 
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" 
                            onClick={() => navigate("/threads")}
                        >
                            Problems
                        </TabsTrigger>
                        <TabsTrigger 
                            value="rewards" 
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                        >
                            Rewards
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="rewards" className="space-y-8">
                        <Rewards rewards={rewards} user={user} handleRewardRedeem={handleRewardRedeem} />
                        <RankStore user={user} claimRank={claimRank} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default RewardsPage;