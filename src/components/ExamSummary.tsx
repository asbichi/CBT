import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Bookmark, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { Question, AnswerStatus, CandidateInfo } from '../types';

interface ExamSummaryProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  examStatus: Record<string, AnswerStatus>;
  onNavigate: (index: number) => void;
  onReturn: () => void;
  onConfirm: () => void;
  formattedTime: string;
  candidate: CandidateInfo;
}

export const ExamSummary: React.FC<ExamSummaryProps> = ({
  questions,
  answers,
  examStatus,
  onNavigate,
  onReturn,
  onConfirm,
  formattedTime,
  candidate
}) => {
  // Count stats
  const totalQuestions = questions.length;
  const answeredCount = Object.values(examStatus).filter(s => s === 'answered').length;
  const markedCount = Object.values(examStatus).filter(s => s === 'marked-for-review').length;
  const unansweredCount = totalQuestions - answeredCount - markedCount;

  const answeredPercent = Math.round((answeredCount / totalQuestions) * 100) || 0;
  const markedPercent = Math.round((markedCount / totalQuestions) * 100) || 0;
  const unansweredPercent = Math.round((unansweredCount / totalQuestions) * 100) || 0;

  // Group questions by subject
  const subjectGroups: Record<string, { questions: { q: Question; index: number }[]; answered: number; marked: number; unanswered: number }> = {};
  
  questions.forEach((q, index) => {
    const subject = q.subject || 'General';
    if (!subjectGroups[subject]) {
      subjectGroups[subject] = {
        questions: [],
        answered: 0,
        marked: 0,
        unanswered: 0
      };
    }
    
    subjectGroups[subject].questions.push({ q, index });
    
    const status = examStatus[q.id] || 'not-visited';
    if (status === 'answered') {
      subjectGroups[subject].answered++;
    } else if (status === 'marked-for-review') {
      subjectGroups[subject].marked++;
    } else {
      subjectGroups[subject].unanswered++;
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans"
      id="exam-summary-container"
    >
      {/* Top Bar / Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-sm z-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onReturn}
            className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm bg-white"
            id="summary-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Examination Review Summary
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Candidate: <span className="text-slate-700 font-semibold">{candidate.name}</span> ({candidate.id}) • Subject: <span className="text-slate-700 font-semibold">{candidate.subject}</span>
            </p>
          </div>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl shadow-inner shrink-0">
          <Clock className="w-5 h-5 text-slate-600 animate-pulse" />
          <div className="text-right">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining Time</span>
            <span className="font-mono text-lg font-bold text-slate-800">{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Main Review Dashboard Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
        
        {/* Banner Reminder */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Review Before Submitting</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Please examine the status of each question below. You can click on any question card or circle to go directly back to that question in the examination area to review or modify your answer.
              </p>
            </div>
          </div>
          <button 
            onClick={onConfirm}
            className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            id="summary-proceed-btn"
          >
            Submit Final Exam
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Big Key Progress Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Answered */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1.5 bg-green-500 w-full"></div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Attempted</span>
                <span className="p-2 bg-green-50 text-green-600 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{answeredCount}</span>
                <span className="text-slate-400 text-sm">of {totalQuestions} questions</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Completion Status</span>
                <span>{answeredPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${answeredPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Marked for Review */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1.5 bg-orange-400 w-full"></div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Marked for Review</span>
                <span className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                  <Bookmark className="w-5 h-5 fill-current" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{markedCount}</span>
                <span className="text-slate-400 text-sm">of {totalQuestions} questions</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Review Status</span>
                <span>{markedPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-orange-400 h-2 rounded-full transition-all duration-500" style={{ width: `${markedPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Unanswered */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1.5 bg-primary-500 w-full"></div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Unanswered</span>
                <span className="p-2 bg-primary-50 text-primary-500 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800">{unansweredCount}</span>
                <span className="text-slate-400 text-sm">of {totalQuestions} questions</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Unanswered Ratio</span>
                <span>{unansweredPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${unansweredPercent}%` }}></div>
              </div>
            </div>
          </div>

        </div>

        {/* Warning Callout for Unanswered Questions */}
        {unansweredCount > 0 && (
          <div className="flex items-start text-primary-800 bg-primary-50 border border-primary-200 p-4 rounded-xl text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Caution: Unanswered Questions Remaining</p>
              <p className="text-primary-700 mt-1">
                You currently have <strong>{unansweredCount} unanswered questions</strong>. Leaving questions unanswered may negatively impact your final score. We highly advise clicking on any unanswered question below to attempt it.
              </p>
            </div>
          </div>
        )}

        {/* Section: Subject-by-Subject Completion Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Subject-wise Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(subjectGroups).map(([subject, stats]) => {
              const subTotal = stats.questions.length;
              const subAttempted = stats.answered + stats.marked;
              const subPercent = Math.round((subAttempted / subTotal) * 100) || 0;
              return (
                <div key={subject} className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide truncate">{subject}</h3>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="text-2xl font-extrabold text-slate-800">{subAttempted} / {subTotal}</span>
                      <span className="text-xs font-semibold text-slate-500">Attempted</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${subPercent}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span className="text-green-600">Ans: {stats.answered}</span>
                      <span className="text-orange-500">Rev: {stats.marked}</span>
                      <span className="text-primary-500">Unans: {stats.unanswered}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Matrix Review & Fast Navigation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Detailed Question Matrix</h2>
          <p className="text-slate-500 text-sm mb-6">
            Listed below are all questions grouped by subject area. Click any individual question box or card to navigate directly to it and edit your response.
          </p>

          <div className="space-y-8">
            {Object.entries(subjectGroups).map(([subject, data]) => (
              <div key={subject} className="border-t border-slate-100 pt-6 first:border-0 first:pt-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    {subject} 
                    <span className="text-xs font-normal text-slate-400">({data.questions.length} Questions)</span>
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {Math.round(((data.answered + data.marked) / data.questions.length) * 100)}% Complete
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {data.questions.map(({ q, index }) => {
                    const status = examStatus[q.id] || 'not-visited';
                    
                    let statusLabel = 'Unattempted';
                    let statusColorClasses = 'border-slate-200 bg-white text-slate-600 hover:border-slate-300';
                    let statusDotColor = 'bg-slate-300';
                    
                    if (status === 'answered') {
                      statusLabel = 'Attempted';
                      statusColorClasses = 'border-green-200 bg-green-50/40 text-green-800 hover:bg-green-50';
                      statusDotColor = 'bg-green-500';
                    } else if (status === 'marked-for-review') {
                      statusLabel = 'For Review';
                      statusColorClasses = 'border-orange-200 bg-orange-50/40 text-orange-800 hover:bg-orange-50';
                      statusDotColor = 'bg-orange-400';
                    } else if (status === 'unanswered') {
                      statusLabel = 'Unanswered';
                      statusColorClasses = 'border-primary-200 bg-primary-50/40 text-primary-800 hover:bg-primary-50';
                      statusDotColor = 'bg-primary-500';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => onNavigate(index)}
                        className={`p-3 border rounded-xl text-left transition-all duration-200 active:scale-[0.98] ${statusColorClasses} flex flex-col justify-between h-24 shadow-sm group`}
                        id={`summary-q-btn-${index + 1}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-extrabold font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                            Q{index + 1}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${statusDotColor}`}></span>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                            {q.type.toUpperCase()} • {q.points} pt
                          </p>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block truncate">
                            {q.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer sticky bar */}
      <footer className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <button 
            onClick={onReturn}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm active:scale-[0.98]"
            id="summary-footer-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </button>
          
          <button 
            onClick={onConfirm}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-md hover:shadow-lg gap-2"
            id="summary-footer-proceed"
          >
            <CheckCircle className="w-5 h-5" />
            Proceed to Submit Exam
          </button>
        </div>
      </footer>
    </motion.div>
  );
};
