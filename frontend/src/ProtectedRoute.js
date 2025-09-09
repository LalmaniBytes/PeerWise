import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ children }) {
  const { user, needsGoogleVerify } = useAuth();

  // If the user is not authenticated or needs to verify their email,
  // redirect them to the auth page.
  if (!user || needsGoogleVerify) {
    return <Navigate to="/auth" replace />;
  }

  // Otherwise, render the children (the DashboardPage).
  return children;
}

export default ProtectedRoute;
