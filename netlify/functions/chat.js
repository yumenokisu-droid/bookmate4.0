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

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function compactHistory(history = [], limit = 12, latestMessage = '') {
  const latest = normalizeSpace(latestMessage);
  const rows = (Array.isArray(history) ? history : [])
    .slice(-limit)
    .map((h) => {
      const role = h.role === 'model' ? '모아' : '사용자';
      const text = normalizeSpace(toText(h)).slice(0, 1000);
      return text ? { role, text } : null;
    })
    .filter(Boolean);

  // 클라이언트가 방금 사용자 발화를 history와 message에 함께 보낼 수 있으므로
  // 마지막 중복 발화는 한 번만 모델에 전달한다.
  if (rows.length && latest && rows[rows.length - 1].role === '사용자') {
    const last = rows[rows.length - 1].text;
    if (last === latest || latest.endsWith(last) || last.endsWith(latest)) rows.pop();
  }
  return rows.map(({ role, text }) => `${role}: ${text}`).join('\n');
}

async function withTimeout(promise, ms = 26000) {
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

function cleanReply(value) {
  return String(value || '')
    .replace(/^(AI 모아|모아)\s*[:：-]?\s*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


function stripConversationRestart(reply, hasRecentConversation) {
  let text = String(reply || '').trim();
  if (!hasRecentConversation) return text;
  text = text
    .replace(/^(네[,!]?\s*)?(안녕하세요[.!]?\s*)/i, '')
    .replace(/^(저는\s*(BOOKMATE의\s*)?(AI\s*)?독서(파트너|친구)\s*모아(?:예요|입니다)[.!]?\s*)/i, '')
    .replace(/^(모아와\s*함께\s*독서\s*대화를\s*시작해볼까요[?？]?\s*)/i, '')
    .trim();
  return text || reply;
}

function finishReasonOf(result) {
  return String(result?.candidates?.[0]?.finishReason || result?.candidates?.[0]?.finish_reason || '').toUpperCase();
}

function looksIncomplete(reply, finishReason = '') {
  const text = String(reply || '').trim();
  if (!text) return true;
  if (['MAX_TOKENS', 'MALFORMED_FUNCTION_CALL', 'OTHER'].includes(String(finishReason).toUpperCase())) return true;
  if (/[.!?…。！？」』”’)]$/.test(text)) return false;
  // 한국어 종결형은 문장부호가 없어도 완결된 응답으로 인정한다.
  if (/(입니다|합니다|됩니다|있어요|없어요|같아요|보여요|느껴져요|해요|예요|이에요|네요|군요|죠|까요|세요|게요|했어요|있습니다|없습니다|바랍니다|좋겠습니다)$/.test(text)) return false;
  // 짧은 단답은 완결로 볼 수 있지만, 충분히 긴 문장이 조사·어간에서 끝나면 잘림으로 판단한다.
  return text.length >= 28;
}

function isRepairRequest(message) {
  return /(말(을|하다)?\s*하다\s*말|중간에\s*(끊|잘)|왜\s*말.*말아|이어서\s*말|마저\s*말|답변.*끊)/.test(String(message || ''));
}

function lastAssistantAskedQuestion(history = [], conversationText = '') {
  const modelRows = (Array.isArray(history) ? history : []).filter(h => h?.role === 'model');
  const last = normalizeSpace(toText(modelRows[modelRows.length - 1]));
  if (last) return /[?？]$/.test(last);
  const lines = String(conversationText || '').trim().split('\n').filter(Boolean);
  const moa = [...lines].reverse().find(line => /^(AI\s*모아|모아)\s*:/.test(line));
  return moa ? /[?？]$/.test(moa.trim()) : false;
}

function buildGenerationConfig(model, overrides = {}) {
  const config = {
    temperature: overrides.temperature ?? 0.62,
    topP: overrides.topP ?? 0.88,
    maxOutputTokens: overrides.maxOutputTokens ?? 1400
  };
  // 2.5 계열은 간단한 독서 대화에서 과도한 내부 사고가 출력 예산을 소모하지 않도록 제한한다.
  if (/gemini-2\.5/i.test(model)) {
    config.thinkingConfig = { thinkingBudget: overrides.thinkingBudget ?? 128, includeThoughts: false };
  }
  return config;
}

async function generate(ai, model, prompt, configOverrides = {}) {
  const result = await withTimeout(ai.models.generateContent({
    model,
    contents: prompt,
    config: buildGenerationConfig(model, configOverrides)
  }));
  return {
    result,
    reply: cleanReply(result?.text),
    finishReason: finishReasonOf(result)
  };
}

async function repairIncompleteReply(ai, model, originalPrompt, draft) {
  const repairPrompt = `${originalPrompt}\n\n아래 초안은 문장이 중간에 끊겼거나 완결성이 부족하다. 초안을 그대로 이어붙이지 말고, 같은 의미를 유지하면서 처음부터 자연스러운 2~4문장의 완결된 한국어 답변으로 다시 작성하라. 인사나 자기소개로 다시 시작하지 말고 질문은 꼭 필요할 때만 한 개 이하로 사용한다.\n\n미완성 초안:\n${draft || '(비어 있음)'}`;
  return generate(ai, model, repairPrompt, {
    temperature: 0.45,
    topP: 0.82,
    maxOutputTokens: 1500,
    thinkingBudget: 96
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const {
      message,
      history = [],
      book = '',
      systemPrompt = '',
      conversationText = '',
      channel = 'personal',
      requestKind = ''
    } = JSON.parse(event.body || '{}');

    const latestMessage = String(message || '').trim();
    if (!latestMessage) return json(400, { error: 'message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json(500, { error: 'GEMINI_API_KEY is not configured' });

    const ai = new GoogleGenAI({ apiKey });
    const recent = compactHistory(history, channel === 'live' ? 14 : 12, latestMessage);
    const repairRequested = isRepairRequest(latestMessage);
    const previousWasQuestion = lastAssistantAskedQuestion(history, conversationText);

    const channelGuide = channel === 'live'
      ? `LIVE 대화 규칙:
- 새로 인사하거나 대화를 처음부터 시작하지 않는다.
- 가장 최근 참여자의 구체적인 의견을 먼저 짚고, 다른 의견과 연결하거나 짧게 정리한다.
- 퍼실리테이터라고 해도 매번 질문하지 않는다. 흐름을 열어야 할 때만 질문을 한 개 제안한다.
- 참여자의 말을 반복해서 바꾸어 말하는 데 그치지 말고, 작품의 주제와 연결되는 해석을 한 가지 보탠다.`
      : `개인 독서 대화 규칙:
- 사용자의 감상에 상투적인 칭찬으로만 반응하지 않는다.
- 공감 또는 확인 1문장 뒤에, 사용자가 언급한 장면·인물·주제를 바탕으로 구체적인 해석을 1~2문장 보탠다.
- 매 답변을 질문으로 끝내지 않는다. 질문은 대화를 실제로 넓힐 필요가 있을 때만 한 개 사용한다.
- “정말 좋은 선택이네요”, “많은 독자에게 깊은 울림을 줍니다” 같은 정형 문구를 반복하지 않는다.`;

    const repairGuide = repairRequested
      ? `사용자는 직전 답변이 중간에 끊겼다고 지적했다. 짧게 미안하다고 한 뒤, 직전 모아의 미완성 문장이 다루던 내용을 바로 완결해서 이어간다. 절대로 다시 인사하거나 책을 처음부터 묻지 않는다.`
      : '';

    const questionGuide = previousWasQuestion
      ? `직전 모아 답변이 이미 질문으로 끝났다. 이번 답변은 새로운 질문을 던지지 말고 설명·해석·정리로 마무리한다.`
      : `질문은 필수가 아니다. 설명만으로 자연스럽게 끝나면 질문 없이 마무리한다.`;

    const prompt = `${systemPrompt || "너는 BOOKMATE의 AI 독서파트너 모아이다. 한국어로 자연스럽게 답한다."}

현재 책: ${book || '미정'}
대화 채널: ${channel === 'live' ? 'LIVE 독서모임' : '개인 독서 대화'}
요청 유형: ${requestKind || '일반 대화'}

최근 대화:
${recent || String(conversationText || '').slice(-4500) || '없음'}

사용자의 마지막 요청:
${latestMessage}

${channelGuide}
${repairGuide}
${questionGuide}

공통 답변 지침:
1. 사용자의 마지막 말에 바로 이어서 답한다.
2. 최근 대화에서 이미 한 인사·표현·요약을 반복하지 않는다.
3. 세부 장면을 확실히 모르면 지어내지 말고 사용자가 말한 정보 범위에서 답한다.
4. 답변은 완결된 2~4문장으로 작성한다. 문장을 중간에서 끝내지 않는다.
5. 질문은 최대 하나이며, 필요하지 않으면 질문 없이 끝낸다.
6. 참여자 이름과 발언을 혼동하지 않는다.`;

    const models = [...new Set([process.env.GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-2.0-flash'])];
    let lastError;

    for (const model of models) {
      try {
        let generated = await generate(ai, model, prompt);
        let repaired = false;

        if (looksIncomplete(generated.reply, generated.finishReason)) {
          generated = await repairIncompleteReply(ai, model, prompt, generated.reply);
          repaired = true;
        }

        const reply = stripConversationRestart(cleanReply(generated.reply), Boolean(recent || conversationText));
        if (reply && !looksIncomplete(reply, generated.finishReason)) {
          return json(200, {
            reply,
            model,
            finishReason: generated.finishReason || 'STOP',
            repaired
          });
        }
        lastError = new Error(`Incomplete or empty response from ${model} (${generated.finishReason || 'unknown'})`);
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
