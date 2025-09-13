import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

function AuthForm() {
  const {
    login,
    register,
    needsGoogleVerify,
    setNeedsGoogleVerify,
    setUser,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    realName: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail , setPendingEmail] = useState(null)

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const response = await axios.post(`${API_URL}/verify-google`, {
        token,
        email: pendingEmail,
      });

      const { token: authToken, user: verifiedUser } = response.data;

      localStorage.setItem("token", authToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      setUser(verifiedUser);

      setNeedsGoogleVerify(false);
      setPendingEmail(null);

      navigate("/profile");
      toast.success("Google verification successful! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google login failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      try {
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate("/threads");
        }
      } catch (error) {
        if (
          error.response?.data?.detail ===
          "Please verify your Gmail to complete registration."
        ) {
          setPendingEmail(formData.email);
          setNeedsGoogleVerify(true);
          toast.info("Please verify your Gmail to complete registration.");
        } else {
          toast.error(error.response?.data?.detail || "Login failed");
        }
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match. Please try again.");
        return;
      }

      try {
        await register(
          formData.username,
          formData.email,
          formData.password,
          formData.realName
        );

        setPendingEmail(formData.email);
        setNeedsGoogleVerify(true);
        toast.success("Registration successful. Please verify with Google.");
      } catch (error) {
        const msg = error.response?.data?.detail;

        if (msg === "Registration already pending for this email.") {
          setPendingEmail(formData.email);
          setNeedsGoogleVerify(true);
          toast.info("Email is pending verification. Please complete it.");
        } else {
          toast.error(msg || "Registration failed");
        }
      }
    }
  };

  const handleCancelPending = async () => {
    try {
      await axios.delete(`${API_URL}/cancel-pending/${pendingEmail}`);
      toast.info("Registration canceled.");
    } catch (err) {
      toast.error("Failed to cancel registration.");
    }

    logout();
    setFormData({
      email: "",
      password: "",
      username: "",
      realName: "",
      confirmPassword: "",
    });
    setNeedsGoogleVerify(false);
    setPendingEmail(null);
  };

  if (needsGoogleVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="p-8 bg-black/80 text-center border-cyan-500/30 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Verify Your Gmail</h2>
          <p className="mb-6">
            Verifying Gmail for{" "}
            <span className="font-semibold">{pendingEmail}</span>
          </p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google login failed")}
          />
          <Button
            onClick={handleCancelPending}
            variant="outline"
            className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 mt-4"
          >
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent)]"></div>
      </div>
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
          </div>
        ))}
      </div>
      <Card className="w-full max-w-md bg-black/80 border-cyan-500/30 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            PeerWise
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin
              ? "Welcome back to the future of problem solving"
              : "Join the revolution of peer learning"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <Input
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                  required
                />
                <Input
                  name="realName"
                  type="text"
                  placeholder="Real Name"
                  value={formData.realName}
                  onChange={(e) =>
                    setFormData({ ...formData, realName: e.target.value })
                  }
                  className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                />
              </div>
            )}
            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                required
              />
            </div>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-1 text-gray-500 hover:text-cyan-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isLogin && (
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 text-gray-500 hover:text-cyan-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black font-semibold"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { AuthForm };
