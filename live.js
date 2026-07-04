const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY = 'bookmate_live_room_v2';
const REPORT_KEY = 'bookmate_live_reports';
const defaultState = {
  seconds: 0,
  running: false,
  aiRole: '퍼실리테이터',
  promptIndex: 0,
  prompts: [
    '인간다움의 기준은 무엇이라고 생각하나요?',
    '가장 인상 깊었던 장면과 그 이유를 나눠볼까요?',
    '이 책의 결말을 다르게 쓴다면 어떻게 바꾸고 싶나요?',
    '등장인물의 선택 중 가장 이해하기 어려웠던 부분은 무엇인가요?'
  ],
  participants: [
    {name:'윤', status:'음성 ON', count:2},
    {name:'민지', status:'채팅 참여', count:1},
    {name:'수현', status:'음성 대기', count:0},
    {name:'지훈', status:'읽는 중', count:0},
    {name:'AI 모아', status:'퍼실리테이터', count:3}
  ],
  queue: ['윤','민지','수현','지훈'],
  messages: [
    {user:'AI 모아', type:'ai', text:'안녕하세요. 오늘 LIVE 독서토론을 시작할게요. 첫 질문입니다. “인간다움의 기준은 무엇이라고 생각하나요?”'},
    {user:'윤', type:'voice-summary', text:'(AI 음성인식 요약) 저는 마지막 장면에서 인물이 보여준 선택이 가장 인상 깊었고, 제 경험과 연결되어 더 공감되었습니다.'},
    {user:'민지', type:'user', text:'저도 그 부분이 좋았어요. 다만 저는 조금 더 쓸쓸하게 느껴졌어요.'}
  ]
};
let state = load();
let timer = null;
function load(){try{return {...defaultState, ...(JSON.parse(localStorage.getItem(KEY))||{})}}catch(e){return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY, JSON.stringify(state));}
function toast(t){const el=$('toast'); if(!el) return; el.textContent=t; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800)}
function render(){
  $('liveClock').textContent = fmt(state.seconds);
  $('liveStatusPill').textContent = state.running ? 'LIVE 진행중' : 'LIVE 준비중';
  $('liveChatStream').innerHTML = state.messages.map(m => `<div class="live-msg ${m.type||''}"><div class="msg-avatar">${esc(m.user[0])}</div><div class="msg-bubble"><small>${esc(m.user)}</small><p>${esc(m.text)}</p></div></div>`).join('');
  $('liveChatStream').scrollTop = $('liveChatStream').scrollHeight;
  $('participantList').innerHTML = state.participants.map(p=>`<div class="participant"><span>${esc(p.name[0])}</span><div><strong>${esc(p.name)}</strong><p>${esc(p.status)} · 발언 ${p.count}회</p></div></div>`).join('');
  $('speakerQueue').innerHTML = state.queue.map((n,i)=>`<li><span>${i+1}</span>${esc(n)}</li>`).join('');
  const radio = document.querySelector(`input[name="liveAiRole"][value="${state.aiRole}"]`); if(radio) radio.checked=true;
  updateRoleDesc();
}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function add(user,text,type='user'){state.messages.push({user,text,type}); save(); render();}
function ai(text){add('AI 모아', text, 'ai')}
function startTimer(){ if(timer) return; state.running=true; timer=setInterval(()=>{state.seconds++; save(); render();},1000); render(); }
function stopTimer(){clearInterval(timer); timer=null; state.running=false; save(); render();}
function updateRoleDesc(){
 const desc = {
  '퍼실리테이터':'AI가 발제문, 발언순서, 시간관리, 참여유도를 자연스럽게 진행합니다.',
  '보조':'AI는 “모아야”처럼 호출될 때만 줄거리, 등장인물, 요약 등을 돕습니다.',
  '없음':'사람들끼리만 진행하고 AI는 대화에 개입하지 않습니다.'
 };
 $('roleDesc').textContent = desc[state.aiRole] || desc['퍼실리테이터'];
}
function createReport(){
  const reports = JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');
  const report = {
    id: Date.now(),
    title: '우리의 문학 LIVE 토론 리포트',
    book: '작별인사',
    date: new Date().toLocaleString('ko-KR'),
    duration: fmt(state.seconds),
    participants: state.participants.filter(p=>p.name!=='AI 모아').map(p=>p.name),
    summary: '인간다움의 기준, 마지막 장면의 인상, 개인 경험과 작품의 연결에 대한 의견이 중심이 되었습니다.',
    keywords: ['인간다움','선택','기억','공감'],
    messages: state.messages
  };
  reports.unshift(report);
  localStorage.setItem(REPORT_KEY, JSON.stringify(reports.slice(0,20)));
  ai('종료 리포트가 생성되었습니다. 모임 아카이브에서 다시 확인할 수 있어요.');
  toast('아카이브에 LIVE 리포트를 저장했어요.');
}
function boot(){
  $('liveRoomForm').onsubmit = e => {e.preventDefault(); const v=$('liveRoomInput').value.trim(); if(!v) return; add('나',v,'user'); $('liveRoomInput').value=''; if(state.aiRole==='보조' && v.includes('모아')) ai('네, 이 장면은 인물의 선택과 기억의 의미를 함께 보면 이해하기 쉬워요.');};
  $('micBtn').onclick = () => { if(state.running) stopTimer(); else {startTimer(); ai('LIVE 진행을 시작합니다. 채팅과 음성 요약이 함께 기록됩니다.')} };
  $('nextPromptBtn').onclick = () => {state.promptIndex=(state.promptIndex+1)%state.prompts.length; ai(`${state.promptIndex+1}번 발제문입니다. ${state.prompts[state.promptIndex]}`)};
  $('summaryBtn').onclick = () => ai('현재까지는 마지막 장면에 대한 공감, 인간다움의 기준, 인물의 선택에 관한 의견이 나왔습니다.');
  $('balanceBtn').onclick = () => ai('발언 균형을 보면 윤님과 AI 발언이 많고, 수현님과 지훈님의 의견이 아직 적습니다. 다음 순서로 넘겨보면 좋아요.');
  $('encourageBtn').onclick = () => ai('아직 말하지 않은 분도 한 문장만 남겨주세요. “가장 기억나는 장면”부터 시작해도 괜찮아요.');
  $('finishBtn').onclick = createReport;
  $('simulateVoiceBtn').onclick = () => { if(!$('voiceSummaryToggle').checked) return toast('AI 음성인식 요약이 꺼져 있어요.'); add('수현','(AI 음성인식 요약) 저는 주인공의 선택이 쉽게 이해되지는 않았지만, 관계를 지키려는 마음이 있었다고 느꼈습니다.','voice-summary'); };
  document.querySelectorAll('input[name="liveAiRole"]').forEach(r=>r.onchange=e=>{state.aiRole=e.target.value; save(); render(); ai(`AI 역할이 ${state.aiRole}(으)로 변경되었습니다.`)});
  render();
}
document.addEventListener('DOMContentLoaded', boot);
