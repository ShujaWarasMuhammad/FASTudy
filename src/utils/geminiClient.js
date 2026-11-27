// Single place for Gemini configuration. Model is overridable via VITE_GEMINI_MODEL.
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
export const isGeminiConfigured = Boolean(GEMINI_API_KEY);

export function geminiEndpoint() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

/** POST a contents array to Gemini and return the first text part. Throws on HTTP errors. */
export async function generateGeminiText(contents, generationConfig) {
  const res = await fetch(geminiEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(generationConfig ? { contents, generationConfig } : { contents }),
  });
  if (!res.ok) {
    let message = `Gemini HTTP ${res.status}`;
    try { message = (await res.json()).error?.message || message; } catch { /* ignore */ }
    throw new Error(message);
  }
  const body = await res.json();
  return body.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
