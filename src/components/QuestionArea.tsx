import React from 'react';
import { Question } from '../types';
import { FormField } from './FormField';

interface QuestionAreaProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  answer: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
}

export const QuestionArea: React.FC<QuestionAreaProps> = ({
  question,
  currentIndex,
  totalQuestions,
  answer,
  onAnswerChange
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      
      {/* Question Header */}
      <div className="mb-8 border-b border-slate-200 pb-4">
          <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100 uppercase tracking-wide">
                      Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  {question.difficulty && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border uppercase tracking-wide
                        ${question.difficulty === 'Beginner' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                        ${question.difficulty === 'Middle Class' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                        ${question.difficulty === 'Professional' ? 'bg-primary-50 text-primary-700 border-primary-100' : ''}
                      `}>
                          {question.difficulty}
                      </span>
                  )}
              </div>
              <span className="text-slate-500 text-sm font-medium">
                  {question.points} {question.points === 1 ? 'Point' : 'Points'}
              </span>
          </div>
          <h2 className="text-2xl font-medium text-slate-800 leading-relaxed font-sans">
              {question.text}
          </h2>
      </div>

      {/* Answer Area */}
      <div className="bg-white p-2">
          <FormField 
            question={question} 
            answer={answer} 
            onAnswerChange={onAnswerChange} 
          />
      </div>

    </div>
  );
};
