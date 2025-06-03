import ky from '@/lib/ky';

export const updateGameScore = async (score: number) => {
  try {
    await ky.patch('/api/game/score', {
      json: { score }
    });
  } catch (error) {
    console.error('Failed to update game score:', error);
  }
};

export const getLeaderboard = async () => {
  return ky.get('/api/game/leaderboard').json();
};

export const getUserGameStats = async (userId: string) => {
  return ky.get(`/api/game/stats/${userId}`).json();
};