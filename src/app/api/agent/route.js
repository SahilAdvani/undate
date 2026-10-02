import { NextResponse } from 'next/server';
import { getOrFetchAgentProfile, getOrRunAgentDate } from '@/lib/agentService';
import { clearAgentMemoryStore } from '@/lib/dbStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, personMeta, linkedinUrl, instagramUrl, agent1, agent2 } = body;

    // Action 0: Reset Memory & Force Refresh Scrapes
    if (action === 'reset_memory') {
      await clearAgentMemoryStore();
      return NextResponse.json({ success: true, message: "Agent memory store cleared successfully." });
    }

    // Action 1: 3-Tier Agent Profile Fetch (Cache -> DB -> Apify -> Groq)
    if (action === 'analyze_person') {
      const targetLinkedin = linkedinUrl || personMeta?.linkedin;
      const targetInstagram = instagramUrl || personMeta?.instagram;

      if (!targetLinkedin || !targetInstagram) {
        return NextResponse.json({ error: "Both linkedinUrl and instagramUrl are required." }, { status: 400 });
      }

      const agentProfile = await getOrFetchAgentProfile(
        personMeta || { linkedin: targetLinkedin, instagram: targetInstagram, name: "Analyzed Agent" },
        targetLinkedin,
        targetInstagram
      );

      return NextResponse.json({ success: true, agent: agentProfile });
    }

    // Action 2: 3-Tier Agent Date Session (Cache -> DB -> Groq Harness)
    if (action === 'simulate_date') {
      if (!agent1 || !agent2) {
        return NextResponse.json({ error: "Both agent1 and agent2 are required." }, { status: 400 });
      }

      const dateSession = await getOrRunAgentDate(agent1, agent2);
      return NextResponse.json({ success: true, dateSession });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
