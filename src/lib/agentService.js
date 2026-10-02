import { 
  scrapeLinkedInProfile, 
  scrapeInstagramProfile, 
  analyzePersonWithGroqAgent,
  runGroqAgentDateSession 
} from './apifyAgent';
import { 
  getAgentFromStore, 
  saveAgentToStore, 
  getStoredDateSession, 
  saveDateSessionToStore 
} from './dbStore';

/**
 * Executes the 3-Tier Agentic Architecture:
 * 1. Check In-Memory Cache & DB Store
 * 2. On Miss: Execute Apify Scrapers (LinkedIn & Instagram)
 * 3. Store raw Apify output in Persistent DB
 * 4. Pass scraped data to Groq AI Agent for synthesis
 * 5. Save Agent Profile in DB & Cache
 */
export async function getOrFetchAgentProfile(personMeta, linkedinUrl, instagramUrl) {
  const storeKey = linkedinUrl || personMeta?.linkedin || personMeta?.name;

  // Tier 1 & Tier 2: Check Cache & DB Store
  const stored = getAgentFromStore(storeKey);
  if (stored.hit !== 'miss' && stored.data) {
    console.log(`[Store HIT: ${stored.hit.toUpperCase()}] Serving ${personMeta.name || storeKey} from persistent memory.`);
    return stored.data;
  }

  console.log(`[Store MISS] Fetching fresh data via Apify for ${storeKey}...`);

  // Tier 3 Miss: Scrape raw profiles using Apify SDK
  const linkedinData = await scrapeLinkedInProfile(linkedinUrl);
  const instagramData = await scrapeInstagramProfile(instagramUrl);
  const rawApifyPayload = { linkedinData, instagramData, scrapedAt: new Date().toISOString() };

  // Pass raw Apify payloads into Groq AI Agent for deep persona synthesis
  const agentProfile = await analyzePersonWithGroqAgent(personMeta || { linkedin: linkedinUrl, instagram: instagramUrl });

  // Save to DB & Cache
  saveAgentToStore(storeKey, rawApifyPayload, agentProfile);

  return agentProfile;
}

/**
 * 3-Tier Date Harness
 */
export async function getOrRunAgentDate(agent1, agent2) {
  const sessionKey = `date_${agent1.id}_${agent2.id}`;
  
  // Check Cache / DB
  const existing = getStoredDateSession(sessionKey);
  if (existing) {
    console.log(`[Date Store HIT] Serving cached date between ${agent1.name} & ${agent2.name}`);
    return existing;
  }

  // Run Groq AI Agent Date Harness
  const newSession = await runGroqAgentDateSession(agent1, agent2);
  if (newSession) {
    saveDateSessionToStore(sessionKey, newSession);
  }
  return newSession;
}
