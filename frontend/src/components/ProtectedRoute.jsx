import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center relative">
        {/* Glow Effects */}
        <div className="bg-glow-orb w-[300px] h-[300px] bg-accentCyan left-[30%]" />
        <div className="bg-glow-orb w-[300px] h-[300px] bg-accentPurple right-[30%]" />
        
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-accentCyan border-r-accentPurple border-b-accentBlue border-l-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium tracking-wide animate-pulse">Synchronizing Career Compass...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
