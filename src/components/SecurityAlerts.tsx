import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecurityAlertsProps {
  warnings: string[];
  onDismiss: (index: number) => void;
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({ warnings, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {warnings.map((warning, index) => (
          <motion.div
            key={`${index}-${warning}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r shadow-lg flex items-start max-w-md w-full"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800">Security Violation</h4>
              <p className="text-sm text-red-700 mt-1">{warning}</p>
            </div>
            <button 
                onClick={() => onDismiss(index)}
                className="ml-3 text-red-400 hover:text-red-600 transition-colors"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
