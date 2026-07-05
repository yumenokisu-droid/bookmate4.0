const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY = 'bookmate_live_room_v4_api';
const REPORT_KEY = 'bookmate_live_reports';
const BOOK_CONTEXT = {
  club: '우리의 문학',
  book: '작별인사',
  author: '김영하',
  topic: '인간다움, 선택, 작별의 의미',
  meeting: '7월 11일 오후 8시 LIVE ROOM'
};
const defaultState = {
  seconds: 0,
  running: false,
  aiRole: '퍼실리테이터',
  promptIndex: 0,
  participants: [
    {name:'달빛독서가', status:'음성 ON', count:2, avatar:'assets/characters/moa-1.png'},
    {name:'문장수집가', status:'채팅 참여', count:1, avatar:'assets/characters/moa-2.png'},
    {name:'책읽는고양이', status:'음성 대기', count:0, avatar:'assets/characters/moa-3.png'},
    {name:'초록책갈피', status:'읽는 중', count:0, avatar:'assets/characters/moa-4.png'},
    {name:'AI 모아', status:'퍼실리테이터', count:3, avatar:'assets/characters/ai-moa.png'}
  ],
  queue: ['달빛독서가','문장수집가','책읽는고양이','초록책갈피'],
  messages: [
    {user:'AI 모아', type:'ai', text:'안녕하세요. 오늘 LIVE 독서토론을 시작할게요. 『작별인사』를 읽으며 인간다움과 선택의 의미를 함께 이야기해봐요.'},
    {user:'달빛독서가', type:'voice-summary', text:'(AI 음성인식 요약) 저는 마지막 장면에서 인물이 보여준 선택이 가장 인상 깊었고, 제 경험과 연결되어 더 공감되었습니다.'},
    {user:'문장수집가', type:'user', text:'저도 그 부분이 좋았어요. 다만 저는 조금 더 쓸쓸하게 느껴졌어요.'}
  ]
};
let state = load();
let timer = null;
let aiBusy = false;
function load(){try{return {...defaultState, ...(JSON.parse(localStorage.getItem(KEY))||{})}}catch(e){return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY, JSON.stringify(state));}
function toast(t){const el=$('toast'); if(!el) return; el.textContent=t; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800)}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function findParticipant(name){return state.participants.find(p=>p.name===name)}
function avatar(user){const p=findParticipant(user); const src=p?.avatar || (user.includes('AI')?'assets/characters/ai-moa.png':'assets/characters/moa-1.png'); return `<div class="msg-avatar moa-avatar"><img src="${esc(src)}" alt="${esc(user)}"></div>`}
function render(){
  $('liveClock').textContent = fmt(state.seconds);
  $('liveStatusPill').textContent = state.running ? 'LIVE 진행중' : 'LIVE 준비중';
  $('liveChatStream').innerHTML = state.messages.map(m => `<div class="live-msg ${m.type||''}">${avatar(m.user)}<div class="msg-bubble"><small>${esc(m.user)}</small><p>${esc(m.text)}</p></div></div>`).join('');
  $('liveChatStream').scrollTop = $('liveChatStream').scrollHeight;
  $('participantList').innerHTML = state.participants.map(p=>`<div class="participant"><span class="participant-avatar"><img src="${esc(p.avatar)}" alt="${esc(p.name)}"></span><div><strong>${esc(p.name)}</strong><p>${esc(p.status)} · 발언 ${p.count}회</p></div></div>`).join('');
  $('speakerQueue').innerHTML = state.queue.map((n,i)=>`<li><span>${i+1}</span>${esc(n)}</li>`).join('');
  const radio = document.querySelector(`input[name="liveAiRole"][value="${state.aiRole}"]`); if(radio) radio.checked=true;
  updateRoleDesc();
}
function add(user,text,type='user'){
  state.messages.push({user,text,type});
  const p=findParticipant(user); if(p && type !== 'voice-summary') p.count = Number(p.count||0)+1;
  save(); render();
}
function ai(text){add('AI 모아', text, 'ai')}
function fallbackReply(kind){
  const recent = state.messages.slice(-5).map(m=>m.text).join(' ');
  if(kind.includes('발제')) return `오늘의 발제문입니다. 『${BOOK_CONTEXT.book}』에서 인물이 선택을 내리는 순간을 떠올려보세요. 그 선택은 인간다움을 지키기 위한 행동이었을까요, 아니면 관계를 포기하지 않기 위한 행동이었을까요? 각자 인상 깊은 장면 하나와 연결해서 이야기해보면 좋겠습니다.`;
  if(kind.includes('요약')) return `현재까지의 흐름을 정리하면, 마지막 장면의 쓸쓸함과 인물의 선택에 대한 공감이 중심이었습니다. 특히 “이해되지만 마음이 아프다”는 반응이 나왔고, 다음에는 그 선택이 관계를 지키는 방식이었는지 이야기해볼 수 있습니다.`;
  if(kind.includes('균형')) return '발언 균형을 보면 달빛독서가님과 문장수집가님의 의견이 먼저 나왔습니다. 다음 순서는 책읽는고양이님과 초록책갈피님에게 “가장 기억나는 장면 한 문장”부터 가볍게 물어보면 좋겠습니다.';
  if(kind.includes('참여')) return '아직 말하지 않은 분도 부담 없이 참여할 수 있도록 질문을 낮춰볼게요. “이 책에서 가장 오래 남은 감정은 무엇인가요?”처럼 짧게 답할 수 있는 질문부터 시작해보세요.';
  return `좋아요. 방금 대화 흐름을 보면 ${recent ? '인물의 선택과 마지막 장면에 대한 감상이 이어지고 있어요.' : '아직 대화가 시작되는 단계예요.'} 이 부분을 책의 주제인 인간다움과 연결해보면 토론이 더 깊어질 수 있습니다.`;
}
function recentConversation(){return state.messages.slice(-10).map(m=>`${m.user}: ${m.text}`).join('\n')}
async function callMoa(kind, userMessage=''){
  if(state.aiRole === '없음') return toast('AI 없음 모드입니다.');
  if(aiBusy) return toast('AI 모아가 응답을 준비 중이에요.');
  aiBusy = true;
  ai('생각을 정리하고 있어요…');
  try{
    const systemPrompt = `너는 BOOKMATE의 AI 독서파트너 모아이며, LIVE 독서토론 ${state.aiRole} 역할이다. 모임장은 공모전 시연 중이다. 책과 최근 채팅 맥락을 바탕으로 한국어로 자연스럽고 구체적으로 답한다. 버튼 기능 요청이면 바로 결과만 제시한다. 너무 길게 설명하지 말고 4~7문장으로 답한다.`;
    const message = `${kind}\n사용자 입력: ${userMessage || '없음'}\n요청: 책 『${BOOK_CONTEXT.book}』 독서모임에 맞게 응답해줘.`;
    const res = await fetch('/.netlify/functions/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message, book:`${BOOK_CONTEXT.book} / ${BOOK_CONTEXT.author}`, systemPrompt, conversationText: recentConversation() })
    });
    const data = await res.json().catch(()=>({}));
    const reply = data.reply || fallbackReply(kind);
    state.messages.pop();
    ai(reply);
    if(!data.reply) toast('API 응답 대신 기본 응답을 표시했어요.');
  }catch(e){
    state.messages.pop();
    ai(fallbackReply(kind));
    toast('API 연결 실패: 기본 응답으로 대체했어요.');
  }finally{
    aiBusy = false;
    save(); render();
  }
}
function startTimer(){ if(timer) return; state.running=true; timer=setInterval(()=>{state.seconds++; save(); render();},1000); render(); }
function stopTimer(){clearInterval(timer); timer=null; state.running=false; save(); render();}
function updateRoleDesc(){
 const desc = {
  '퍼실리테이터':'AI가 발제문, 발언순서, 시간관리, 참여유도를 실제 API 응답으로 돕습니다.',
  '보조':'AI는 “모아야”처럼 호출될 때만 줄거리, 등장인물, 요약 등을 돕습니다.',
  '없음':'사람들끼리만 진행하고 AI는 대화에 개입하지 않습니다.'
 };
 $('roleDesc').textContent = desc[state.aiRole] || desc['퍼실리테이터'];
}
function createReport(){
  const reports = JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');
  const report = {
    id: Date.now(), title: '우리의 문학 LIVE 토론 리포트', book: BOOK_CONTEXT.book, date: new Date().toLocaleString('ko-KR'), duration: fmt(state.seconds),
    participants: state.participants.filter(p=>p.name!=='AI 모아').map(p=>p.name),
    summary: '인간다움의 기준, 마지막 장면의 인상, 개인 경험과 작품의 연결에 대한 의견이 중심이 되었습니다.',
    keywords: ['인간다움','선택','기억','공감'], messages: state.messages
  };
  reports.unshift(report); localStorage.setItem(REPORT_KEY, JSON.stringify(reports.slice(0,20)));
  callMoa('종료 리포트 생성: 최근 대화를 바탕으로 모임장이 바로 저장할 수 있는 5문장 리포트와 키워드 4개를 만들어줘.');
  toast('아카이브에 LIVE 리포트를 저장했어요.');
}
function boot(){
  $('liveRoomForm').onsubmit = e => {e.preventDefault(); const v=$('liveRoomInput').value.trim(); if(!v) return; add('달빛독서가',v,'user'); $('liveRoomInput').value=''; if(state.aiRole==='퍼실리테이터' || (state.aiRole==='보조' && v.includes('모아'))) callMoa('사용자 채팅에 답변', v);};
  $('emojiBtn').onclick = () => { $('liveRoomInput').value += ' 😊'; $('liveRoomInput').focus(); };
  $('attachBtn').onclick = () => toast('공모전 시연용: 자료 첨부 기능은 게시판 자료실과 연결됩니다.');
  $('micBtn').onclick = () => { if(state.running) stopTimer(); else {startTimer(); callMoa('LIVE 시작 멘트와 첫 질문 생성');} };
  $('nextPromptBtn').onclick = () => callMoa('다음 발제문 생성');
  $('summaryBtn').onclick = () => callMoa('현재까지 요약');
  $('balanceBtn').onclick = () => callMoa('발언 균형 분석과 다음 순서 제안');
  $('encourageBtn').onclick = () => callMoa('조용한 참여자에게 부담 없는 질문 제안');
  $('finishBtn').onclick = createReport;
  $('simulateVoiceBtn').onclick = () => { if(!$('voiceSummaryToggle').checked) return toast('AI 음성인식 요약이 꺼져 있어요.'); add('책읽는고양이','(AI 음성인식 요약) 저는 주인공의 선택이 쉽게 이해되지는 않았지만, 관계를 지키려는 마음이 있었다고 느꼈습니다.','voice-summary'); };
  document.querySelectorAll('input[name="liveAiRole"]').forEach(r=>r.onchange=e=>{state.aiRole=e.target.value; save(); render(); callMoa(`AI 역할 변경 안내: ${state.aiRole}`)});
  render();
}
document.addEventListener('DOMContentLoaded', boot);
