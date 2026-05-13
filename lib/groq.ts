import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-8b-instant';

function extractJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return {};
  }
}

export async function callGroq(systemPrompt: string, userPrompt: string, temperature = 0.5): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 1500,
    });
    return completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    console.error('[Groq callGroq error]', err);
    throw err;
  }
}

export async function callGroqJson<T = Record<string, unknown>>(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.5
): Promise<T> {
  try {
    const text = await callGroq(systemPrompt, userPrompt, temperature);
    return extractJson(text) as T;
  } catch (err) {
    console.error('[Groq callGroqJson error]', err);
    throw err;
  }
}

export async function callGroqChat(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  temperature = 0.7
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: 768,
    });
    return completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    console.error('[Groq callGroqChat error]', err);
    throw err;
  }
}
