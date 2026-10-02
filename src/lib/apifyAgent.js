import { ApifyClient } from 'apify-client';
import Groq from 'groq-sdk';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || '',
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

/**
 * Helper to generate inline SVG avatar data URI (0 network calls, 0 CORS issues)
 */
function getInitialsSvgDataUri(name) {
  const initials = (name || 'A')
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="100%" height="100%" fill="#1e293b"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f43f5e" font-family="sans-serif" font-size="75" font-weight="bold">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Scrape LinkedIn via Apify SDK
 */
export async function scrapeLinkedInProfile(linkedinUrl) {
  if (!process.env.APIFY_API_TOKEN || process.env.APIFY_API_TOKEN.includes('your_')) {
    return { url: linkedinUrl };
  }

  try {
    const run = await apifyClient.actor("dev_scrapers/linkedin-profile-scraper").call({
      urls: [linkedinUrl]
    });
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    return items[0] || { url: linkedinUrl };
  } catch (error) {
    console.error("Apify LinkedIn Scraper Warning:", error.message);
    return { url: linkedinUrl };
  }
}

/**
 * Scrape Instagram via Apify SDK to extract real profile pic & bio
 */
export async function scrapeInstagramProfile(instagramUrl) {
  if (!process.env.APIFY_API_TOKEN || process.env.APIFY_API_TOKEN.includes('your_')) {
    return { url: instagramUrl };
  }

  try {
    const extractHandle = (url) => {
      try {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || '';
      } catch {
        return '';
      }
    };

    const handle = extractHandle(instagramUrl);
    const runPayload = handle ? { usernames: [handle] } : { directUrls: [instagramUrl] };

    const run = await apifyClient.actor("apify/instagram-profile-scraper").call(runPayload);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    return items[0] || { url: instagramUrl };
  } catch (error) {
    console.error("Apify Instagram Scraper Warning:", error.message);
    return { url: instagramUrl };
  }
}

/**
 * Groq AI Profiler Agent: Dynamically analyzes person using Groq LLaMA 3.1
 */
export async function analyzePersonWithGroqAgent(personMeta) {
  const { name, tagline, linkedin, instagram } = personMeta;

  // 1. Fetch real raw profile data via Apify SDK
  const linkedinData = await scrapeLinkedInProfile(linkedin);
  const instagramData = await scrapeInstagramProfile(instagram);

  // 2. Extract REAL Profile Image URL directly from scraped Instagram or LinkedIn payload
  const realScrapedAvatar = 
    instagramData?.profilePicUrlHD || 
    instagramData?.profilePicUrl || 
    instagramData?.profile_pic_url || 
    linkedinData?.profilePicture || 
    linkedinData?.displayPictureUrl || 
    linkedinData?.picture || 
    null;

  // Inline SVG avatar fallback (No CORS, No external server)
  const nameAvatarFallback = getInitialsSvgDataUri(name);
  const finalAvatarUrl = realScrapedAvatar || nameAvatarFallback;

  const prompt = `
You are an expert AI Agent Profiler for an Agentic Dating Site.
You are given the official social profiles for ${name} (${tagline}).
LinkedIn URL: ${linkedin}
Instagram URL: ${instagram}

Raw LinkedIn Scraped Data: ${JSON.stringify(linkedinData)}
Raw Instagram Scraped Data: ${JSON.stringify(instagramData)}

Generate a UNIQUE, highly specific, and personalized AI Agent profile for ${name}.
DO NOT use generic phrases like "Intellectual alignment" or "Tech innovation". Tailor every single need, hobby, and interest to ${name}'s real background, company, career, and personal persona.

Return ONLY a valid JSON object matching this exact format (no markdown, no backticks):
{
  "id": "${personMeta.id || 'agent_' + Date.now()}",
  "name": "${name}",
  "tagline": "${tagline}",
  "avatar": "${finalAvatarUrl}",
  "linkedin": "${linkedin}",
  "instagram": "${instagram}",
  "bio": "Detailed bio specifically describing ${name}'s career, public presence, and personal vision.",
  "needs": ["Specific Need 1 for ${name}", "Specific Need 2", "Specific Need 3"],
  "hobbies": ["Specific Hobby 1 tailored to ${name}", "Specific Hobby 2", "Specific Hobby 3"],
  "interests": ["Specific Professional Interest 1", "Specific Interest 2", "Specific Interest 3"],
  "personality": "Unique communication style and personality traits for ${name}",
  "datingStyle": "Unique preferred date setting and vibe for ${name}",
  "matchVibe": "2-3 word unique vibe tag"
}
`;

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_')) {
    return {
      id: personMeta.id || `agent_${Date.now()}`,
      name,
      tagline,
      avatar: finalAvatarUrl,
      linkedin,
      instagram,
      bio: `Agent representing ${name} built from public LinkedIn (${linkedin}) and Instagram (${instagram}).`,
      needs: [`Deep synergy in ${tagline.split(' ')[0] || 'vision'}`, `High velocity execution`, `Shared passion for building`],
      hobbies: [`Exploring global events`, `Curating visual design`, `Active physical training`],
      interests: [`Industry scaling`, `Frontier Innovation`, `Strategic partnerships`],
      personality: "Strategic, forward-thinking, articulate",
      datingStyle: "Spontaneous meeting over specialty coffee discussing big ideas",
      matchVibe: "Ambitious & Direct"
    };
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      ...parsed,
      avatar: finalAvatarUrl
    };
  } catch (err) {
    console.error("Groq Agent Analysis Error:", err);
    return {
      id: personMeta.id || `agent_${Date.now()}`,
      name,
      tagline,
      avatar: finalAvatarUrl,
      linkedin,
      instagram,
      bio: `Agent representing ${name} analyzed from LinkedIn (${linkedin}) and Instagram (${instagram}).`,
      needs: [`Deep synergy in ${tagline.split(' ')[0] || 'vision'}`, `High velocity execution`, `Shared passion for building`],
      hobbies: [`Exploring global events`, `Curating visual design`, `Active physical training`],
      interests: [`Industry scaling`, `Frontier Innovation`, `Strategic partnerships`],
      personality: "Strategic, forward-thinking, articulate",
      datingStyle: "Spontaneous meeting over specialty coffee discussing big ideas",
      matchVibe: "Ambitious & Direct"
    };
  }
}

