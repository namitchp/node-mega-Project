const buckets = new Map();

const leakyBucket = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const rateLimit = 5; // requests per second
  const interval = 1000; // 1 second

  if (!buckets.has(ip)) {
    buckets.set(ip, { tokens: rateLimit, last: now });
  }

  const bucket = buckets.get(ip);
  const elapsed = now - bucket.last;
  bucket.tokens += (elapsed * rateLimit) / interval;
  bucket.tokens = Math.min(rateLimit, bucket.tokens);
  bucket.last = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    next();
  } else {
    res.status(429).json({ error: "Too many requests, please try again later." });
  }
};

export default leakyBucket;
