import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  GraduationCap, 
  Building, 
  Calendar, 
  Terminal, 
  Heart, 
  Target, 
  Save, 
  Plus, 
  X, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import Card from '../components/Card';

const Profile = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [degree, setDegree] = useState('');
  const [department, setDepartment] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  
  // Skills list state
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  // Interests list state
  const [areasOfInterest, setAreasOfInterest] = useState([]);
  const [interestInput, setInterestInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load user profile details into local state
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      const profile = user.profile || {};
      setDegree(profile.degree || '');
      setDepartment(profile.department || '');
      setCurrentYear(profile.currentYear || '');
      setCareerGoal(profile.careerGoal || '');
      setSkills(profile.skills || []);
      setAreasOfInterest(profile.areasOfInterest || []);
    }
  }, [user]);

  // Skill Add/Remove handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (indexToRemove) => {
    setSkills(skills.filter((_, index) => index !== indexToRemove));
  };

  // Interest Add/Remove handlers
  const handleAddInterest = (e) => {
    e.preventDefault();
    if (interestInput.trim() && !areasOfInterest.includes(interestInput.trim())) {
      setAreasOfInterest([...areasOfInterest, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (indexToRemove) => {
    setAreasOfInterest(areasOfInterest.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await updateProfile({
        name,
        degree,
        department,
        currentYear,
        skills,
        areasOfInterest,
        careerGoal,
      });

      if (res && res.success) {
        setSuccessMsg('Profile updated successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">User Profile Configuration</h1>
        <p className="mt-1.5 text-zinc-400 text-sm">
          Define your educational background, active skills, and interests to align the AI recommendation engine.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-200">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-950/20 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-200">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <Card>
          <h2 className="text-sm font-semibold text-zinc-200 mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
            <User className="h-4.5 w-4.5 text-indigo-400" />
            <span>Personal & Academic Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-zinc-600" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="saas-input block w-full pl-10"
                  placeholder="Your Full Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Degree / Qualification</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-4 w-4 text-zinc-600" />
                </div>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="saas-input block w-full pl-10"
                  placeholder="e.g. Bachelor of Science"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Department / Major</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-zinc-600" />
                </div>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="saas-input block w-full pl-10"
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Current Year of Study</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-zinc-600" />
                </div>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="saas-select block w-full pl-10 cursor-pointer"
                >
                  <option value="" disabled className="bg-zinc-900">Select Year</option>
                  <option value="1st Year" className="bg-zinc-900">1st Year</option>
                  <option value="2nd Year" className="bg-zinc-900">2nd Year</option>
                  <option value="3rd Year" className="bg-zinc-900">3rd Year</option>
                  <option value="4th Year" className="bg-zinc-900">4th Year</option>
                  <option value="Graduated" className="bg-zinc-900">Graduated / Working</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Skills & Interests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Terminal className="h-4.5 w-4.5 text-indigo-400" />
              <span>Technical & Professional Skills</span>
            </h2>

            {/* Input tag */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                className="saas-input flex-1"
                placeholder="e.g. ReactJS, Python, SQL"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all flex items-center justify-center cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tags view */}
            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {skills.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No skills listed yet. Add some above.</p>
              ) : (
                skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Heart className="h-4.5 w-4.5 text-indigo-400" />
              <span>Areas of Interest</span>
            </h2>

            {/* Input tag */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddInterest(e)}
                className="saas-input flex-1"
                placeholder="e.g. AI, Web Development, CyberSec"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-3 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all flex items-center justify-center cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tags view */}
            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {areasOfInterest.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No interests listed yet. Add some above.</p>
              ) : (
                areasOfInterest.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(index)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Section 3: Goal Statement */}
        <Card>
          <h2 className="text-sm font-semibold text-zinc-200 mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
            <Target className="h-4.5 w-4.5 text-indigo-400" />
            <span>Target Career Goal</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">What is your ultimate career goal?</label>
            <input
              type="text"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              className="saas-input block w-full"
              placeholder="e.g. Fullstack Software Engineer at Google, Machine Learning Specialist, Product Designer"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Be specific! The roadmap engine, course curator, and resume optimizer rely on this description.
            </p>
          </div>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
