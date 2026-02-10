import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token, kick them back to Login
    return <Navigate to="/" />;
  }

  // If token exists, let them pass
  return <>{children}</>;
};

export default ProtectedRoute;
