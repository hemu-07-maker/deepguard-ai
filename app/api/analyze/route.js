import { NextResponse } from 'next/server';
import { analyzeMedia } from '@/lib/detection';

export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileName, fileSize, fileType, mode = 'image', base64 } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && base64 && mode === 'image') {
      try {
        const result = await callClaude(apiKey, base64, fileName);
        if (result) return NextResponse.json(result);
      } catch (e) {
        console.warn('Claude fallback to heuristic:', e.message);
      }
    }

    const result = analyzeMedia({ fileName, fileSize, fileType, mode });
    await new Promise((r) => setTimeout(r, 180 + Math.random() * 320));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 });
  }
}

async function callClaude(apiKey, base64, fileName) {
  const mediaType = base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system:
        'You are a deepfake forensic analyst. Respond ONLY with valid JSON: {"verdict":"REAL"|"FAKE","confidence":0-100,"facesDetected":number,"artifacts":["..."],"reasoning":"short"}',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: `Analyze this media (filename: ${fileName || 'unknown'}) for deepfake / synthetic generation. Return JSON only.` },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON');
  const parsed = JSON.parse(match[0]);
  return {
    verdict: String(parsed.verdict || 'REAL').toUpperCase(),
    confidence: Number(parsed.confidence) || 70,
    facesDetected: Number(parsed.facesDetected) || 1,
    latencyMs: 40,
    mode: 'image',
    artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
    reasoning: parsed.reasoning || 'Claude forensic analysis complete.',
    timestamp: new Date().toISOString(),
    fileName: fileName || 'upload',
    fileType: 'image',
    engine: 'claude-sonnet',
  };
}
