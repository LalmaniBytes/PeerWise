import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

function CreateThreadDialog({ onThreadCreated }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/threads`, formData);
      toast.success("Problem posted! The community will help you soon! 🚀");
      setFormData({ title: '', description: '' });
      setOpen(false);
      onThreadCreated();
    } catch (error) {
      toast.error("Failed to create thread");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Ask for Help
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/95 border-cyan-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            What problem can we help you solve?
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Describe your problem clearly and the community will provide video solutions!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Problem title..." name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500" required />
          <Textarea placeholder="Describe your problem in detail..." name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 min-h-[120px]" required />
          <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold">
            Post Problem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CreateThreadDialog };