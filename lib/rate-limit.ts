type Bucket = { count: number; resetsAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function takeSubmissionSlot(ip: string) {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetsAt <= now) {
    buckets.set(ip, { count: 1, resetsAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}
