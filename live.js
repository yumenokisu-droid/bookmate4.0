const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const KEY = 'bookmate_live_room_rc3_people_first';
const REPORT_KEY = 'bookmate_live_reports';
const CURRENT_USER = '달빛독서가';
const discussionLeader = localStorage.getItem('bookmate_current_discussion_leader') || '문장수집가';

const defaultState = {
  seconds: 1122,
  running: true,
  isHost: true,
  aiRole: '퍼실리테이터',
  book: { title:'작별인사', author:'김영하', prompt:'기억이 흔들리는 순간에도 인간다움은 유지될 수 있을까요?' },
  micOn: true,
  participants: [
    {name:'달빛독서가', status:'마이크 켜짐', online:true, speaking:false, avatar:'assets/characters/moa-1.png'},
    {name:'문장수집가', status:'토론 리더', online:true, speaking:false, avatar:'assets/characters/moa-2.png'},
    {name:'책읽는고양이', status:'발언 중', online:true, speaking:true, avatar:'assets/characters/moa-3.png'},
    {name:'초록책갈피', status:'채팅 참여', online:true, speaking:false, avatar:'assets/characters/moa-4.png'},
    {name:'AI 모아', status:'퍼실리테이터', online:true, speaking:false, avatar:'assets/characters/ai-moa.png'}
  ],
  messages: [
    {user:'AI 모아', type:'ai', text:'오늘은 『작별인사』를 중심으로 기억과 선택이 인간다움에 어떤 영향을 주는지 이야기해볼게요. 먼저 가장 오래 남은 장면부터 편하게 말씀해 주세요.'},
    {user:'문장수집가', type:'other', text:'저는 마지막 부분이 가장 오래 남았어요. 슬프다기보다 조용히 멀어지는 느낌이 들어서 더 쓸쓸했습니다.'},
    {user:'달빛독서가', type:'me', text:'저도 비슷했어요. 그런데 저는 그 선택이 관계를 포기한 게 아니라, 오히려 끝까지 지키려는 방식처럼 느껴졌어요.'},
    {user:'책읽는고양이', type:'voice', label:'음성 요약', text:'기억은 정체성을 구성하지만, 기억이 흔들리는 순간에도 타인을 대하는 태도와 선택이 인간다움을 보여준다는 의견입니다.'},
    {user:'초록책갈피', type:'other', text:'그렇다면 기억을 잃어도 같은 사람이라고 할 수 있을까요? 저는 관계가 남아 있다면 어느 정도는 그렇다고 생각해요.'},
    {user:'AI 모아', type:'ai', text:'지금 의견은 크게 두 갈래로 보입니다. 기억이 정체성의 중심이라는 관점과, 기억보다 관계 속 선택이 인간다움을 보여준다는 관점이에요. 혹시 여러분은 둘 중 무엇이 더 중요하다고 생각하시나요?'},
    {user:'달빛독서가', type:'me', text:'저는 선택이요. 기억이 없어져도 누군가를 배려하는 태도는 남을 수 있다고 봐요.'},
    {user:'문장수집가', type:'other', text:'저는 반대로 기억이 어느 정도는 필요하다고 생각해요. 기억이 없다면 선택의 이유도 달라질 것 같아요.'}
  ]
};

let state = loadState();
let timer = null;
let aiBusy = false;

function normalizeMessages(messages){
  const cleaned=[];
  for(const raw of Array.isArray(messages)?messages:[]){
    const message={...raw, text:String(raw?.text||'').trim()};
    if(!message.text || message.text==='생각을 정리하고 있어요…') continue;
    const previous=cleaned[cleaned.length-1];
    if(previous && previous.user===message.user && previous.type===message.type && previous.text===message.text) continue;
    cleaned.push(message);
  }
  return cleaned.slice(-80);
}
function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    const merged = saved ? {...defaultState, ...saved, book:{...defaultState.book, ...(saved.book||{})}} : structuredClone(defaultState);
    merged.messages = normalizeMessages(merged.messages);
    return merged;
  } catch { return structuredClone(defaultState); }
}
function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function formatTime(s){ return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function toast(text){ const el=$('toast'); el.textContent=text; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800); }
function participant(name){ return state.participants.find(p=>p.name===name); }
function avatarMarkup(name){ const p=participant(name); return `<span class="chat-avatar"><img src="${esc(p?.avatar || 'assets/characters/moa-1.png')}" alt="${esc(name)}"></span>`; }

