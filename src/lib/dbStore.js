import { Redis } from '@upstash/redis';
import MemoryClient from 'mem0ai';
import fs from 'fs';
import path from 'path';

// 1. Upstash Redis Instance
let redis = null;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisUrl.startsWith('https://') && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (e) {
    console.warn("Upstash Redis initialization warning:", e.message);
  }
}

// 2. Mem0 Client Instance
let mem0 = null;
if (process.env.MEM0_API_KEY && !process.env.MEM0_API_KEY.includes('your_')) {
  try {
    mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
  } catch (e) {
    console.warn("Mem0 initialization warning:", e.message);
  }
}

// 3. Fallback Local Persistent File DB
const DB_FILE = path.join(process.cwd(), 'src', 'data', 'agent_store.json');
function ensureDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ rawApifyScrapes: {}, agentProfiles: {}, dateSessions: {} }, null, 2));
  }
}
function readLocalDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { rawApifyScrapes: {}, agentProfiles: {}, dateSessions: {} };
  }
}
function writeLocalDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/**
 * Clear/Reset persistent memory store (Clear Redis, Mem0 & Local DB)
 */
export async function clearAgentMemoryStore() {
  if (redis) {
    try {
      await redis.flushdb();
      console.log("[UPSTASH REDIS] Memory flushed successfully.");
    } catch (e) {
      console.warn("Redis flush error:", e.message);
    }
  }

  // Reset local file DB
  writeLocalDb({ rawApifyScrapes: {}, agentProfiles: {}, dateSessions: {} });
  console.log("[LOCAL DB] Memory cleared.");
}

/**
 * 3-TIER ARCHITECTURE:
 * Tier 1: Upstash Redis (Ultra-fast serverless cache)
 * Tier 2: Mem0 AI / Local DB (Long-term persistent agent memory)
 * Tier 3: Miss (Trigger Apify Scrapers & Groq AI Agent)
 */
export async function getAgentFromStore(key, forceRefresh = false) {
  if (forceRefresh) {
    return { hit: 'miss', data: null };
  }

  const sanitizeKey = `agent:${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // Tier 1: Try Upstash Redis Cache
  if (redis) {
    try {
      const cached = await redis.get(sanitizeKey);
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        console.log(`[UPSTASH REDIS HIT] Key: ${sanitizeKey}`);
        return { hit: 'redis_cache', data };
      }
    } catch (err) {
      console.warn("Upstash Redis Cache Read Error:", err.message);
    }
  }

  // Tier 2: Try Mem0 AI Memory Store
  if (mem0) {
    try {
      const memories = await mem0.getAll({ userId: sanitizeKey });
      if (memories && memories.length > 0) {
        console.log(`[MEM0 MEMORY HIT] Key: ${sanitizeKey}`);
        const parsed = JSON.parse(memories[0].memory);
        if (redis) await redis.set(sanitizeKey, JSON.stringify(parsed), { ex: 86400 });
        return { hit: 'mem0_db', data: parsed };
      }
    } catch (err) {
      console.warn("Mem0 Memory Store Read Error:", err.message);
    }
  }

  // Fallback: Try Local JSON DB
  const localDb = readLocalDb();
  if (localDb.agentProfiles && localDb.agentProfiles[key]) {
    const data = localDb.agentProfiles[key];
    console.log(`[LOCAL DB HIT] Key: ${key}`);
    return { hit: 'local_db', data };
  }

  return { hit: 'miss', data: null };
}

/**
 * Save Agent to Redis Cache & Mem0 DB Memory Store
 */
export async function saveAgentToStore(key, rawApifyData, agentProfile) {
  const sanitizeKey = `agent:${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  if (redis) {
    try {
      await redis.set(sanitizeKey, JSON.stringify(agentProfile), { ex: 86400 });
      console.log(`[UPSTASH REDIS SET] Key: ${sanitizeKey}`);
    } catch (err) {
      console.warn("Upstash Redis Write Error:", err.message);
    }
  }

  if (mem0) {
    try {
      await mem0.add([
        { role: "user", content: JSON.stringify(agentProfile) }
      ], { userId: sanitizeKey });
      console.log(`[MEM0 MEMORY STORED] Key: ${sanitizeKey}`);
    } catch (err) {
      console.warn("Mem0 Write Error:", err.message);
    }
  }

  const localDb = readLocalDb();
  localDb.rawApifyScrapes[key] = rawApifyData;
  localDb.agentProfiles[key] = agentProfile;
  writeLocalDb(localDb);
}

/**
 * Session Date Caching in Upstash Redis / Mem0
 */
export async function getStoredDateSession(sessionKey) {
  const sanitizeKey = `session:${sessionKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  if (redis) {
    try {
      const cached = await redis.get(sanitizeKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      console.warn("Redis Date Session Read Error:", err.message);
    }
  }

  const db = readLocalDb();
  return db.dateSessions ? db.dateSessions[sessionKey] : null;
}

export async function saveDateSessionToStore(sessionKey, sessionData) {
  const sanitizeKey = `session:${sessionKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  if (redis) {
    try {
      await redis.set(sanitizeKey, JSON.stringify(sessionData), { ex: 86400 });
    } catch (err) {
      console.warn("Redis Date Session Write Error:", err.message);
    }
  }

  const db = readLocalDb();
  if (!db.dateSessions) db.dateSessions = {};
  db.dateSessions[sessionKey] = sessionData;
  writeLocalDb(db);
}