/**
 * AI Agent Date Harness via Groq
 */
export async function runGroqAgentDateSession(agent1, agent2) {
  const prompt = `
You are the Harness for an Agentic Dating Site.
Orchestrate an authentic first date conversation between two AI agents:

Agent 1 (${agent1.name}):
- Bio: ${agent1.bio}
- Needs: ${agent1.needs?.join(', ')}
- Hobbies: ${agent1.hobbies?.join(', ')}
- Interests: ${agent1.interests?.join(', ')}

Agent 2 (${agent2.name}):
- Bio: ${agent2.bio}
- Needs: ${agent2.needs?.join(', ')}
- Hobbies: ${agent2.hobbies?.join(', ')}
- Interests: ${agent2.interests?.join(', ')}

Generate 5 conversational turns, calculate match score (60-98), and highlights.
Return ONLY raw JSON (no markdown):
{
  "score": 88,
  "summary": "Detailed summary of how their agents bonded during the date",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "dialogue": [
    {"speaker": "${agent1.name}", "avatar": "${agent1.avatar}", "text": "..."},
    {"speaker": "${agent2.name}", "avatar": "${agent2.avatar}", "text": "..."},
    {"speaker": "${agent1.name}", "avatar": "${agent1.avatar}", "text": "..."},
    {"speaker": "${agent2.name}", "avatar": "${agent2.avatar}", "text": "..."},
    {"speaker": "${agent1.name}", "avatar": "${agent1.avatar}", "text": "..."}
  ]
}
`;

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_')) return null;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.error("Groq Agent Date Error:", err);
    return null;
  }
}
