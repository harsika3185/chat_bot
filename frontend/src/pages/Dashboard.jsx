import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  ArrowRight, 
  Briefcase, 
  Compass, 
  Terminal, 
  BookOpen, 
  CheckCircle,
  FileCheck 
} from 'lucide-react';
import Card from '../components/Card';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch recommendations
        const recRes = await api.get('/career/recommendations');
        if (recRes.data.success && recRes.data.plan) {
          setRecommendations(recRes.data.plan.recommendations || []);
        }

        // Fetch active roadmap (contains skill gap)
        const roadRes = await api.get('/career/roadmap');
        if (roadRes.data.success && roadRes.data.roadmap) {
          setRoadmap(roadRes.data.roadmap);
        }

        // Fetch recent chats
        const chatRes = await api.get('/chat/sessions');
        if (chatRes.data.success) {
          setSessions(chatRes.data.sessions.slice(0, 3) || []); // Get top 3
        }
      } catch (error) {
        console.error('Error fetching dashboard details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Calculate dynamic Profile Readiness score out of 100
  const calculateCareerScore = () => {
    if (!user) return 0;
    let score = 20; // Base profile creation score
    
    const profile = user.profile || {};
    if (profile.degree) score += 10;
    if (profile.department) score += 10;
    if (profile.currentYear) score += 10;
    if (profile.careerGoal) score += 20;
    
    // Skills contribution (up to 20 points)
    if (profile.skills && profile.skills.length > 0) {
      score += Math.min(20, profile.skills.length * 4);
    }
    
    // Recommendations / Roadmap contribution (up to 10 points)
    if (recommendations.length > 0) score += 5;
    if (roadmap) score += 5;

    return score;
  };

  const careerScore = calculateCareerScore();

  // Format skill gap data for Recharts Bar Chart
  const getSkillGapChartData = () => {
    if (!roadmap || !roadmap.skillGap) {
      // Default placeholder data
      return [
        { name: 'Languages', Have: 2, Needed: 3 },
        { name: 'Frameworks', Have: 1, Needed: 4 },
        { name: 'Databases', Have: 1, Needed: 2 },
        { name: 'DevOps', Have: 0, Needed: 2 },
        { name: 'Soft Skills', Have: 3, Needed: 4 },
      ];
    }

    const { existingSkills = [], missingSkills = [] } = roadmap.skillGap;
    
    return [
      { name: 'Existing Skills', count: existingSkills.length },
      { name: 'Required Missing', count: missingSkills.length },
    ];
  };

  const chartData = getSkillGapChartData();

  // Create a new chat session and navigate
  const handleStartNewChat = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'Career Advising Session' });
      if (res.data.success) {
        navigate(`/chat?session=${res.data.session._id}`);
      }
    } catch (err) {
      console.error('Error creating chat session:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-1 text-zinc-400 text-sm">
            {user?.profile?.careerGoal 
              ? `Working towards: ${user.profile.careerGoal}` 
              : 'Configure your career goal in your Profile to unlock personal roadmaps!'}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/profile"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 bg-transparent border border-zinc-800 hover:bg-zinc-900 transition-all"
          >
            Update Profile
          </Link>
          <button
            onClick={handleStartNewChat}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-zinc-50 hover:text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Consult AI</span>
          </button>
        </div>
      </div>

      {/* Core Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Dynamic Readiness Score */}
        <div className="lg:col-span-1 space-y-6">
          {/* Career Readiness horizontal bar */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Trophy className="h-4.5 w-4.5 text-indigo-400" />
              <span>Career Readiness</span>
            </h2>

            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completion Index</span>
                <span className="text-2xl font-bold text-zinc-100">{careerScore}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${careerScore}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Your index is calculated from profile details, registered skill counts, and curated career path mappings.
            </p>

            {careerScore < 80 && (
              <Link 
                to="/profile" 
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
              >
                <span>Complete profile requirements</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </Card>

          {/* Quick Shortcuts */}
          <Card>
            <h3 className="text-sm font-semibold text-zinc-200 mb-4 uppercase tracking-wider">Navigation</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link
                to="/chat"
                className="flex flex-col justify-between p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <span className="block font-semibold text-zinc-200 text-xs uppercase tracking-wider">AI Advisor</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">Interactive chat</span>
                </div>
              </Link>
              <Link
                to="/recommendations"
                className="flex flex-col justify-between p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <span className="block font-semibold text-zinc-200 text-xs uppercase tracking-wider">Career Match</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">AI role matching</span>
                </div>
              </Link>
              <Link
                to="/roadmaps"
                className="flex flex-col justify-between p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <span className="block font-semibold text-zinc-200 text-xs uppercase tracking-wider">Roadmaps</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">Study timelines</span>
                </div>
              </Link>
              <Link
                to="/resume"
                className="flex flex-col justify-between p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <FileCheck className="h-4.5 w-4.5 text-indigo-400" />
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div>
                  <span className="block font-semibold text-zinc-200 text-xs uppercase tracking-wider">ATS Scan</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">Resume check</span>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Skill Progress and Job Matches */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Skill Gap Chart */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
                <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                <span>Skill Progress Gap</span>
              </h2>
              {roadmap && (
                <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded uppercase tracking-wider">
                  {roadmap.targetCareer}
                </span>
              )}
            </div>

            {roadmap ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#18181b', opacity: 0.5 }}
                      contentStyle={{
                        background: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#f4f4f5',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 w-full">
                {/* Fallback chart representing Have/Needed styled cleanly with single color/gray bars */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#18181b', opacity: 0.5 }}
                      contentStyle={{
                        background: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#f4f4f5',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="Have" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Needed" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Core Matches & Chats list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recommended Career Roles */}
            <Card>
              <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 uppercase tracking-wider">
                <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                <span>Recommended Roles</span>
              </h2>

              {recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200">{rec.title}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">High Growth</p>
                      </div>
                      <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded font-mono">
                        {rec.salaryRange}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 text-center">
                    <Link
                      to="/recommendations"
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 group"
                    >
                      <span>Explore details</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-lg bg-zinc-900/10">
                  <p className="text-xs text-zinc-500 italic mb-3">No career matches generated yet</p>
                  <Link
                    to="/recommendations"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
                  >
                    Match Career
                  </Link>
                </div>
              )}
            </Card>

            {/* Recent Conversations */}
            <Card>
              <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3 uppercase tracking-wider">
                <MessageSquare className="h-4.5 w-4.5 text-indigo-400" />
                <span>Recent Advisor Chats</span>
              </h2>

              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <Link
                      key={session._id}
                      to={`/chat?session=${session._id}`}
                      className="block p-3 rounded-lg bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
                    >
                      <p className="font-semibold text-zinc-200 truncate">{session.title}</p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">
                        Updated {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                  <div className="pt-3 text-center">
                    <Link
                      to="/chat"
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 group"
                    >
                      <span>View all sessions</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-lg bg-zinc-900/10">
                  <p className="text-xs text-zinc-500 italic mb-3">No chat history found</p>
                  <button
                    onClick={handleStartNewChat}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
                  >
                    Start Chat Session
                  </button>
                </div>
              )}
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
