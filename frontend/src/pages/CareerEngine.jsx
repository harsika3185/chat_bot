import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Compass, 
  HelpCircle,
  AlertCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Card from '../components/Card';

const CareerEngine = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await api.get('/career/recommendations');
      if (res.data.success && res.data.plan) {
        setRecommendations(res.data.plan.recommendations || []);
      }
    } catch (err) {
      console.error('Error fetching career recommendations:', err);
      setErrorMsg('Failed to load existing recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user?.profile?.degree && !user?.profile?.careerGoal) {
      setErrorMsg('Please complete your basic profile fields first so we can analyze matching roles!');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await api.post('/career/recommendations');
      if (res.data.success && res.data.plan) {
        setRecommendations(res.data.plan.recommendations || []);
      }
    } catch (err) {
      console.error('Error generating career matches:', err);
      setErrorMsg(err.response?.data?.message || 'Could not generate career paths. Please check setup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">AI Career Match Engine</h1>
          <p className="mt-1.5 text-zinc-400 text-sm max-w-2xl">
            Evaluate your educational credentials, practical skills, and interests against global hiring trends. The engine matches you with suitable career vectors.
          </p>
        </div>
        
        {/* On-demand rebuild button */}
        {recommendations.length > 0 && (
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-300 bg-transparent border border-zinc-800 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Re-run Profile Analysis</span>
            )}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-950/20 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-205">{errorMsg}</p>
        </div>
      )}

      {isLoading && recommendations.length === 0 ? (
        /* Large skeleton loader */
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-450 animate-pulse font-medium">Running cognitive matching scans on your profile...</p>
        </div>
      ) : recommendations.length === 0 ? (
        /* Empty Welcome Card */
        <Card className="py-16 text-center max-w-2xl mx-auto">
          <Compass className="h-12 w-12 text-zinc-650 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Analyze Your Professional Vector</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
            Our match engine links your skillset profile to emerging market positions. Complete your degree, goal statement, and tags on the Profile page to begin.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/profile"
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-300 bg-transparent border border-zinc-800 hover:bg-zinc-900 transition-all"
            >
              Verify Profile Fields
            </Link>
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              Trigger AI Career Matching
            </button>
          </div>
        </Card>
      ) : (
        /* Recommendations List */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => {
            return (
              <Card 
                key={index}
                className="flex flex-col h-full hover:border-zinc-700 transition-all duration-200"
                hoverEffect
              >
                {/* Ranking Badge */}
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[10px] bg-zinc-950 text-zinc-450 px-2.5 py-0.5 rounded border border-zinc-800 font-mono uppercase tracking-wider">
                    Match Rank #{index + 1}
                  </span>
                  <Briefcase className="h-4.5 w-4.5 text-zinc-500" />
                </div>

                {/* Job Title */}
                <h3 className="text-lg font-semibold text-zinc-100 mb-3 tracking-tight">{rec.title}</h3>

                {/* Suitability reason */}
                <div className="mb-5 flex-1">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2 flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Why it matches</span>
                  </p>
                  <p className="text-xs text-zinc-350 leading-relaxed">
                    {rec.suitabilityReason}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-850">
                  {/* Salary info */}
                  <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-zinc-950/40 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span>Est. Salary</span>
                    </span>
                    <span className="font-bold text-indigo-400 font-mono">{rec.salaryRange}</span>
                  </div>

                  {/* Growth info */}
                  <div className="text-xs">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span>Growth & Market Outlook</span>
                    </span>
                    <p className="text-zinc-450 leading-relaxed font-medium">
                      {rec.growthOpportunities}
                    </p>
                  </div>
                </div>

                {/* Setup roadmap shortcut */}
                <div className="mt-6 pt-4 border-t border-zinc-850">
                  <Link
                    to={`/roadmaps?target=${encodeURIComponent(rec.title)}`}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-semibold group"
                  >
                    <span>Generate Learning Roadmap</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CareerEngine;
