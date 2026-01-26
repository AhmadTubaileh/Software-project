import { useEffect } from 'react';
import { useLocalSession } from './useLocalSession';

export function useItemViewTracking(itemId) {
  const { currentUser } = useLocalSession();

  useEffect(() => {
    if (!itemId || !currentUser?.id) return;

    const trackView = async () => {
      try {
        await fetch('http://localhost:5000/api/recommendations/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            itemId: itemId
          })
        });
      } catch (error) {
        console.error('Error tracking item view:', error);
      }
    };

    trackView();
  }, [itemId, currentUser]);
}
