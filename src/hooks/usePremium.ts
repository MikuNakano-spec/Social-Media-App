import { useEffect, useState } from 'react';

export default function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremium = async () => {
      try {
        const response = await fetch('/api/users/premium', {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch premium status');
        
        const data = await response.json();
        setIsPremium(data.isPremium);
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPremium();
  }, []);

  return { isPremium, loading };
}