function messageMarkup(message){
  const type = message.type || (message.user===CURRENT_USER ? 'me' : 'other');
  const isMe = type === 'me' || message.user === CURRENT_USER;
  const rowClass = isMe ? 'message-row me' : `message-row ${type}`;
  const bubbleLabel = message.label ? `<span class="voice-summary-label">${esc(message.label)} · </span>` : '';
  const badge = type==='ai' ? '<span class="ai-badge">AI</span>' : '';
  const content = `<div class="message-content"><div class="message-meta"><strong>${esc(message.user)}</strong>${badge}</div><div class="message-bubble">${bubbleLabel}${esc(message.text)}</div></div>`;
  return `<article class="${rowClass}">${isMe ? content + avatarMarkup(message.user) : avatarMarkup(message.user) + content}</article>`;
}


function syncDiscussionLeaderUI(){
  const el=$('discussionLeaderName'); if(el) el.textContent=discussionLeader;
  document.querySelectorAll('.host-only').forEach(node=>node.dataset.roleLabel='토론 리더');
}
function render(){
  $('liveClock').textContent = formatTime(state.seconds);
  $('liveStatusPill').textContent = state.running ? 'LIVE 진행중' : 'LIVE 준비중';
  $('currentBookTitle').textContent = `『${state.book.title}』`;
  $('currentBookAuthor').textContent = state.book.author;
  $('currentPrompt').textContent = state.book.prompt;
  $('liveChatStream').innerHTML = state.messages.map(messageMarkup).join('');
  $('liveChatStream').scrollTop = $('liveChatStream').scrollHeight;
  $('participantCount').textContent = `${state.participants.length}명`;
  $('participantList').innerHTML = state.participants.map(p=>`<div class="participant-row ${p.speaking?'speaking':''}"><span class="participant-avatar"><img src="${esc(p.avatar)}" alt="${esc(p.name)}"></span><div><strong>${esc(p.name)}</strong><small>${esc(p.status)}</small></div><i class="online-dot" title="접속 중"></i></div>`).join('');
  $('micToggle').checked = state.micOn;
  $('micStateText').textContent = state.micOn ? '켜짐' : '꺼짐';
  document.body.classList.toggle('is-participant', !state.isHost);
  document.querySelectorAll('input[name="liveAiRole"]').forEach(r=>r.checked=r.value===state.aiRole);
}

function addMessage(user,text,type,label=''){
  const cleanText=String(text||'').trim();
  if(!cleanText) return;
  const previous=state.messages[state.messages.length-1];
  if(previous && previous.user===user && previous.type===type && previous.text===cleanText) return;
  state.messages.push({user,text:cleanText,type,label});
  state.messages=normalizeMessages(state.messages);
  saveState();
  render();
}
function addAI(text){ addMessage('AI 모아',text,'ai'); }
function recentConversation(){ return state.messages.slice(-14).map(m=>`${m.user}: ${m.text}`).join('\n'); }
function setAiThinking(active){
  const stream=$('liveChatStream');
  stream?.querySelector('[data-ai-thinking]')?.remove();
  if(!active || !stream) return;
  stream.insertAdjacentHTML('beforeend', `<article class="message-row ai ai-thinking" data-ai-thinking="true">${avatarMarkup('AI 모아')}<div class="message-content"><div class="message-meta"><strong>AI 모아</strong><span class="ai-badge">AI</span></div><div class="message-bubble"><span class="thinking-dots"><i></i><i></i><i></i></span><span>대화를 살펴보고 있어요</span></div></div></article>`);
  stream.scrollTop=stream.scrollHeight;
}

function fallbackReply(kind){
  if(kind.includes('다음')) return `새 질문을 제안할게요. 『${state.book.title}』에서 인물이 자신의 정체성을 가장 분명하게 드러낸 장면은 어디였나요? 그 장면을 선택한 이유도 함께 이야기해보세요.`;
  if(kind.includes('요약')) return '현재까지는 기억이 정체성을 만든다는 의견과, 기억보다 관계 속 태도와 선택이 인간다움을 보여준다는 의견이 나왔습니다. 참여자들은 마지막 장면과 인물의 선택을 중심으로 서로 다른 해석을 나누고 있습니다.';
  if(kind.includes('참여')) return '아직 의견을 말하지 않은 분은 “가장 기억에 남은 장면” 한 가지만 골라 짧게 말씀해 주세요. 정답을 찾기보다 서로 다른 감상을 비교해보면 좋겠습니다.';
  return `방금 의견은 『${state.book.title}』에서 기억 자체보다 관계 속에서 내리는 선택이 인간다움을 드러낼 수 있다는 해석과 연결됩니다. 다른 참여자의 관점과 나란히 놓아보면 같은 장면이 서로 다르게 읽힌다는 점도 선명해져요.`;
}

