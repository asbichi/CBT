import React from 'react';
import { Question } from '../types';

interface FormFieldProps {
  question: Question;
  answer: string | string[];
  onAnswerChange: (ans: string | string[]) => void;
}

export const FormField: React.FC<FormFieldProps> = ({ question, answer, onAnswerChange }) => {
  
  if (question.type === 'mcq' || question.type === 'tf') {
    const currentAnswer = (answer as string) || '';
    return (
      <div className="space-y-4">
        {question.options?.map((option, idx) => {
          const id = `${question.id}-opt-${idx}`;
          const isSelected = currentAnswer === option;
          return (
            <label 
                key={id} 
                htmlFor={id}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                   {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
              </div>
              <input 
                type="radio" 
                id={id}
                name={question.id} 
                value={option}
                checked={isSelected}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="sr-only" // Hidden, handled by custom UI
              />
              <span className={`text-lg transition-colors ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                  {option}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === 'mrx') {
    const currentAnswers = (Array.isArray(answer) ? answer : []) as string[];
    return (
      <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4 font-medium uppercase tracking-wider">Select all that apply</p>
        {question.options?.map((option, idx) => {
          const id = `${question.id}-opt-${idx}`;
          const isSelected = currentAnswers.includes(option);
          
          const toggleSelection = () => {
              if (isSelected) {
                  onAnswerChange(currentAnswers.filter(a => a !== option));
              } else {
                  onAnswerChange([...currentAnswers, option]);
              }
          };

          return (
            <label 
                key={id} 
                htmlFor={id}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border border-slate-300 bg-white'}`}>
                   {isSelected && (
                       <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                       </svg>
                   )}
              </div>
              <input 
                type="checkbox" 
                id={id}
                name={question.id} 
                value={option}
                checked={isSelected}
                onChange={toggleSelection}
                className="sr-only"
              />
              <span className={`text-lg transition-colors ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                  {option}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === 'fill') {
      return (
          <div>
               <input 
                  type="text"
                  value={(answer as string) || ''}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full max-w-lg p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-slate-800 placeholder-slate-400"
                  autoComplete="off"
                  spellCheck="false"
               />
          </div>
      )
  }

  if (question.type === 'essay') {
      return (
          <div className="flex flex-col h-full">
              <textarea 
                  value={(answer as string) || ''}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  placeholder="Enter your essay response..."
                  className="w-full min-h-[300px] p-4 text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-y placeholder-slate-400"
                  spellCheck="false"
              />
              <div className="flex justify-end mt-2">
                  <span className="text-xs font-mono text-slate-400">
                      Chars: {((answer as string) || '').length}
                  </span>
              </div>
          </div>
      )
  }

  return <div>Unsupported question type</div>;
};
