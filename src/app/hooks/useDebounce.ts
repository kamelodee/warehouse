import { useState, useEffect, useCallback } from 'react';

export function useDebounce<F extends (...args: any[]) => any>(
  func: F, 
  delay: number
): F {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback((...args: Parameters<F>) => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    const newTimeoutId = setTimeout(() => {
      func(...args);
    }, delay);

    // Save the new timeout ID
    setTimeoutId(newTimeoutId);
  }, [func, delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedFunction as F;
}