async function callMoa(kind,userMessage=''){
  if(state.aiRole==='없음') return toast('현재 AI 없음 모드입니다.');
  if(aiBusy) return toast('AI 모아가 이미 응답을 준비 중이에요.');
  aiBusy=true;
  const status=$('apiStatus');
  if(status) status.textContent='AI 응답 중…';
  setAiThinking(true);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),45000);
  try {
    const roleGuide = state.aiRole==='보조'
      ? '사용자가 직접 모아를 부르거나 질문했을 때만 답하고, 진행을 주도하지 않는다.'
      : '토론 리더를 대신하지 말고, 필요한 순간에만 대화를 정리하거나 한 가지 질문을 제안한다.';
    const systemPrompt = `너는 BOOKMATE의 AI 독서파트너 모아다. 현재 LIVE 독서토론에서 ${state.aiRole} 역할을 맡고 있다. ${roleGuide} 현재 주제도서는 『${state.book.title}』, 저자는 ${state.book.author}, 발제문은 "${state.book.prompt}"이다. 새로 인사하거나 토론을 처음부터 시작하지 않는다. 가장 최근 참여자의 구체적인 의견을 먼저 짚고 작품의 주제와 연결한다. 최근 대화에서 이미 말한 내용을 그대로 반복하지 않는다. 참여자의 이름과 의견을 정확히 구분한다. 매번 질문하지 말고, 필요한 순간에만 질문을 한 개 제안한다. 한국어로 자연스럽고 완결된 2~4문장으로 답한다.`;
    const response = await fetch('/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      signal:controller.signal,
      body:JSON.stringify({
        message:userMessage || `요청 유형: ${kind}`,
        requestKind:kind,
        channel:'live',
        history:state.messages.slice(-14).map(m=>({
          role:m.type==='ai'?'model':'user',
          parts:[{text:`${m.user}: ${m.text}`}]
        })),
        book:`${state.book.title} / ${state.book.author}`,
        systemPrompt,
        conversationText:recentConversation()
      })
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.detail||data.error||`HTTP ${response.status}`);
    let reply=String(data.reply||'').trim();
    const lastAI=[...state.messages].reverse().find(m=>m.type==='ai')?.text||'';
    if(!reply || reply===lastAI) reply=fallbackReply(`${kind} 다른 표현`);
    addAI(reply);
    if(status) status.textContent=`AI 연결됨${data.model?` · ${data.model}`:''}`;
  } catch(error) {
    const fallback=fallbackReply(kind);
    const lastAI=[...state.messages].reverse().find(m=>m.type==='ai')?.text||'';
    addAI(fallback===lastAI ? '방금 나온 의견을 바탕으로, 다른 참여자에게는 이 장면이 어떻게 읽혔는지 들어보면 좋겠습니다.' : fallback);
    if(status) status.textContent=error?.name==='AbortError'?'응답 지연 · 기본 모드':'기본 응답 모드';
    console.warn('[BOOKMATE LIVE AI]', error);
  } finally {
    clearTimeout(timeout);
    setAiThinking(false);
    aiBusy=false;
    saveState();
    render();
  }
}

function startTimer(){ if(timer) return; state.running=true; timer=setInterval(()=>{state.seconds++; $('liveClock').textContent=formatTime(state.seconds); saveState();},1000); }

