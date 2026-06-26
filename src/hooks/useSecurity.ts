import { useState, useEffect } from 'react';

export interface SecurityViolation {
  type: 'tab_switch' | 'right_click' | 'copy_paste' | 'fullscreen_exit' | 'mouse_left_screen';
  timestamp: string;
}

export interface SecurityContext {
  tabSwitches: number;
  rightClicks: number;
  copyPasted: number;
  isFullscreen: boolean;
  mouseLeftScreen: number;
  violations: SecurityViolation[];
}

export function useSecurity() {
  const [securityStats, setSecurityStats] = useState<SecurityContext>({
    tabSwitches: 0,
    rightClicks: 0,
    copyPasted: 0,
    isFullscreen: false,
    mouseLeftScreen: 0,
    violations: [],
  });
  
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const addViolation = (type: SecurityViolation['type']) => {
      setSecurityStats(prev => ({
        ...prev,
        violations: [...prev.violations, { type, timestamp: new Date().toISOString() }]
      }));
    };

    // Detect Tab Switch / Visibility Change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setSecurityStats(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }));
        addViolation('tab_switch');
        setWarnings(prev => [...prev, 'Warning: You left the examination tab. This incident has been logged.']);
      }
    };

    // Detect Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityStats(prev => ({ ...prev, rightClicks: prev.rightClicks + 1 }));
      addViolation('right_click');
      setWarnings(prev => [...prev, 'Warning: Right-click is disabled during the examination.']);
    };

    // Detect Copy/Paste
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setSecurityStats(prev => ({ ...prev, copyPasted: prev.copyPasted + 1 }));
      addViolation('copy_paste');
      setWarnings(prev => [...prev, 'Warning: Copying and pasting is disabled.']);
    };

    // Detect Fullscreen
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setSecurityStats(prev => ({ ...prev, isFullscreen: isFull }));
      if (!isFull) {
         addViolation('fullscreen_exit');
         setWarnings(prev => [...prev, 'Warning: Exiting full-screen mode may invalidate your exam session.']);
      }
    };
    
    // Detect mouse leave
    const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
            setSecurityStats(prev => ({...prev, mouseLeftScreen: prev.mouseLeftScreen + 1}));
            addViolation('mouse_left_screen');
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = document.documentElement as any;
        const requestMethod = el.requestFullscreen || 
                              el.webkitRequestFullscreen || 
                              el.mozRequestFullScreen || 
                              el.msRequestFullscreen;
        if (typeof requestMethod === 'function') {
          await requestMethod.call(el);
        } else {
          console.warn("Fullscreen API not supported in this browser/context.");
        }
      }
    } catch (err) {
      console.warn("Fullscreen request denied", err);
    }
  };
  
  const dismissWarning = (index: number) => {
      setWarnings(prev => prev.filter((_, i) => i !== index));
  }

  return { securityStats, warnings, requestFullscreen, dismissWarning };
}
