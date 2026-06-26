import React from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Eraser, CheckCircle } from 'lucide-react';
import { AnswerStatus } from '../types';

interface FooterControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onMarkReview: () => void;
  onClear: () => void;
  onSubmit: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStatus: AnswerStatus;
}

export const FooterControls: React.FC<FooterControlsProps> = ({
  onPrevious,
  onNext,
  onMarkReview,
  onClear,
  onSubmit,
  isFirst,
  isLast,
  currentStatus
}) => {
  const isMarked = currentStatus === 'marked-for-review';

  return (
    <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex gap-2 w-full sm:w-auto">
              <button 
                  onClick={onClear}
                  className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex-1 sm:flex-none"
              >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
              </button>
              <button 
                  onClick={onMarkReview}
                  className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors flex-1 sm:flex-none ${isMarked ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' : 'text-orange-600 bg-white border-orange-200 hover:bg-orange-50'}`}
              >
                  <Bookmark className={`w-4 h-4 mr-2 ${isMarked ? 'fill-current' : ''}`} />
                  {isMarked ? 'Unmark Review' : 'Mark Review'}
              </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
              <button 
                  onClick={onPrevious}
                  disabled={isFirst}
                  className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
              </button>
              
              {!isLast ? (
                <button 
                    onClick={onNext}
                    className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-1 sm:flex-none"
                >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                 <button 
                    onClick={onSubmit}
                    className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm flex-1 sm:flex-none"
                >
                    Submit Exam
                    <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              )}
          </div>

      </div>
    </div>
  );
};
