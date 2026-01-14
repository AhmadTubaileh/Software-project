import { useCallback, useState } from 'react';

export function useLocalSession(storageKey = 'frontend_user') {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((user) => {
    setCurrentUser(user);
    try { 
      localStorage.setItem(storageKey, JSON.stringify(user)); 
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }, [storageKey]);

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    try { 
      localStorage.removeItem(storageKey); 
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, [storageKey]);

  return { currentUser, setSession, clearSession };
}


