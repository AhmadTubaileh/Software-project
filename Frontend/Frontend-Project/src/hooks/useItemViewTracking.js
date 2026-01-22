import { useEffect, useRef } from 'react';
import { useLocalSession } from './useLocalSession';

const API_BASE_URL = 'http://localhost:5000/api';

export function useItemViewTracking(itemId) {
  const { currentUser } = useLocalSession();
  const trackedItemRef = useRef(null);

  useEffect(() => {
    if (!itemId) {
      console.log('⚠️ No itemId provided for tracking');
      return;
    }

    if (!currentUser) {
      console.log('⚠️ No user logged in, skipping view tracking');
      return;
    }

    if (trackedItemRef.current === itemId) {
      console.log(`⚠️ Item ${itemId} already tracked in this session`);
      return;
    }

    const trackView = async () => {
      try {
        console.log(`🔄 Attempting to track view: User ${currentUser.id} (type: ${currentUser.user_type}) viewing Item ${itemId}`);
        
        const response = await fetch(`${API_BASE_URL}/recommendations/track-view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            itemId: itemId
          })
        });

        const data = await response.json();
        
        if (data.success && data.tracked) {
          console.log(`✅ View tracked successfully for item ${itemId}`);
          trackedItemRef.current = itemId;
        } else {
          console.log(`ℹ️ View not tracked: ${data.message}`);
        }
      } catch (error) {
        console.error('❌ Error tracking item view:', error);
      }
    };

    const timeoutId = setTimeout(trackView, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [itemId, currentUser]);
}
