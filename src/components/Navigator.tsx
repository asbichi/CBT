import React from 'react';
import { Question, AnswerStatus } from '../types';
import { List, CheckCircle2, Circle, AlertCircle, FileText } from 'lucide-react';

interface NavigatorProps {
  questions: Question[];
  currentQuestionIndex: number;
  examStatus: Record<string, AnswerStatus>;
  onNavigate: (index: number) => void;
  isPanelOpen: boolean;
  togglePanel: () => void;
  onViewSummary?: () => void;
}

export const Navigator: React.FC<NavigatorProps> = ({
  questions,
  currentQuestionIndex,
  examStatus,
  onNavigate,
  isPanelOpen,
  togglePanel,
  onViewSummary
}) => {
  
  const getStatusColor = (status: AnswerStatus) => {
    switch(status) {
        case 'answered': return 'bg-green-500 text-white border-green-600';
        case 'marked-for-review': return 'bg-orange-400 text-white border-orange-500';
        case 'unanswered': return 'bg-primary-500 text-white border-primary-600';
        case 'not-visited': default: return 'bg-white text-slate-600 border-slate-300 hover:border-slate-400';
    }
  };

  const answeredCount = Object.values(examStatus).filter(s => s === 'answered').length;
  const markedCount = Object.values(examStatus).filter(s => s === 'marked-for-review').length;
  const unansweredCount = questions.length - answeredCount - markedCount; // Unanswered or not visited yet but technically "unanswered" overall

  return (
    <>
        {/* Mobile Toggle Overlay Background */}
        {isPanelOpen && (
            <div 
                className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden" 
                onClick={togglePanel}
            />
        )}

        {/* Panel */}
        <aside className={`fixed lg:relative inset-y-0 right-0 z-40 w-80 bg-slate-50 border-l border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-slate-800 flex items-center">
                    <List className="w-5 h-5 mr-2 text-slate-500" />
                    Question Matrix
                </h3>
                <button 
                  className="lg:hidden p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded"
                  onClick={togglePanel}
                >
                    <List className="w-5 h-5" />
                </button>
            </div>

            {/* Legend / Stats */}
            <div className="p-4 border-b border-slate-200 bg-white shrink-0 grid grid-cols-2 gap-3 text-xs">
                 <div className="flex items-center text-slate-600">
                     <span className="w-3 h-3 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                     Answered ({answeredCount})
                 </div>
                 <div className="flex items-center text-slate-600">
                     <span className="w-3 h-3 rounded-full bg-orange-400 mr-2 flex-shrink-0"></span>
                     Review ({markedCount})
                 </div>
                 <div className="flex items-center text-slate-600">
                     <span className="w-3 h-3 rounded-full bg-primary-500 mr-2 flex-shrink-0"></span>
                     Unanswered ({unansweredCount})
                 </div>
                 <div className="flex items-center text-slate-600">
                     <span className="w-3 h-3 rounded-full bg-white border border-slate-300 mr-2 flex-shrink-0"></span>
                     Not Visited
                 </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
               <div className="grid grid-cols-5 gap-2">
                   {questions.map((q, i) => {
                       const status = examStatus[q.id] || 'not-visited';
                       const isActive = currentQuestionIndex === i;
                       return (
                           <button
                             key={q.id}
                             onClick={() => {
                                 onNavigate(i);
                                 if (window.innerWidth < 1024) togglePanel(); // close on mobile
                             }}
                             className={`
                                h-10 rounded-md text-sm font-medium border flex items-center justify-center transition-all
                                ${getStatusColor(status)}
                                ${isActive ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
                                ${status === 'not-visited' && !isActive ? 'shadow-sm' : ''}
                             `}
                           >
                               {i + 1}
                           </button>
                       );
                   })}
               </div>
            </div>

            {onViewSummary && (
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <button
                        onClick={onViewSummary}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-blue-200 shadow-sm"
                        id="nav-view-summary-btn"
                    >
                        <FileText className="w-4.5 h-4.5" />
                        View Full Exam Summary
                    </button>
                </div>
            )}

            {/* Mobile Toggle Button (Attached to side) */}
             <button 
                onClick={togglePanel}
                className={`lg:hidden fixed top-1/2 -left-12 -translate-y-1/2 bg-white border border-slate-200 border-r-0 rounded-l-lg p-2 shadow-sm text-slate-500 hover:text-slate-700 transition-transform ${isPanelOpen ? 'translate-x-full opacity-0 pointer-events-none' : ''}`}
            >
                <List className="w-6 h-6" />
            </button>

        </aside>
    </>
  );
};
