import React from 'react';
import { ShieldCheck, Monitor, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { CandidateInfo } from '../types';

interface DashboardProps {
  candidate: CandidateInfo;
  onStart: () => void;
  examDuration: number;
  totalQuestions: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ candidate, onStart, examDuration, totalQuestions }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-blue-800 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex justify-start items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full p-1 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                    src="https://i.ibb.co/XfdCjdnM/294463932-545722830683545-9019441332151319432-n.jpg" 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-primary-500">{candidate.examTitle}</h1>
              <p className="text-blue-200 mt-1">{candidate.subject}</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-700">
            <p className="text-sm text-blue-200">Candidate ID</p>
            <p className="font-mono font-medium">{candidate.id}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Welcome, {candidate.name}</h2>
            <p className="text-slate-600">Please review your examination details and instructions before proceeding.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             {/* Details Card */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
                <h3 className="flex items-center text-slate-800 font-semibold mb-4 pb-2 border-b border-slate-200">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Examination Details
                </h3>
                <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="font-medium">{examDuration / 60} Minutes</span>
                    </li>
                    <li className="flex justify-between">
                        <span className="text-slate-500">Total Questions:</span>
                        <span className="font-medium">{totalQuestions}</span>
                    </li>
                    <li className="flex justify-between">
                        <span className="text-slate-500">Passing Score:</span>
                        <span className="font-medium">60%</span>
                    </li>
                </ul>
            </div>

             {/* System Status Card */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
                 <h3 className="flex items-center text-slate-800 font-semibold mb-4 pb-2 border-b border-slate-200">
                    <Monitor className="w-5 h-5 mr-2 text-blue-600" />
                    System Check
                </h3>
                <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Network Connection Stable
                    </li>
                    <li className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Browser Compatibility Verified
                    </li>
                    <li className="flex items-center text-orange-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Lockdown Mode Ready
                    </li>
                </ul>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
            <h3 className="flex items-center text-blue-800 font-semibold mb-3">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Security Instructions
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-900/80">
                <li>This exam is proctored in strict lockdown mode.</li>
                <li>Do not exit full-screen mode once the exam begins.</li>
                <li>Switching tabs or applications will be logged as a security violation.</li>
                <li>Copying, pasting, and right-clicking are strictly disabled.</li>
                <li>Ensure you are in a quiet environment before starting.</li>
            </ul>
          </div>

          {/* Action */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-200">
            <div className="text-sm font-medium text-slate-500 mb-4 sm:mb-0 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Timer starts immediately upon entry
            </div>
            <button 
                onClick={onStart}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors focus:ring-4 focus:ring-blue-100 flex items-center justify-center"
            >
                Start Examination
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
