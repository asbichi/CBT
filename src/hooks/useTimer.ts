import { useState, useEffect } from 'react';

export function useTimer(initialSeconds: number, onExpire: () => void) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: number;
    
    if (isRunning && secondsRemaining > 0) {
      interval = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (secondsRemaining <= 0 && isRunning) {
        setIsRunning(false);
        onExpire();
    }

    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, onExpire]);

  const start = () => setIsRunning(true);
  const stop = () => setIsRunning(false);
  const reset = (newTime: number = initialSeconds) => {
    setIsRunning(false);
    setSecondsRemaining(newTime);
  };

  const formattedTime = formatTime(secondsRemaining);
  const isWarning = secondsRemaining <= 15 * 60 && secondsRemaining > 5 * 60; // 15 mins
  const isCritical = secondsRemaining <= 5 * 60; // 5 mins

  return { 
    secondsRemaining, 
    formattedTime, 
    isRunning, 
    start, 
    stop, 
    reset,
    isWarning,
    isCritical
  };
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const hours = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
  const minutes = m.toString().padStart(2, '0');
  const seconds = s.toString().padStart(2, '0');
  
  return `${hours}${minutes}:${seconds}`;
}
