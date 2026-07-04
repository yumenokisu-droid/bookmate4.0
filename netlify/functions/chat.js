const { GoogleGenAI } = require('@google/genai');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  };
}

function toText(part) {
  return part?.parts?.[0]?.text || part?.text || '';
}

function compactHistory(history = [], limit = 8) {
  return (Array.isArray(history) ? history : [])
    .slice(-limit)
    .map((h) => {
      const role = h.role === 'model' ? '모아' : '사용자';
      const text = String(toText(h)).replace(/\s+/g, ' ').trim().slice(0, 900);
      return text ? `${role}: ${text}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

async function withTimeout(promise, ms = 24000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Gemini request timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const { message, history = [], book = '', systemPrompt = '', conversationText = '' } = JSON.parse(event.body || '{}');
    const latestMessage = String(message || '').trim();
    if (!latestMessage) return json(400, { error: 'message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json(500, { error: 'GEMINI_API_KEY is not configured' });

    const ai = new GoogleGenAI({ apiKey });
    const recent = compactHistory(history, 8);
    const prompt = `${systemPrompt || "너는 BOOKMATE의 AI 독서파트너 모아이다. 한국어로 자연스럽게 답한다."}

현재 책: ${book || '미정'}

최근 대화:
${recent || String(conversationText || '').slice(-2500) || '없음'}

사용자의 마지막 요청:
${latestMessage}

답변 지침: 사용자의 마지막 말에 바로 이어서 답한다. 모드 선택 안내를 반복하지 않는다. 3~6문장으로 간결하게 답한다.`;

    const models = [process.env.GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError;

    for (const model of models) {
      try {
        const result = await withTimeout(ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.72,
            topP: 0.9,
            maxOutputTokens: 650
          }
        }));
        const reply = String(result?.text || '').trim();
        if (reply) return json(200, { reply, model });
        lastError = new Error(`Empty response from ${model}`);
      } catch (error) {
        lastError = error;
        console.error(`[BOOKMATE AI] Gemini model failed: ${model}`, error?.message || error);
      }
    }

    return json(502, {
      error: 'Gemini request failed',
      detail: lastError?.message || 'Unknown Gemini error'
    });
  } catch (error) {
    console.error('[BOOKMATE AI] Function error', error);
    return json(500, { error: 'AI request failed', detail: error.message });
  }
};
