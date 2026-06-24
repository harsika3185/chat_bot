import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { 
  Map, 
  Terminal, 
  BookOpen, 
  Award, 
  Play, 
  Compass, 
  Check, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Zap
} from 'lucide-react';
import Card from '../components/Card';

// Reusable Markdown parser for roadmap descriptions
const MarkdownContent = ({ content }) => {
  const parseMarkdown = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    return lines.map((line, j) => {
      let trimmed = line.trim();
      
      if (trimmed.startsWith('### ')) {
        return <h4 key={j} className="text-sm font-bold text-zinc-100 mt-4 mb-2">{trimmed.substring(4)}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={j} className="text-base font-semibold text-zinc-100 mt-4 mb-2">{trimmed.substring(3)}</h3>;
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <ul key={j} className="list-disc pl-5 my-1 text-zinc-300 text-sm">
            <li>{parseInlineMarkdown(trimmed.substring(2))}</li>
          </ul>
        );
      }
      if (trimmed === '') {
        return <div key={j} className="h-1.5" />;
      }
      return <p key={j} className="text-sm text-zinc-300 my-1 leading-relaxed">{parseInlineMarkdown(line)}</p>;
    });
  };

  const parseInlineMarkdown = (lineText) => {
    const parts = lineText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, k) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={k} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      const inlineCode = part.split(/(`.*?`)/g);
      return inlineCode.map((sub, m) => {
        if (sub.startsWith('`') && sub.endsWith('`')) {
          return <code key={`${k}-${m}`} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-indigo-400 font-mono">{sub.slice(1, -1)}</code>;
        }
        return sub;
      });
    });
  };

  return <div className="space-y-1">{parseMarkdown(content)}</div>;
};

