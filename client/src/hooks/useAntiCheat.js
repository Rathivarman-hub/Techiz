import { useEffect, useRef, useCallback } from 'react';

export const useAntiCheat = ({ onWarning, maxWarnings = 3 }) => {
  const warningCount = useRef(0);
  const isActive = useRef(false);

  const issueWarning = useCallback(() => {
    warningCount.current += 1;
    onWarning(warningCount.current, maxWarnings);
  }, [onWarning, maxWarnings]);

  const activate = useCallback(() => {
    isActive.current = true;
  }, []);

  const deactivate = useCallback(() => {
    isActive.current = false;
  }, []);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isActive.current) issueWarning();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [issueWarning]);

  // Fullscreen exit detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive.current) issueWarning();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [issueWarning]);

  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }, []);

  return { activate, deactivate, enterFullscreen, exitFullscreen, warningCount: warningCount.current };
};
