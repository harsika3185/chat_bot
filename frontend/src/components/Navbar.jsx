import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  LayoutDashboard, 
  MessageSquare, 
  Briefcase, 
  Map, 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const Navbar = () => {
  const { token, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Advisor', path: '/chat', icon: MessageSquare },
    { name: 'Career Match', path: '/recommendations', icon: Briefcase },
    { name: 'Roadmaps', path: '/roadmaps', icon: Map },
    { name: 'Resume Analyzer', path: '/resume', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (!token) return null; // Hide navbar on login/signup screens

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-zinc-100 font-bold text-sm tracking-tight hover:text-white transition-colors group">
              <Compass className="h-4.5 w-4.5 text-indigo-500 group-hover:rotate-45 transition-transform duration-300" />
              <span>Career<span className="text-indigo-400">Compass</span></span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active 
                      ? 'bg-zinc-900 text-zinc-50 border border-zinc-800' 
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Status / Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">User</p>
              <p className="text-xs text-zinc-300 font-semibold">{user?.name || 'User'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-transparent border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-medium cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-500" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active 
                      ? 'bg-zinc-900 text-zinc-50 border border-zinc-800' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <div className="border-t border-zinc-800 my-2 pt-2 px-3 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">User</p>
                <p className="text-xs text-zinc-300 font-semibold">{user?.name || 'User'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-transparent border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-xs font-medium cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-zinc-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
