/* BOOKMATE RC21 - 소개 / 분리형 아카이브 / 활동 기반 미션 보조 */
(function(){
  const esc = value => String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const meetingExamples = [
    {
      id:'rc21-goodbye', book:'작별인사', author:'김영하', group:'우리의 문학', date:'2026. 7. 18. 오후 8:00', duration:'82분', participants:['달빛독서가','문장수집가','책읽는기린','초록책갈피','AI 모아'],
      oneLine:'인간다움은 기억의 양보다 관계 속에서 내리는 선택으로 드러날 수 있다는 의견이 이어졌습니다.',
      prompts:['기억이 흔들리는 순간에도 인간다움은 유지될 수 있을까요?','작품의 마지막 장면을 작별이 아닌 관계를 지키는 선택으로 볼 수 있을까요?'],
      summary:['기억이 정체성을 만드는 핵심인지, 기억이 사라진 뒤에도 같은 사람이라고 할 수 있는지 이야기했습니다.','철이가 자신의 정체성과 마주한 뒤 내리는 선택을 통해 인간다움의 기준을 살펴보았습니다.','작별은 관계의 포기가 아니라 상대를 끝까지 존중하는 방식일 수 있다는 해석이 나왔습니다.'],
      views:[['기억 중심','기억이 사라지면 선택의 이유와 정체성도 달라지므로 같은 사람이라 보기 어렵다.'],['선택 중심','기억이 흔들려도 타인을 대하는 태도와 선택에는 그 사람의 인간다움이 남는다.']], quote:['기억보다 선택이 결국 나를 만든다고 생각해요.','문장수집가'], keywords:['인간다움','기억','선택','정체성'], next:'기억을 모두 잃더라도 우리는 같은 사람이라고 말할 수 있을까요?'
    },
    {
      id:'rc21-demian', book:'데미안', author:'헤르만 헤세', group:'고전의 향기', date:'2026. 7. 16. 오후 7:00', duration:'74분', participants:['사유올빼미','지혜의등대','달빛독서가','문장수집가','AI 모아'],
      oneLine:'성장은 익숙한 세계를 부수는 불안과 함께 시작되며, 결국 자기 목소리를 듣는 과정이라는 생각을 나눴습니다.',
      prompts:['싱클레어가 두 세계 사이에서 흔들리는 모습은 오늘의 우리와 어떻게 닮았을까요?','“새는 알에서 나오려고 투쟁한다”는 문장을 나의 성장 경험과 연결해본다면?'],
      summary:['밝은 세계와 어두운 세계를 나누던 싱클레어의 시선이 변화하는 과정을 따라갔습니다.','데미안을 실제 인물이자 성장의 동반자로 보는 해석과 내면의 자아를 상징한다는 해석이 나뉘었습니다.','자기 자신에게 이르는 길에는 불안과 상실이 동반되지만 그 과정 자체가 성장이라는 데 공감했습니다.'],
      views:[['동반자','데미안은 싱클레어를 새로운 세계로 이끄는 실제 인물이다.'],['내면의 상징','데미안은 싱클레어가 아직 듣지 못한 자기 안의 목소리다.']], quote:['알을 깨는 일은 두렵지만, 결국 자기 삶을 시작하는 일이기도 해요.','지혜의등대'], keywords:['자아','성장','내면','고전'], next:'나는 지금 어떤 익숙한 세계의 껍질을 깨야 할까요?'
    },
    {
      id:'rc21-sapiens', book:'사피엔스', author:'유발 하라리', group:'역사를 읽는 사람들', date:'2026. 6. 27. 오후 8:00', duration:'96분', participants:['사유올빼미','문장수집가','느린독자','기록하는별','AI 모아'],
      oneLine:'인류를 움직인 것은 힘만이 아니라 함께 믿는 이야기였으며, 오늘의 제도도 그 믿음 위에 놓여 있다는 관점이 중심이 됐습니다.',
      prompts:['국가·돈·기업은 공동의 허구라는 주장에 동의하나요?','농업혁명은 진보였을까요, 더 많은 노동을 만든 함정이었을까요?'],
      summary:['인지혁명 이후 인간이 만든 공동의 이야기가 대규모 협력을 가능하게 했다는 주장을 검토했습니다.','자본주의와 인권이 허구라 해도 현실의 삶을 바꾸는 힘을 갖는다는 의견이 나왔습니다.','스마트폰과 알고리즘이 현대인을 길들이는 새로운 작물일 수 있다는 문제로 대화가 확장되었습니다.'],
      views:[['유용한 허구','공동의 믿음은 허구이지만 사회를 유지하고 협력을 가능하게 하는 필수 장치다.'],['비판적 거리','허구임을 잊는 순간 제도는 절대적인 진리처럼 개인을 억압할 수 있다.']], quote:['우리가 믿는 이야기를 스스로 선택할 수 있어야 한다고 생각해요.','느린독자'], keywords:['인류','허구','협력','문명'], next:'오늘 우리가 너무 당연하게 믿고 있는 이야기는 무엇일까요?'
    },
    {
      id:'rc21-1984', book:'1984', author:'조지 오웰', group:'미래사회 독서회', date:'2026. 6. 12. 오후 7:30', duration:'88분', participants:['문장수집가','책읽는기린','생각산책자','푸른문장','AI 모아'],
      oneLine:'감시는 기술만의 문제가 아니라 사람들이 스스로 말과 생각을 검열하게 만드는 구조라는 데 토론이 모였습니다.',
      prompts:['빅브라더의 감시와 오늘날의 데이터 수집은 어떻게 다를까요?','언어를 줄이면 실제로 사고의 범위도 줄어들 수 있을까요?'],
      summary:['텔레스크린과 현대의 플랫폼 데이터 수집을 비교하며 자발적 감시의 문제를 이야기했습니다.','신어가 단어를 없애 사고 가능성 자체를 줄이는 장치라는 점을 살펴보았습니다.','진실을 통제하는 권력에 맞서 개인의 기억과 기록이 갖는 의미를 나눴습니다.'],
      views:[['기술 책임','감시를 가능하게 한 기술과 기업의 설계가 가장 큰 책임을 져야 한다.'],['시민 책임','편의를 위해 정보를 자발적으로 제공하는 이용자의 선택도 함께 돌아봐야 한다.']], quote:['기억을 지키는 일이 곧 저항일 수 있다는 말이 오래 남아요.','푸른문장'], keywords:['감시','언어','진실','자유'], next:'편리함을 위해 우리는 어디까지 개인정보를 내어줄 수 있을까요?'
    },
    {
      id:'rc21-almond', book:'아몬드', author:'손원평', group:'마음을 읽는 모임', date:'2026. 5. 29. 오후 8:00', duration:'71분', participants:['달빛독서가','책읽는기린','마음우체부','초록책갈피','AI 모아'],
      oneLine:'공감은 타고난 감정만이 아니라 타인의 삶을 이해하려는 반복적인 선택과 연습일 수 있다는 의견이 이어졌습니다.',
      prompts:['윤재에게 감정은 부족한 것일까요, 다른 방식으로 존재하는 것일까요?','곤이와 윤재의 관계는 서로를 어떻게 변화시켰나요?'],
      summary:['감정을 느끼는 방식이 다르다고 해서 공감 능력이 없다고 단정할 수 있는지 논의했습니다.','곤이의 분노와 폭력 뒤에 놓인 상실과 외로움을 읽으며 이해와 용서의 차이를 살펴보았습니다.','관계가 사람을 완전히 바꾸기보다 새로운 선택의 가능성을 열어준다는 의견이 나왔습니다.'],
      views:[['감정의 언어','윤재는 감정이 없는 것이 아니라 표현하고 해석하는 언어가 다르다.'],['관계의 학습','윤재는 관계 속 경험을 통해 타인을 이해하는 방식을 배워간다.']], quote:['공감은 같은 감정을 느끼는 것보다 곁에 머무는 선택일지도 몰라요.','마음우체부'], keywords:['공감','관계','성장','감정'], next:'타인을 이해한다는 것은 정확히 같은 감정을 느끼는 일일까요?'
    },
    {
      id:'rc21-oldman', book:'노인과 바다', author:'어니스트 헤밍웨이', group:'바다와 인간', date:'2026. 5. 14. 오후 7:00', duration:'68분', participants:['사유올빼미','느린독자','문장수집가','바다책갈피','AI 모아'],
      oneLine:'성공의 결과보다 끝까지 자기 방식으로 싸우는 태도에 인간의 존엄이 있다는 해석이 중심이 됐습니다.',
      prompts:['노인의 싸움은 패배였을까요, 승리였을까요?','소년 마놀린과 노인의 관계는 무엇을 이어주는가요?'],
      summary:['청새치를 잡았지만 뼈만 남겨 돌아온 결말을 결과와 과정의 관점에서 나누어 읽었습니다.','자연을 정복 대상이 아니라 존중하는 상대이자 형제로 대하는 노인의 태도에 주목했습니다.','마놀린이 노인의 기술뿐 아니라 삶의 자세를 이어받는다는 점에서 세대 간 연결을 이야기했습니다.'],
      views:[['현실적 패배','노인은 생계를 위한 성과를 얻지 못했으므로 현실적으로는 패배했다.'],['존엄의 승리','결과를 잃었어도 자신의 한계와 끝까지 맞선 태도는 누구도 빼앗을 수 없다.']], quote:['사람은 파괴될 수는 있어도 패배하지는 않는다는 말이 다르게 들렸어요.','바다책갈피'], keywords:['존엄','투쟁','자연','세대'], next:'결과가 남지 않아도 과정만으로 의미 있다고 말할 수 있을까요?'
    }
  ];

  const aiExamples = [
    {id:'ai-goodbye',date:'2026. 7. 16.',book:'작별인사',title:'철이의 정체성과 인간다움',mode:'사유 정리',turns:14,line:'인간을 인간답게 만드는 것은 태생보다 관계 속에서 스스로 내리는 선택일 수 있습니다.',summary:'철이가 자신의 정체성을 알게 되는 장면에서 출발해, 기억과 태생, 선택 가운데 무엇이 인간다움을 만드는지 차분히 정리한 대화입니다.'},
    {id:'ai-demian',date:'2026. 7. 9.',book:'데미안',title:'알을 깨고 나온다는 것',mode:'깊이 읽기',turns:11,line:'성장은 완성된 나를 발견하는 일이 아니라 익숙했던 세계를 계속 벗어나는 과정일 수 있습니다.',summary:'싱클레어의 두 세계와 “새는 알에서 나오려고 투쟁한다”는 문장을 개인의 변화 경험과 연결해본 대화입니다.'},
    {id:'ai-dallergut',date:'2026. 6. 30.',book:'달러구트 꿈 백화점',title:'내가 보관하고 싶은 꿈',mode:'감상 나누기',turns:9,line:'꿈은 현실을 피하는 공간이 아니라 다시 일상으로 돌아갈 힘을 잠시 보관하는 장소일지도 모릅니다.',summary:'꿈을 사고파는 세계가 주는 위로와, 나에게 필요한 꿈이 무엇인지 이야기하며 독서 감상을 정리했습니다.'},
    {id:'ai-1984',date:'2026. 6. 18.',book:'1984',title:'언어가 사라지면 생각도 사라질까',mode:'토론 준비',turns:12,line:'말할 단어가 줄어들수록 생각을 공유하고 저항할 가능성도 함께 줄어들 수 있습니다.',summary:'신어의 목적과 오늘날의 짧고 단순한 언어 습관을 비교하며 독서모임 발제의 방향을 정리한 대화입니다.'}
  ];

  const ARCHIVE_DELETE_KEY='bookmate_rc22_deleted_archives';
  function deletedArchiveIds(){try{const list=JSON.parse(localStorage.getItem(ARCHIVE_DELETE_KEY)||'[]');return new Set(Array.isArray(list)?list.map(String):[]);}catch(e){return new Set();}}
  function saveDeletedArchiveId(id){const ids=deletedArchiveIds();ids.add(String(id));localStorage.setItem(ARCHIVE_DELETE_KEY,JSON.stringify([...ids]));}
  function savedAIArchives(){try{const list=JSON.parse(localStorage.getItem('bookmate_v3_ai_archives')||'[]');return Array.isArray(list)?list:[];}catch(e){return[];}}
  function normalizeSavedAI(item){return {id:`saved-${item.id}`,savedId:item.id,date:item.createdAt||'저장됨',book:item.book||'주제도서 미정',title:item.title||'AI 모아와의 대화',mode:'저장한 대화',turns:'',line:item.summary||'AI 모아와 나눈 대화를 저장했습니다.',summary:item.summary||'',full:item.full||''};}
  function archiveActions(item,type){return `<div class="rc22-archive-actions"><button class="rc22-archive-delete" onclick="deleteRC22Archive('${esc(type)}','${esc(item.id)}')">기록 삭제</button><button class="rc22-archive-view" onclick="${type==='meeting'?'openRC21MeetingArchive':'openRC21AIArchive'}('${esc(item.id)}')">${type==='meeting'?'독서기록 보기':'대화 기록 보기'}</button></div>`;}
  function archiveAIcard(item){return `<article class="rc21-ai-archive-card"><div class="rc21-ai-avatar"><img src="assets/characters/ai-moa.png" alt="AI 모아"></div><div class="rc21-ai-archive-copy"><span>${esc(item.date)} · ${esc(item.mode)}</span><h3>『${esc(item.book)}』 ${esc(item.title)}</h3><blockquote>“${esc(item.line)}”</blockquote><p>${esc(item.summary)}</p>${item.turns?`<small>대화 ${esc(item.turns)}회</small>`:''}${archiveActions(item,'ai')}</div></article>`;}

  function loadMeetingArchives(){
    let saved=[];
    try{saved=JSON.parse(localStorage.getItem('bookmate_live_reports')||'[]');if(!Array.isArray(saved))saved=[];}catch(e){}
    // 이전 버전에서 자동 주입된 『작별인사』 중복 데모는 새 통합 예시와 겹치므로 표시하지 않습니다.
    saved=saved.filter(r=>r&&r.id!=='demo-goodbye');
    const mapped=saved.map((r,i)=>({id:`saved-meeting-${r.id||i}`,savedSourceId:r.id||'',savedSourceIndex:i,savedRaw:r,book:r.book||'주제도서 미정',author:r.author||'',group:r.group||r.title||'독서모임',date:r.date||'저장된 기록',duration:r.duration||'',participants:r.participants||[],oneLine:r.oneLine||r.summary||'함께 읽고 나눈 독서모임 기록입니다.',prompts:r.discussionPrompts||[],summary:r.summaryPoints||[r.summary||'서로 다른 생각을 나누었습니다.'],views:(r.differentViews||[]).map(v=>[v.label||'관점',v.text||String(v)]),quote:r.highlightQuote?[r.highlightQuote.text||String(r.highlightQuote),r.highlightQuote.speaker||'참여자']:null,keywords:r.keywords||[],next:r.nextQuestion||''}));
    const deleted=deletedArchiveIds();
    return [...mapped,...meetingExamples].filter(item=>!deleted.has(String(item.id)));
  }
  function renderRC21MeetingArchives(){const root=document.getElementById('liveMeetingArchiveList');if(!root)return;const items=loadMeetingArchives();root.innerHTML=items.map(item=>`<article class="rc21-meeting-archive-card"><div class="rc21-meeting-archive-top"><span>${esc(item.date)}</span><em>${esc(item.group)}</em></div><h3>『${esc(item.book)}』 <small>${esc(item.author)}</small></h3><p>${esc(item.oneLine)}</p><div class="rc21-meeting-meta"><span>👥 참여 ${(item.participants||[]).length}명</span><span>🕒 ${esc(item.duration)}</span></div><div class="rc21-meeting-keywords">${(item.keywords||[]).slice(0,4).map(k=>`<span>#${esc(k)}</span>`).join('')}</div>${archiveActions(item,'meeting')}</article>`).join('')||'<div class="archive-empty-state">저장된 독서모임 기록이 없습니다.</div>';window.__RC21_MEETING_ARCHIVES=items;}

  function renderSavedAIArchives(){const root=document.getElementById('saved-ai-archive-list');if(!root)return;const deleted=deletedArchiveIds();const saved=savedAIArchives().map(normalizeSavedAI);const all=[...saved,...aiExamples].filter(item=>!deleted.has(String(item.id)));root.innerHTML=all.map(archiveAIcard).join('')||'<div class="archive-empty-state">저장된 AI 대화 기록이 없습니다.</div>';window.__RC21_AI_ARCHIVES=all;renderRC21MeetingArchives();}

  function deleteRC22Archive(type,id){
    const collection=type==='meeting'?(window.__RC21_MEETING_ARCHIVES||[]):(window.__RC21_AI_ARCHIVES||[]);
    const item=collection.find(x=>String(x.id)===String(id));
    if(!item)return;
    if(!confirm(`『${item.book||'이 기록'}』 기록을 삭제할까요?\n삭제한 기록은 현재 브라우저에서 다시 표시되지 않습니다.`))return;
    if(type==='meeting'&&String(id).startsWith('saved-meeting-')){
      let list=[];try{list=JSON.parse(localStorage.getItem('bookmate_live_reports')||'[]');if(!Array.isArray(list))list=[];}catch(e){}
      if(item.savedSourceId) list=list.filter(r=>String(r&&r.id)!==String(item.savedSourceId));
      else {const target=JSON.stringify(item.savedRaw||{});let removed=false;list=list.filter(r=>{if(!removed&&JSON.stringify(r)===target){removed=true;return false;}return true;});}
      localStorage.setItem('bookmate_live_reports',JSON.stringify(list));
    }else if(type==='ai'&&item.savedId){
      const list=savedAIArchives().filter(r=>String(r.id)!==String(item.savedId));
      localStorage.setItem('bookmate_v3_ai_archives',JSON.stringify(list));
    }else saveDeletedArchiveId(id);
    if(type==='meeting')renderRC21MeetingArchives();else renderSavedAIArchives();
    if(typeof toast==='function')toast('기록을 삭제했습니다.');
  }

  function setArchiveType(type){const meeting=type!=='ai';document.getElementById('archive-panel-meeting')?.classList.toggle('hidden',!meeting);document.getElementById('archive-panel-ai')?.classList.toggle('hidden',meeting);document.getElementById('archive-tab-meeting')?.classList.toggle('is-active',meeting);document.getElementById('archive-tab-ai')?.classList.toggle('is-active',!meeting);if(meeting)renderRC21MeetingArchives();else renderSavedAIArchives();}
  function openDialog(title,body){const dialog=document.getElementById('meetingArchiveDialog'),bodyEl=document.getElementById('meetingArchiveDialogBody'),titleEl=document.getElementById('meetingArchiveDialogTitle');if(!dialog||!bodyEl)return;if(titleEl)titleEl.textContent=title;bodyEl.innerHTML=body;dialog.showModal();document.body.classList.add('archive-dialog-open');}
  function openRC21MeetingArchive(id){const item=(window.__RC21_MEETING_ARCHIVES||[]).find(x=>String(x.id)===String(id));if(!item)return;const prompts=(item.prompts||[]).length?item.prompts:['기록된 발제문이 없습니다.'];const views=(item.views||[]).length?item.views:[['다양한 관점','같은 장면을 서로 다른 삶의 경험과 시선으로 해석했습니다.']];openDialog('독서모임 아카이브',`<header class="archive-detail-header"><span>📚 독서모임 아카이브</span><h2>📖 ${esc(item.book)}${item.author?` · ${esc(item.author)}`:''}</h2><p>${esc(item.group)} · ${esc(item.date)} · 참여 ${(item.participants||[]).length}명 · ${esc(item.duration)}</p></header><section class="archive-detail-section archive-ai-line"><h3>🤖 AI가 남긴 한 줄 기록</h3><blockquote>“${esc(item.oneLine)}”</blockquote></section><section class="archive-detail-section"><h3>📖 이번 모임 발제문</h3><ol>${prompts.map((p,i)=>`<li><b>${i+1}</b><span>${esc(p)}</span></li>`).join('')}</ol></section><section class="archive-detail-section"><h3>💬 토론 요약</h3><ul>${(item.summary||[]).map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section><section class="archive-detail-section"><h3>⚖ 다양한 의견</h3><div class="viewpoint-list">${views.map(v=>`<article><strong>${esc(v[0])}</strong><p>${esc(v[1])}</p></article>`).join('')}</div></section>${item.quote?`<section class="archive-detail-section highlight-quote"><h3>✨ 오늘의 문장</h3><blockquote>“${esc(item.quote[0])}”</blockquote><p>— ${esc(item.quote[1])}</p></section>`:''}<section class="archive-detail-section"><h3>🏷 핵심 키워드</h3><div class="detail-keywords">${(item.keywords||[]).map(k=>`<span>#${esc(k)}</span>`).join('')}</div></section>${item.next?`<section class="archive-detail-section next-question"><h3>🌱 다음 모임을 위한 질문</h3><p>“${esc(item.next)}”</p></section>`:''}`);}
  function openRC21AIArchive(id){const item=(window.__RC21_AI_ARCHIVES||[]).find(x=>String(x.id)===String(id));if(!item)return;if(item.savedId&&typeof openSavedAIArchive==='function'){openSavedAIArchive(item.savedId);return;}openDialog('AI 모아 대화 아카이브',`<header class="archive-detail-header rc21-ai-detail-head"><span>✨ AI 모아 대화 아카이브</span><h2>📖 『${esc(item.book)}』 ${esc(item.title)}</h2><p>${esc(item.date)} · ${esc(item.mode)}${item.turns?` · 대화 ${esc(item.turns)}회`:''}</p></header><section class="archive-detail-section archive-ai-line"><h3>모아의 한 줄 정리</h3><blockquote>“${esc(item.line)}”</blockquote></section><section class="archive-detail-section"><h3>대화에서 이어진 생각</h3><p>${esc(item.summary)}</p></section><section class="archive-detail-section next-question"><h3>대화를 이어가고 싶다면</h3><p>같은 책을 선택해 AI 독서 파트너에서 새로운 생각을 이어갈 수 있습니다.</p><button class="rc21-dialog-action" onclick="document.getElementById('meetingArchiveDialog').close();openHomeAIQuestion('${esc(item.book)}','${esc(item.title)}','이전에 나눈 생각에서 한 걸음 더 이어가볼까요?')">이 책으로 대화 이어가기</button></section>`);}

  window.setArchiveType=setArchiveType;window.renderSavedAIArchives=renderSavedAIArchives;window.renderRC21MeetingArchives=renderRC21MeetingArchives;window.openRC21MeetingArchive=openRC21MeetingArchive;window.openRC21AIArchive=openRC21AIArchive;window.deleteRC22Archive=deleteRC22Archive;

  function init(){renderRC21MeetingArchives();renderSavedAIArchives();try{lucide.createIcons();}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
