import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ExamStatus } from '../types';

interface SubmissionModalProps {
  examStatus: ExamStatus;
  totalQuestions: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ 
    examStatus, 
    totalQuestions, 
    onConfirm, 
    onCancel 
}) => {
  const answeredCount = Object.values(examStatus).filter(s => s === 'answered').length;
  const markedCount = Object.values(examStatus).filter(s => s === 'marked-for-review').length;
  const unansweredCount = totalQuestions - answeredCount - markedCount; // anything not answered or marked
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Confirm Submission</h2>
          <p className="text-slate-600 text-sm mb-6">
            You are about to submit your examination. Please review your completion status below.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-800">{totalQuestions}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</span>
                </div>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-green-600">{answeredCount}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Answered</span>
                </div>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-orange-500">{markedCount}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Review</span>
                </div>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-primary-500">{unansweredCount}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Unanswered</span>
                </div>
            </div>
          </div>

          {unansweredCount > 0 && (
              <div className="flex items-start text-orange-700 bg-orange-50 p-3 rounded-lg mb-6 text-sm">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>You have <strong>{unansweredCount} unanswered questions</strong>. It is highly recommended to answer all questions before submitting.</p>
              </div>
          )}

        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <button 
                onClick={onCancel}
                className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
                Return to Exam
            </button>
            <button 
                onClick={onConfirm}
                className="px-5 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
            >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Final Answers
            </button>
        </div>
      </motion.div>
    </div>
  );
};
