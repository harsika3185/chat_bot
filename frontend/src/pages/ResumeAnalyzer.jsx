import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BarChart, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import Card from '../components/Card';

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/resume/history');
      if (res.data.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching resume history:', err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg('');
    setSuccessMsg('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== 'application/pdf') {
        setErrorMsg('Only PDF resumes are supported');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setErrorMsg('Only PDF resumes are supported');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resume/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setAnalysis(res.data.analysis);
        setSuccessMsg('Resume parsed and analyzed successfully!');
        setFile(null);
        fetchHistory(); // Refresh history
      }
    } catch (err) {
      console.error('Error uploading/analyzing resume:', err);
      setErrorMsg(err.response?.data?.message || 'Resume upload failed. Make sure server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for scoring colors
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/20 bg-amber-950/10';
    return 'text-red-400 border-red-500/20 bg-red-950/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">ATS Resume Analyzer</h1>
        <p className="mt-1.5 text-zinc-400 text-sm max-w-xl">
          Upload your resume in PDF format. Our algorithm scans the layout, scores the document, and evaluates missing terms for:{' '}
          <strong className="text-indigo-400">"{user?.profile?.careerGoal || 'Software Engineer'}"</strong>.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-205">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-950/20 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">{errorMsg}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload & History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Drag & Drop Upload */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-205 mb-4 flex items-center gap-2 pb-3 border-b border-zinc-800 uppercase tracking-wider">
              <Upload className="h-4.5 w-4.5 text-indigo-400" />
              <span>Upload PDF Document</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-zinc-800 bg-zinc-900/10 hover:border-zinc-700'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />

                {!file ? (
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="h-8 w-8 text-zinc-500 mb-3" />
                    <span className="text-xs font-semibold text-zinc-300">Drag & drop resume PDF</span>
                    <span className="text-[11px] text-zinc-500 mt-1">or click to browse files</span>
                    <span className="text-[10px] text-zinc-650 mt-2">Max file size: 5MB</span>
                  </label>
                ) : (
                  <div className="w-full flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-850">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-xs font-semibold text-zinc-300 truncate max-w-[150px]">{file.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Parse and Optimize ATS</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </Card>

          {/* Past Analysis Logs */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2 pb-3 border-b border-zinc-800 uppercase tracking-wider">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              <span>Historical Records</span>
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-zinc-650 italic text-center py-4">No historical records found</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {history.map((record) => (
                  <div
                    key={record._id}
                    onClick={() => setAnalysis(record)}
                    className="p-3 rounded-lg bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-300 truncate max-w-[150px]">{record.fileName}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getScoreColorClass(record.atsScore)}`}>
                      Score: {record.atsScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Analysis Output */}
        <div className="lg:col-span-2 space-y-6">
          {analysis ? (
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-5 mb-6 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Cognitive Parse Results</span>
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-100 leading-tight">Document: {analysis.fileName}</h3>
                </div>

                {/* Score badge circle */}
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border text-xs ${getScoreColorClass(analysis.atsScore)}`}>
                  <BarChart className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <p className="text-[9px] uppercase font-bold tracking-wider opacity-60">ATS Compatibility</p>
                    <p className="text-base font-bold leading-none mt-0.5">{analysis.atsScore} / 100</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Missing Skills */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <span>Identified Skill Gaps</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
                      analysis.missingSkills.map((s, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded text-xs bg-zinc-900 text-zinc-300 border border-zinc-800"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">No missing skills identified!</span>
                    )}
                  </div>
                </div>

                {/* Growth alignment */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>Target Matching</span>
                  </h4>
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-850 flex items-center gap-3 text-xs">
                    <TrendingUp className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Parsing Engine Goal</p>
                      <p className="text-xs text-zinc-300 font-semibold mt-0.5 truncate max-w-[200px]" title={user?.profile?.careerGoal}>
                        {user?.profile?.careerGoal || 'Software Engineer'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions checklist */}
              <div className="pt-6 border-t border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-200 mb-4 uppercase tracking-wider">Actionable Optimization Checklist</h4>
                <div className="space-y-2">
                  {analysis.suggestions && analysis.suggestions.map((suggestion, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-lg bg-zinc-900/10 border border-zinc-850 flex items-start gap-3 hover:bg-zinc-900/20 transition-all text-xs"
                    >
                      <div className="h-5 w-5 rounded bg-zinc-850 text-zinc-400 border border-zinc-800 flex items-center justify-center shrink-0 font-bold font-mono">
                        {idx + 1}
                      </div>
                      <p className="text-zinc-300 leading-relaxed font-medium mt-0.5">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

            </Card>
          ) : (
            /* Upload prompt */
            <div className="py-24 text-center border border-dashed border-zinc-850 rounded-lg bg-zinc-900/10 flex flex-col items-center justify-center px-6">
              <FileText className="h-10 w-10 text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-zinc-200 mb-1 uppercase tracking-wider">ATS Workspace</h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                Perform a new resume analysis or select an historical record to view suggestions.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResumeAnalyzer;