const Roadmaps = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetFromQuery = searchParams.get('target');

  const [targetCareer, setTargetCareer] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('30days'); // 30days, 90days, 6months

  useEffect(() => {
    if (targetFromQuery) {
      setTargetCareer(targetFromQuery);
      handleGenerate(targetFromQuery);
    } else {
      fetchActiveRoadmap();
    }
  }, [targetFromQuery]);

  const fetchActiveRoadmap = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await api.get('/career/roadmap');
      if (res.data.success && res.data.roadmap) {
        setRoadmap(res.data.roadmap);
        setTargetCareer(res.data.roadmap.targetCareer);
      }
    } catch (err) {
      console.error('Error fetching active roadmap:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (forcedTarget) => {
    const target = forcedTarget || targetCareer;
    if (!target.trim()) {
      setErrorMsg('Please specify a target career path');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await api.post('/career/roadmap', { targetCareer: target });
      if (res.data.success) {
        setRoadmap(res.data.roadmap);
      }
    } catch (err) {
      console.error('Error compiling learning roadmap:', err);
      setErrorMsg(err.response?.data?.message || 'Could not generate roadmap. Please check configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Header & Goal Form */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Personalized Study Roadmaps</h1>
          <p className="mt-1.5 text-zinc-400 text-sm max-w-xl">
            Bridge your skill gaps with a custom study curriculum structured across 30, 90, and 180-day phases.
          </p>
        </div>

        {/* Dynamic target input */}
        <div className="w-full md:w-auto flex gap-2">
          <input
            type="text"
            value={targetCareer}
            onChange={(e) => setTargetCareer(e.target.value)}
            className="saas-input min-w-[240px] flex-1 md:flex-none"
            placeholder="Enter Target Career (e.g. DevOps Engineer)"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer whitespace-nowrap"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Create Roadmap</span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-950/20 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">{errorMsg}</p>
        </div>
      )}

      {isLoading && !roadmap ? (
        /* Loader state */
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-450 animate-pulse font-medium">Drafting skill mappings & matching online course channels...</p>
        </div>
      ) : !roadmap ? (
        /* Empty State */
        <Card className="py-16 text-center max-w-2xl mx-auto">
          <Compass className="h-12 w-12 text-zinc-650 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Build Your Study Timeline</h2>
          <p className="text-xs text-zinc-405 max-w-md mx-auto mb-8 leading-relaxed">
            Specify a target career (like *Frontend Engineer* or *Data Scientist*) in the bar above to receive a full study curriculum and gap analysis.
          </p>
          <div className="flex justify-center">
            {user?.profile?.careerGoal ? (
              <button
                onClick={() => {
                  setTargetCareer(user.profile.careerGoal);
                  handleGenerate(user.profile.careerGoal);
                }}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Generate for current profile: "{user.profile.careerGoal}"</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to="/profile"
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-300 bg-transparent border border-zinc-800 hover:bg-zinc-900 transition-all"
              >
                Configure Career Profile
              </Link>
            )}
          </div>
        </Card>
      ) : (
        /* Full Roadmap Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Skill Gap Analysis Box (Left) */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-sm font-semibold text-zinc-200 mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
                <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                <span>Skill Gap Analysis</span>
              </h2>

              <div className="space-y-6">
                {/* Existing Skills */}
                <div>
                  <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Existing Skills</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.skillGap?.existingSkills && roadmap.skillGap.existingSkills.length > 0 ? (
                      roadmap.skillGap.existingSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">None configured in profile</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    <span>Missing Requirements</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.skillGap?.missingSkills && roadmap.skillGap.missingSkills.length > 0 ? (
                      roadmap.skillGap.missingSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">No missing skills identified!</span>
                    )}
                  </div>
                </div>

                {/* Priority Skills to Learn */}
                <div>
                  <h3 className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>High Priority to Learn</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.skillGap?.prioritySkills && roadmap.skillGap.prioritySkills.length > 0 ? (
                      roadmap.skillGap.prioritySkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 text-indigo-400 border border-indigo-950">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">None highlighted</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Course recommendations list */}
            <Card>
              <h2 className="text-sm font-semibold text-zinc-200 mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
                <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                <span>Recommended Courses</span>
              </h2>

              <div className="space-y-3">
                {roadmap.courses && roadmap.courses.map((course, idx) => {
                  const getIcon = () => {
                    if (course.type === 'youtube') return <Play className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />;
                    if (course.type === 'certification') return <Award className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />;
                    return <BookOpen className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />;
                  };

                  return (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-850 flex gap-3 text-xs">
                      {getIcon()}
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 mb-1.5">
                          {course.type}
                        </span>
                        <h4 className="font-semibold text-zinc-200 leading-tight truncate">{course.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{course.provider || 'Self-paced'}</p>
                        {course.link && (
                          <a
                            href={course.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 mt-2.5 cursor-pointer"
                          >
                            <span>Access Resource</span>
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Timelines Workspace (Right, Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timeline selector tabs */}
            <div className="flex border border-zinc-800 p-1 rounded-lg bg-zinc-950 gap-1">
              {[
                { id: '30days', label: '30-Day Plan', desc: 'Fundamentals & quick wins' },
                { id: '90days', label: '90-Day Plan', desc: 'Build core projects' },
                { id: '6months', label: '6-Month Plan', desc: 'Advanced integration' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 rounded-md transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-105'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  <span className="text-xs font-semibold">{tab.label}</span>
                  <span className="text-[9px] opacity-60 hidden sm:inline mt-0.5">{tab.desc}</span>
                </button>
              ))}
            </div>

            {/* Selected Phase Detail Card */}
            <Card>
              <div className="mb-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs uppercase text-zinc-500 font-bold tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Timeline Curriculum</span>
                </span>
                <span className="text-xs bg-zinc-950 text-zinc-400 px-3 py-0.5 rounded border border-zinc-850 font-mono">
                  {activeTab === '30days' && 'Days 1 - 30'}
                  {activeTab === '90days' && 'Days 31 - 90'}
                  {activeTab === '6months' && 'Days 91 - 180'}
                </span>
              </div>

              {/* Vertical timeline details */}
              <div className="pl-6 border-l border-zinc-800 relative py-2 space-y-4">
                {/* Visual node pin */}
                <div className="absolute -left-[5px] top-3.5 w-2.5 h-2.5 bg-zinc-950 border border-indigo-500 rounded-full" />
                
                <div className="prose prose-invert max-w-none">
                  {activeTab === '30days' && <MarkdownContent content={roadmap.timeline?.thirtyDays} />}
                  {activeTab === '90days' && <MarkdownContent content={roadmap.timeline?.ninetyDays} />}
                  {activeTab === '6months' && <MarkdownContent content={roadmap.timeline?.sixMonths} />}
                </div>
              </div>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
};

export default Roadmaps;
