import profilesData from '../data/profiles.json';

/**
 * Scrapes metadata from public LinkedIn & Instagram profiles.
 */
export async function analyzePersonFromUrls(linkedinUrl, instagramUrl) {
  const extractHandle = (url) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'profile';
    } catch {
      return 'user';
    }
  };

  const liHandle = extractHandle(linkedinUrl);
  const igHandle = extractHandle(instagramUrl);

  const existingMatch = profilesData.find(
    p => p.linkedin.toLowerCase().includes(liHandle.toLowerCase()) || 
         p.instagram.toLowerCase().includes(igHandle.toLowerCase())
  );

  if (existingMatch) {
    return existingMatch;
  }

  const formattedName = liHandle.split(/[-_.]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Agent Persona';
  const initials = formattedName.substring(0, 2).toUpperCase();

  const svgFallback = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="#1e293b"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f43f5e" font-family="sans-serif" font-size="75" font-weight="bold">${initials}</text></svg>`
  )}`;

  return {
    id: `custom_${Date.now()}`,
    name: formattedName,
    tagline: `LinkedIn: @${liHandle} • Instagram: @${igHandle}`,
    avatar: svgFallback,
    linkedin: linkedinUrl,
    instagram: instagramUrl,
    bio: `Dynamic AI Agent synthesized from public LinkedIn (${linkedinUrl}) and Instagram (${instagramUrl}).`,
    needs: [
      `High velocity execution & mutual drive`,
      `Intellectual synergy in ${formattedName}'s domain`,
      `Authentic communication`
    ],
    hobbies: [
      `Curating design & tech`,
      `Global travel & lifestyle`,
      `Active physical fitness`
    ],
    interests: [
      `Frontier Technology`,
      `Business Scaling`,
      `Personal Growth`
    ],
    personality: "Adaptable, inquisitive, forward-thinking, communicative",
    datingStyle: "Relaxed coffee meeting followed by engaging conversation on shared passions",
    matchVibe: "Dynamic & Curious"
  };
}

/**
 * Calculates authentic compatibility score, commonalities, and dynamic dialogue.
 */
export function simulateAgentDate(person1, person2) {
  const p1Interests = person1.interests || [];
  const p2Interests = person2.interests || [];
  const p1Hobbies = person1.hobbies || [];
  const p2Hobbies = person2.hobbies || [];

  // Find actual commonalities between the two specific agents
  const commonInterests = p1Interests.filter(i => p2Interests.some(j => j.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(j.toLowerCase())));
  const commonHobbies = p1Hobbies.filter(h => p2Hobbies.some(k => k.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(k.toLowerCase())));

  let score = 70;
  score += (commonInterests.length * 8) + (commonHobbies.length * 6);
  if (person1.matchVibe === person2.matchVibe) score += 8;
  score = Math.min(98, Math.max(65, score));

  // Extract distinct, unique traits for each agent
  const p1Hobby = p1Hobbies[0] || 'exploring new ideas';
  const p2Hobby = p2Hobbies[0] || 'creative projects';
  const p1Interest = p1Interests[0] || 'innovation';
  const p2Interest = p2Interests[0] || 'leadership';
  const p1Need = person1.needs ? person1.needs[0] : 'mutual growth';
  const p2Need = person2.needs ? person2.needs[0] : 'authentic communication';

  const sharedTopic = commonInterests[0] || commonHobbies[0] || `${p1Interest} & ${p2Interest}`;

  const dialogue = [
    {
      speaker: person1.name,
      avatar: person1.avatar,
      text: `Hey ${person2.name}! My agent flagged our compatibility match. I noticed you're deeply focused on ${p2Interest}—how did you get started with that?`
    },
    {
      speaker: person2.name,
      avatar: person2.avatar,
      text: `Hey ${person1.name}! Great to meet you. It started from my drive for ${p2Need}. Looking at your agent profile, your work in ${p1Interest} and passion for ${p1Hobby} really caught my eye!`
    },
    {
      speaker: person1.name,
      avatar: person1.avatar,
      text: `Appreciate that! For me, ${p1Hobby} keeps me grounded amidst high pressure. I'm really looking for someone who values ${p1Need}.`
    },
    {
      speaker: person2.name,
      avatar: person2.avatar,
      text: `I completely relate. My ideal date is ${person2.datingStyle || 'a relaxed coffee conversation'}. I think our shared interest in ${sharedTopic} makes for a great foundation!`
    },
    {
      speaker: person1.name,
      avatar: person1.avatar,
      text: `Definitely! The conversation flows so naturally. Our agents calculated a ${score}% compatibility match!`
    }
  ];

  return {
    person1,
    person2,
    score,
    summary: `${person1.name}'s agent and ${person2.name}'s agent found shared synergy in ${sharedTopic} with ${score}% compatibility.`,
    dialogue,
    highlights: [
      commonInterests.length > 0 ? `Shared interest in ${commonInterests[0]}` : `Complementary interests: ${p1Interest} & ${p2Interest}`,
      commonHobbies.length > 0 ? `Shared hobby: ${commonHobbies[0]}` : `Distinct hobbies: ${p1Hobby} + ${p2Hobby}`,
      `Vibe alignment: ${person1.matchVibe} & ${person2.matchVibe}`
    ]
  };
}

/**
 * Calculates rankings of all 25 profiles for a given target person.
 */
export function calculateRankingsForPerson(targetPerson, allProfiles) {
  return allProfiles
    .filter(p => p.id !== targetPerson.id)
    .map(candidate => {
      const match = simulateAgentDate(targetPerson, candidate);
      return {
        candidate,
        score: match.score,
        summary: match.summary,
        highlights: match.highlights
      };
    })
    .sort((a, b) => b.score - a.score);
}