function boot(){
  render(); startTimer();
  $('liveBackLink').onclick=()=>{ try{sessionStorage.setItem('bookmate_return_live','1')}catch{} location.href='index.html#live'; };
  $('liveRoomForm').onsubmit=e=>{ e.preventDefault(); const value=$('liveRoomInput').value.trim(); if(!value) return; addMessage(CURRENT_USER,value,'me'); $('liveRoomInput').value=''; const calledMoa=/모아(야|에게|,|\s)|@모아/.test(value); const asksQuestion=/[?？]$/.test(value) || /(어떻게|왜|무엇|맞아|궁금|정리해|설명해)/.test(value); if((state.aiRole==='퍼실리테이터' && (calledMoa||asksQuestion)) || (state.aiRole==='보조' && calledMoa)) callMoa('사용자 채팅에 답변',value); };
  $('emojiBtn').onclick=()=>{ $('emojiPicker').hidden=!$('emojiPicker').hidden; };
  $('emojiPicker').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{ $('liveRoomInput').value += `${btn.textContent} `; $('liveRoomInput').focus(); $('emojiPicker').hidden=true; });
  $('attachBtn').onclick=()=>toast('자료 첨부는 게시판 자료와 연결할 예정입니다.');
  $('micToggle').onchange=e=>{ state.micOn=e.target.checked; saveState(); render(); };
  $('micBtn').onclick=()=>{
    if(!state.micOn) return toast('오른쪽 내 음성 설정에서 마이크를 켜주세요.');
    if(!$('voiceSummaryToggle').checked) return toast('음성 요약 기능이 꺼져 있어요.');
    $('micBtn').classList.add('recording'); $('micBtn').textContent='●'; toast('음성 발언을 인식하고 있어요…');
    setTimeout(()=>{ $('micBtn').classList.remove('recording'); $('micBtn').textContent='🎤'; addMessage(CURRENT_USER,'기억은 흔들릴 수 있지만, 결국 타인을 대하는 태도와 선택이 한 사람의 인간다움을 보여준다고 생각합니다.','voice','음성 요약'); },1200);
  };
  ['speakerVolume','micVolume'].forEach(id=>$(id).oninput=e=>$(id+'Out').textContent=e.target.value);
  $('changeBookBtn').onclick=()=>$('bookDialog').showModal();
  $('applyBookBtn').onclick=()=>{
    const title=$('bookTitleInput').value.trim(), author=$('bookAuthorInput').value.trim(), prompt=$('bookPromptInput').value.trim();
    if(!title||!author||!prompt) return toast('책 제목, 저자, 발제문을 모두 입력해 주세요.');
    state.book={title,author,prompt}; saveState(); $('bookDialog').close(); render();
    addMessage('BOOKMATE','주제도서가 변경되었습니다. AI 모아가 새 주제도서와 발제문을 인식했습니다.','system');
    if(state.aiRole!=='없음') callMoa('주제도서 변경 안내와 새 토론 시작 질문');
  };
  document.querySelectorAll('input[name="liveAiRole"]').forEach(r=>r.onchange=e=>{ state.aiRole=e.target.value; saveState(); render(); toast(`AI 역할을 ${state.aiRole}(으)로 변경했습니다.`); });
  $('startPromptBtn').onclick=()=>{ addMessage('BOOKMATE',`${discussionLeader} 토론 리더가 첫 발제를 시작했습니다.`, 'system'); if(state.aiRole!=='없음') callMoa('첫 발제문을 소개하고 참여자에게 의견을 요청해줘'); };
  $('pollBtn').onclick=()=>{ addMessage('BOOKMATE','토론 리더가 의견 투표를 시작했습니다. 채팅으로 A 또는 B를 남겨주세요.', 'system'); toast('투표를 시작했어요.'); };
  syncDiscussionLeaderUI();
  $('nextPromptBtn').onclick=()=>callMoa('다음 질문 제안');
  $('summaryBtn').onclick=()=>callMoa('현재까지 대화 요약');
  $('encourageBtn').onclick=()=>callMoa('참여 유도 질문');
  $('finishBtn').onclick=()=>{
    const reports=JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');
    const now=new Date();
    const participantNames=state.participants.map(p=>p.name);
    const report={
      schemaVersion:2,
      id:Date.now(),
      title:`${state.book.title} 독서모임`,
      book:state.book.title,
      author:state.book.author,
      createdAt:now.toISOString(),
      date:now.toLocaleString('ko-KR',{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'}),
      durationSeconds:state.seconds,
      duration:formatTime(state.seconds),
      participants:participantNames,
      discussionLeader,
      oneLine:'같은 책을 읽었지만, 서로 다른 삶이 만나 하나의 이야기를 완성한 시간.',
      discussionPrompts:[state.book.prompt],
      summaryPoints:[
        '기억이 한 사람의 정체성을 구성하는 핵심 요소인지 함께 살펴보았습니다.',
        '기억이 흔들리더라도 관계 속 태도와 선택이 인간다움을 보여줄 수 있다는 의견이 나왔습니다.',
        '작품의 마지막 장면을 관계의 포기가 아닌 끝까지 지키려는 선택으로 해석하기도 했습니다.',
        '같은 장면을 두고도 기억, 관계, 선택의 중요성에 대한 서로 다른 경험과 관점이 이어졌습니다.'
      ],
      differentViews:[
        {label:'관점 A',text:'기억이 인간을 만든다. 기억이 없다면 선택의 이유와 정체성도 달라질 수 있다.'},
        {label:'관점 B',text:'기억보다 선택이 인간다움을 만든다. 기억이 사라져도 타인을 대하는 태도는 남을 수 있다.'}
      ],
      highlightQuote:{text:'기억보다 선택이 결국 나를 만든다고 생각해요.',speaker:'문장수집가'},
      keywords:['기억','선택','인간다움','정체성'],
      nextQuestion:'기억을 모두 잃더라도 같은 사람이라고 할 수 있을까요?',
      messages:state.messages
    };
    reports.unshift(report);
    localStorage.setItem(REPORT_KEY,JSON.stringify(reports.slice(0,20)));
    toast('독서모임 기록을 아카이브에 저장했어요.');
  };
}
document.addEventListener('DOMContentLoaded',()=>{ if($('liveClock')) boot(); });
