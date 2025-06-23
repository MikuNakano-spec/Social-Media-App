const memoryCache = new Map<string, { count: number; expires: number }>();

export function checkMemoryRateLimit(
  key: string,
  windowMs: number,
  max: number
): { isAllowed: boolean; remaining: number; reset: number } {
  const current = Date.now();
  
  if (!memoryCache.has(key)) {
    memoryCache.set(key, {
      count: 1,
      expires: current + windowMs
    });
    return {
      isAllowed: true,
      remaining: max - 1,
      reset: Math.ceil((current + windowMs) / 1000)
    };
  }

  const entry = memoryCache.get(key)!;
  
  if (current > entry.expires) {
    entry.count = 1;
    entry.expires = current + windowMs;
    return {
      isAllowed: true,
      remaining: max - 1,
      reset: Math.ceil(entry.expires / 1000)
    };
  }

  if (entry.count >= max) {
    return {
      isAllowed: false,
      remaining: 0,
      reset: Math.ceil(entry.expires / 1000)
    };
  }

  entry.count++;
  return {
    isAllowed: true,
    remaining: max - entry.count,
    reset: Math.ceil(entry.expires / 1000)
  };
}