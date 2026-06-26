import React, { useState } from 'react';
import { User, Shield, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onStudentLogin: (regNo: string) => Promise<void>;
  onAdminLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onStudentLogin, onAdminLogin }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [regNo, setRegNo] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regNo.trim().length === 0) {
      setError('Please enter a valid Registration Number');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await onStudentLogin(regNo.trim());
    } catch (err: any) {
      setError(err.message || 'Incorrect Registration Number.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === 'Bichi' && adminPass === 'Asbichi12#') {
      onAdminLogin();
      setError('');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden grid lg:grid-cols-2 min-h-[600px] border border-slate-100">
        
        {/* Left Side: Branding / Logo */}
        <div className="bg-primary-700 p-12 flex flex-col items-center justify-center relative overflow-hidden text-center">
            {/* Decorative circles */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-primary-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            
            <div className="relative z-10 w-full max-w-sm">
                <div className="w-32 h-32 bg-white rounded-full p-2 mb-8 mx-auto shadow-2xl ring-4 ring-white/20 overflow-hidden flex items-center justify-center">
                    <img 
                        src="https://i.ibb.co/XfdCjdnM/294463932-545722830683545-9019441332151319432-n.jpg" 
                        alt="Dialogue Institute Logo" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                    Dialogue Institute of Technology & Management
                </h1>
                <p className="text-primary-100 text-lg font-medium opacity-90">
                    Computer Based Testing (CBT) Portal
                </p>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white relative">
            <div className="max-w-md w-full mx-auto">
                <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500">Sign in to access your examination portal.</p>
                </div>
                
                {/* Custom Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                    <button 
                        onClick={() => { setActiveTab('student'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex justify-center items-center ${activeTab === 'student' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <User className="w-4 h-4 mr-2" /> Student
                    </button>
                    <button 
                        onClick={() => { setActiveTab('admin'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex justify-center items-center ${activeTab === 'admin' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield className="w-4 h-4 mr-2" /> Administrator
                    </button>
                </div>

                <div className="min-h-[220px]">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-primary-50 text-primary-600 font-medium border border-primary-100 rounded-xl text-sm flex items-center"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600 mr-2 flex-shrink-0"></div>
                            {error}
                        </motion.div>
                    )}

                    {activeTab === 'student' ? (
                        <motion.form 
                            key="student-form"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleStudentSubmit} 
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Registration Number</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600">
                                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={regNo}
                                        onChange={(e) => setRegNo(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-800 text-sm font-medium placeholder-slate-400 outline-none"
                                        placeholder="e.g. DIT-001"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2 ml-1">Your exact registration number is required to proceed.</p>
                            </div>
                            <button type="submit" disabled={loading} className="w-full relative group mt-2 disabled:opacity-75">
                                <div className="absolute inset-0 bg-primary-600 rounded-xl blur-[8px] opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                                <div className="relative w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center transform group-hover:-translate-y-[1px]">
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Verifying Credentials...
                                        </span>
                                    ) : (
                                        <>Access Examination <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" /></>
                                    )}
                                </div>
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="admin-form"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleAdminSubmit} 
                            className="space-y-5"
                        >
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Username</label>
                                <input 
                                    type="text" 
                                    value={adminUser}
                                    onChange={(e) => setAdminUser(e.target.value)}
                                    className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-800 text-sm font-medium placeholder-slate-400 outline-none"
                                    placeholder="Enter username"
                                    id="admin-username-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                <div className="relative group">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={adminPass}
                                        onChange={(e) => setAdminPass(e.target.value)}
                                        className="block w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-800 text-sm font-medium placeholder-slate-400 outline-none"
                                        placeholder="••••••••"
                                        id="admin-password-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                        id="admin-password-toggle"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center mt-2 shadow-sm shadow-slate-900/20" id="admin-submit-btn">
                                Login as Admin <Shield className="w-5 h-5 ml-2 text-slate-300" />
                            </button>
                        </motion.form>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
