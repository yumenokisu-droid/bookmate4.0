const shareStore = globalThis.__BOOKMATE_SHARE_STORE__ || new Map();
globalThis.__BOOKMATE_SHARE_STORE__ = shareStore;

function escapeHTML(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderSharePage(item) {
  const title = escapeHTML(item?.title || 'BOOKMATE AI 대화');
  const messages = Array.isArray(item?.history)
    ? item.history.slice(1).map((message) => {
        const isAI = message.role === 'model';
        const role = isAI ? 'AI 모아' : '나';
        const text = message.parts?.[0]?.text || '';
        return `<div class="msg ${isAI ? 'ai' : 'user'}"><b>${role}</b><p>${escapeHTML(text).replace(/\n/g, '<br>')}</p></div>`;
      }).join('')
    : '';

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f7f4ec;color:#1f2d2b;margin:0;padding:32px}.wrap{max-width:760px;margin:auto;background:white;border:1px solid #e8e1d2;border-radius:24px;padding:28px;box-shadow:0 12px 30px rgba(0,0,0,.06)}h1{font-size:22px;margin:0 0 8px}.sub{font-size:13px;color:#6b7280;margin-bottom:24px}.msg{border-radius:18px;padding:14px 16px;margin:12px 0;font-size:14px;line-height:1.65}.msg b{display:block;font-size:12px;margin-bottom:6px}.msg p{margin:0}.ai{background:#f3f0e8;border:1px solid #e8e1d2}.user{background:#1f2d2b;color:white;margin-left:10%}.brand{font-size:12px;color:#78906f;font-weight:700;margin-top:24px}</style></head><body><main class="wrap"><h1>${title}</h1><div class="sub">AI 독서 파트너 모아와 나눈 대화입니다.</div>${messages}<div class="brand">BOOKMATE · AI 독서 파트너</div></main></body></html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'POST') {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const item = JSON.parse(event.body || '{}');
    shareStore.set(id, item);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: true, id, url: `/share/${id}` })
    };
  }

  const id = event.queryStringParameters?.id || event.path.split('/').pop();
  const item = shareStore.get(id);
  if (!item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '공유 대화를 찾을 수 없습니다. 무료 서버리스 임시 저장 방식이라 일정 시간이 지나면 링크가 사라질 수 있습니다.'
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: renderSharePage(item)
  };
};
