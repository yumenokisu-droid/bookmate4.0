(function(){
  const ROOT_ID = 'view-club-meeting';
  const STORAGE_KEY = 'bookmate_meeting_rc2_status';
  const REPORT_KEY = 'bookmate_live_reports';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const defaultState = {
    membership: 'member',
    aiMode: '퍼실리테이터',
    boardFilter: '전체',
    liveVote: { choice:'참여', total:8, join:5, comments:[{user:'문장수집가', text:'저는 참여 가능해요. 발제문 미리 읽어둘게요.'},{user:'초록책갈피', text:'일정이 겹쳐서 다음에 참여할게요.'}] },
    club:{
      title:'우리의 문학', desc:'좋은 책은 사람을 만나 완성됩니다. 함께 읽고, 묻고, 기록하는 문학 독서모임입니다.',
      category:'문학', privacy:'비공개', joinType:'초대링크 가입', age:'20~40대', region:'익산 / 온라인', membersCount:18,
      rule:'스포일러는 토론 전 표시하고, 서로의 해석을 존중합니다.'
    },
    currentBook:{title:'작별인사', author:'김영하', publisher:'복복서가', date:'7월 11일 오후 8시', place:'LIVE ROOM', readingRange:'1~180쪽', points:'인간다움, 선택, 작별의 의미', coverUrl:'https://books.google.com/books/content?id=e67o0QEACAAJ&printsec=frontcover&img=1&zoom=5&source=gbs_api', isbn:'9791191114225'},
    previousBooks:[
      {title:'데미안', author:'헤르만 헤세', date:'6월 12일', method:'온라인', archive:true, memo:'자아와 성장에 대한 토론', isbn:'9788937460449'},
      {title:'노인과 바다', author:'어니스트 헤밍웨이', date:'5월 18일', method:'오프라인', archive:false, memo:'포기하지 않는 태도에 대한 대화', isbn:'9788937462788'}
    ],
    nextBooks:[
      {title:'아몬드', author:'손원평', date:'8월 9일 오후 8시', place:'LIVE ROOM', memo:'공감 능력과 성장에 대해 이야기하기', isbn:'9788936434267'},
      {title:'소년이 온다', author:'한강', date:'9월 예정', place:'오프라인', memo:'역사와 기억을 다루는 방식 함께 읽기', isbn:'9788936434120'}
    ],
    chat:[
      {user:'문장수집가', text:'이번 책은 마지막 장면 이야기가 제일 많을 것 같아요.'},
      {user:'책읽는고양이', text:'저는 토론 전에 인상 깊은 문장을 하나씩 골라오면 좋겠어요.'}
    ],
    posts:[
      {id:1, category:'공지', author:'달빛독서가', title:'7월 LIVE 독서토론 안내', body:'토요일 오후 8시에 LIVE ROOM에서 만나요. 이어폰이 없어도 AI 음성 요약으로 흐름을 볼 수 있어요.', likes:3, comments:['확인했습니다.'], time:'방금 전'},
      {id:2, category:'수다', author:'책읽는고양이', title:'작별이라는 말이 남긴 감정', body:'책을 다 읽고 나니 제목이 더 오래 남았습니다. 토론에서 같이 이야기해보고 싶어요.', likes:7, comments:['저도요!'], time:'어제'},
      {id:3, category:'자료실', author:'문장수집가', title:'이번 주 참고 자료', body:'토론 전에 보면 좋은 기사와 인터뷰를 모아둘게요.', likes:2, comments:[], time:'2일 전'}
    ],
    schedules:[
      {date:'7.11', title:'작별인사 LIVE 토론', meta:'20:00 · LIVE ROOM'},
      {date:'7.18', title:'아몬드 사전 대화', meta:'20:00 · 일반 채팅방'},
      {date:'8.03', title:'다음 주제도서 선정 회의', meta:'19:30 · 온라인'}
    ],
    members:[
      {name:'달빛독서가', role:'모임장', visits:50, meetings:8, posts:12, chats:156, online:true, avatarType:'moa', avatarId:1},
      {name:'문장수집가', role:'부모임장', visits:42, meetings:6, posts:9, chats:121, online:true, avatarType:'moa', avatarId:2},
      {name:'책읽는고양이', role:'회원', visits:35, meetings:3, posts:3, chats:45, online:true, avatarType:'moa', avatarId:3},
      {name:'초록책갈피', role:'회원', visits:21, meetings:2, posts:1, chats:18, online:false, avatarType:'moa', avatarId:4},
      {name:'밤의서재', role:'회원', visits:17, meetings:1, posts:0, chats:9, online:false, avatarType:'moa', avatarId:1}
    ]
  };
  let state = loadState();
  let booted = false;
  let editingCurrent = false;
  let editingNextIndex = null;
  function root(){ return document.getElementById(ROOT_ID); }
  function q(sel){ const r=root(); return r ? r.querySelector(sel) : null; }
  function qa(sel){ const r=root(); return r ? Array.from(r.querySelectorAll(sel)) : []; }
  function sanitizeState(data){
    const cloned = data || JSON.parse(JSON.stringify(defaultState));
    // 수정 모드는 화면 상태라서 저장/새로고침 뒤에는 반드시 닫힌 상태로 시작합니다.
    (cloned.posts || []).forEach(p => { if (p && Object.prototype.hasOwnProperty.call(p, 'editing')) delete p.editing; });
    return cloned;
  }
  function loadState(){
    try { return sanitizeState(merge(defaultState, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {})); }
    catch(e){ return sanitizeState(JSON.parse(JSON.stringify(defaultState))); }
  }
  function merge(a,b){ if(Array.isArray(a)) return Array.isArray(b)?b:a; if(a && typeof a==='object'){ const out={...a}; Object.keys(b||{}).forEach(k=>out[k]=merge(a[k],b[k])); return out; } return b===undefined?a:b; }
  function saveState(){
    const toSave = JSON.parse(JSON.stringify(state));
    (toSave.posts || []).forEach(p => { if (p) delete p.editing; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }
  function toast(text){ if (typeof showToast === 'function') showToast(text); else alert(text); }
  function isInvited(){ return new URLSearchParams(location.search).get('invite') === '1' || state.membership === 'invited'; }
  function bookCoverSlot(id, book, cls='w-full h-full object-cover rounded-xl'){
    const title = book?.title || book?.book || 'BOOKMATE';
    return `<div id="${id}" class="w-full h-full rounded-xl bg-white overflow-hidden flex items-center justify-center text-center text-brand-navy text-xs font-bold">${esc(title)}</div>`;
  }
  function hydrateBookCover(id, book, cls='w-full h-full object-cover rounded-2xl'){
    if(typeof loadBookCover === 'function') setTimeout(()=>loadBookCover(book?.title || book?.book || '', id, cls, book?.coverUrl || '', {title:book?.title||book?.book||'', author:book?.author||'', isbn:book?.isbn||'', coverUrl:book?.coverUrl||''}), 0);
  }
  function switchCommunityView(view){
    qa('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    qa('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if(view === 'live') renderReportPreview();
    const target = q('.meeting-main'); if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  }
  function syncClub(activeGathering){
    if(activeGathering){
      state.club.title = activeGathering.title || state.club.title;
      state.club.desc = activeGathering.desc || state.club.desc;
      state.club.category = activeGathering.category || state.club.category;
      state.club.privacy = activeGathering.scope || state.club.privacy;
      state.club.membersCount = activeGathering.membersCount || state.club.membersCount;
      state.currentBook.title = activeGathering.book || state.currentBook.title;
      state.currentBook.author = activeGathering.author || state.currentBook.author;
      state.currentBook.coverUrl = activeGathering.coverUrl || state.currentBook.coverUrl || '';
      state.currentBook.isbn = activeGathering.isbn || state.currentBook.isbn || '';
      if (typeof ensureGatheringMembers === 'function') {
        const gatheringMembers = ensureGatheringMembers(activeGathering) || [];
        state.members = gatheringMembers.map((m, idx) => ({
          name: m.nickname || m.name || `멤버${idx+1}`,
          role: m.role === 'leader' ? '모임장' : (m.role === 'coLeader' ? '부모임장' : '회원'),
          visits: m.visits || (50 - idx * 5), meetings: m.meetings || Math.max(1, 8 - idx), posts: m.posts || idx + 1, chats: m.chats || 30 + idx * 8,
          online: idx < 3, avatarType: m.avatarType || 'moa', avatarId: m.avatarId || ((idx % 4) + 1), avatarImage: m.avatarImage || ''
        }));
      }
    }
    const c=state.club;
    ['#miniClubTitle','#clubTitle'].forEach(sel=>{ const el=q(sel); if(el) el.textContent=c.title; });
    const metaText = `${c.category} · ${c.privacy}모임 · ${c.membersCount}명`;
    const miniMeta=q('#miniClubMeta'); if(miniMeta) miniMeta.textContent=metaText;
    const desc=q('#clubDesc'); if(desc) desc.textContent=c.desc;
    const badges=q('#clubMetaBadges'); if(badges) badges.innerHTML = [`👥 ${c.membersCount}명`,`📚 ${c.category}`,`${c.privacy==='비공개'?'🔒 비공개':'🌐 공개'}`,`🗓 매주 토요일`].map(x=>`<span>${esc(x)}</span>`).join('');
    ['#clubNameInput','#clubCategoryInput','#clubAgeInput','#clubRegionInput'].forEach(sel=>{ const el=q(sel); if(!el) return; const key={ '#clubNameInput':'title','#clubCategoryInput':'category','#clubAgeInput':'age','#clubRegionInput':'region'}[sel]; el.value=c[key]||''; });
    const d=q('#clubDescInput'); if(d) d.value=c.desc||'';
    const r=q('#clubRuleInput'); if(r) r.value=c.rule||'';
    const pr=q('#clubPrivacyInput'); if(pr) pr.value=c.privacy||'비공개';
    const jt=q('#clubJoinTypeInput'); if(jt) jt.value=c.joinType||'초대링크 가입';
    renderMembershipButton();
  }
  function syncBook(){
    const b=state.currentBook;
    ['#homeBookTitle','#bookTitle','#liveBookTitle'].forEach(sel=>{ const el=q(sel); if(el) el.textContent=b.title; });
    const homeInfo=q('#homeBookInfo'); if(homeInfo) homeInfo.textContent=`${b.author} · ${b.publisher}`;
    const homeMeeting=q('#homeBookMeeting'); if(homeMeeting) homeMeeting.textContent=`${b.date} · ${b.place}`;
    const homeRange=q('#homeBookRange'); if(homeRange) homeRange.textContent=`읽기 범위 ${b.readingRange || '자율'} · 발제문과 토론 질문을 준비해요.`;
    const meta=q('#bookMeta'); if(meta) meta.textContent=`${b.author} · ${b.publisher}`;
    const date=q('#bookDiscussDate'); if(date) date.textContent=`📅 ${b.date} · ${b.place}`;
    const range=q('#bookReadingRange'); if(range) range.textContent=`📖 읽기 범위 ${b.readingRange || '자율'}`;
    const liveMeta=q('#liveMeetingMeta'); if(liveMeta) liveMeta.textContent=`${b.date} · ${b.place}`;
    const type=q('#currentMeetingType'); if(type) type.textContent=b.place||'일정';
    const points=q('#bookDiscussionPoints'); if(points) points.textContent=`💬 논제: ${b.points}`;
    const liveTopic=q('#liveBriefTopic'); if(liveTopic) liveTopic.textContent=b.points||'자유 토론';
    const liveRange=q('#liveBriefRange'); if(liveRange) liveRange.textContent=b.readingRange||'자율';
    const homeCover=q('#homeBookCover'); if(homeCover){ homeCover.innerHTML = bookCoverSlot('homeBookCoverImg', b); hydrateBookCover('homeBookCoverImg', b, 'w-full h-full object-cover rounded-xl book-cover-plain'); }
    const bookCover=q('#bookCoverTitle'); if(bookCover){ bookCover.innerHTML = bookCoverSlot('bookCoverMainImg', b); hydrateBookCover('bookCoverMainImg', b, 'w-full h-full object-cover rounded-xl book-cover-plain'); }
    renderTopicBooks();
  }
  function syncAiMode(){ ['#sidebarAiMode','#communityAiMode'].forEach(sel=>{const el=q(sel); if(el) el.textContent=state.aiMode;}); }
  function memberByName(name){ return state.members.find(m=>m.name===name) || null; }
  function currentNickname(){ return (typeof getCurrentNickname === 'function') ? getCurrentNickname() : ((typeof state !== 'undefined' && state.currentUser && state.currentUser.nickname) ? state.currentUser.nickname : '게스트 독자'); }
  function avatarHTML(name, cls='member-avatar'){
    const sizeMap = {
      'member-avatar':'w-10 h-10',
      'member-avatar big':'w-14 h-14',
      'chat-avatar':'w-10 h-10',
      'post-avatar':'w-9 h-9'
    };
    const size = sizeMap[cls] || cls;
    const extra = ['member-avatar','member-avatar big','chat-avatar','post-avatar'].includes(cls) ? cls.replace(/ /g,'-') : 'meeting-avatar';
    if(name && name.includes('AI')) return (typeof getAIAvatarHTML === 'function') ? getAIAvatarHTML(size, extra) : `<span class="${extra}"><img src="assets/characters/ai-moa.png" alt="AI 모아"></span>`;
    const m = memberByName(name) || { name, avatarType:'moa', avatarId: ((String(name||'모아').charCodeAt(0)||0)%4)+1 };
    const target = { name:m.name, nickname:m.name, avatarType:m.avatarType || 'moa', avatarId:m.avatarId || 1, avatarImage:m.avatarImage || '' };
    if(typeof getAvatarHTML === 'function') return getAvatarHTML(target, size, extra);
    const id = target.avatarId || 1;
    return `<span class="${extra}"><img src="assets/characters/moa-${id}.png" alt="${esc(name)}"></span>`;
  }
  function renderMembershipButton(){
    const btn=q('#membershipActionBtn'); if(!btn) return;
    if(isInvited() && state.membership !== 'member') { btn.textContent='모임 참여하기'; btn.classList.remove('danger-state'); }
    else { btn.textContent='탈퇴하기'; btn.classList.add('danger-state'); }
  }
  function renderActivity(){
    const el=q('#activityList'); if(!el) return;
    const vote = state.liveVote || { total:8, join:5 };
    const commentCount = (state.posts||[]).reduce((sum,p)=>sum+(p.comments?.length||0),0);
    const next = state.nextBooks?.[0] || null;
    const items=[
      {icon:'📝', title:`새 글 ${state.posts.length}건`, desc:'모임원들이 남긴 생각을 이어 읽어보세요.', target:'board', hint:'게시판'},
      {icon:'💬', title:`댓글 ${commentCount}개`, desc:'책장을 넘긴 뒤 이어진 이야기가 도착했어요.', target:'board', hint:'댓글'},
      {icon:'🗳', title:`LIVE 참여 ${vote.join}명`, desc:`오늘 대화에 함께할 멤버를 확인해보세요.`, target:'live', hint:'LIVE'},
      {icon:'📅', title:`다음 일정`, desc:`${state.currentBook.date} · ${state.currentBook.place}`, target:'book', hint:'일정'},
      {icon:'📚', title: next ? `다음 도서 등록` : '다음 도서 미정', desc: next ? `다음 책은 『${next.title}』입니다.` : '다음에 함께 읽을 책을 기다리고 있어요.', target:'book', hint:'도서'}
    ];
    el.innerHTML = items.map(x=>`<button class="meeting-status-row" type="button" data-status-target="${x.target}" aria-label="${esc(x.title)} ${esc(x.hint||'')}"><span class="status-icon">${x.icon}</span><span class="min-w-0 flex-1"><strong>${esc(x.title)}</strong><small>${esc(x.desc)}</small></span><span class="status-hint">${esc(x.hint)} →</span></button>`).join('');
    renderHomeOnlinePreview();
  }
    function renderHomeOnlinePreview(){
    const countEl=q('#homeOnlineCount'), preview=q('#homeOnlinePreview');
    const online = (state.members||[]).filter(m=>m.online);
    if(countEl) countEl.textContent = `🟢 ${online.length}명`;
    if(preview) preview.innerHTML = online.slice(0,4).map(m=>`<div class="online-preview-member">${avatarHTML(m.name,'w-7 h-7 rounded-full overflow-hidden shrink-0')}<span>${esc(m.name)}</span><em>접속</em></div>`).join('') + (online.length>4?`<div class="online-preview-member more"><span>+${online.length-4}명 더 접속 중</span></div>`:'');
  }
    function renderChat(){
    const el=q('#chatFeed'); if(!el) return;
    const me = currentNickname();
    const chats = (state.chat||[]).filter(m=>!(m.user||'').includes('AI'));
    state.chat = chats;
    el.innerHTML=chats.map(m=>`<div class="message ${m.user===me||m.user==='달빛독서가'?'me':''}">${avatarHTML(m.user,'chat-avatar')}<div class="message-bubble"><small>${esc(m.user)}</small><p>${esc(m.text)}</p></div></div>`).join('');
    el.scrollTop=el.scrollHeight;
    renderOnlineMembers();
  }
  function renderOnlineMembers(){
    const el=q('#onlineMemberList'); if(!el) return;
    el.innerHTML = (state.members||[]).map(m=>`<div class="online-member-row polished">${avatarHTML(m.name,'w-9 h-9 rounded-full overflow-hidden shrink-0')}<div class="online-member-name"><strong>${esc(m.name)}</strong><span>${esc(m.role)}</span></div><em class="${m.online?'on':'away'}">${m.online?'● 접속':'○ 자리비움'}</em></div>`).join('');
  }
    function normalizeComment(c){ return (c && typeof c === 'object') ? c : { author:'문장수집가', text:String(c||''), time:'방금 전', likes:0, liked:false }; }
  function canEditByAuthor(author){ return String(author||'').trim() === String(currentNickname()||'').trim(); }
  function renderOwnerActions(type, index=''){
    return `<span class="owner-actions"><button type="button" class="${type}-edit-btn" data-comment-index="${index}">수정</button><button type="button" class="${type}-delete-btn" data-comment-index="${index}">삭제</button></span>`;
  }
  function renderAdminDeleteAction(){
    return `<span class="owner-actions master-only admin-actions"><button type="button" class="admin-post-delete-btn">삭제</button></span>`;
  }
  function renderPosts(){
    const el=q('#postList'); if(!el) return;
    state.posts.forEach(p=>{ p.comments=(p.comments||[]).map(normalizeComment); if(p.liked===undefined) p.liked=false; if(p.commentsOpen===undefined) p.commentsOpen=(p.comments||[]).length>0; });
    const posts = state.boardFilter === '전체' ? state.posts : state.posts.filter(p=>p.category === state.boardFilter);
    el.innerHTML=posts.map(p=>{
      const comments=p.comments||[];
      const open=p.commentsOpen || comments.length>0;
      const postOwner = canEditByAuthor(p.author);
      const postEdit = p.editing && postOwner;
      return `<article class="post refined-post ${postEdit?'editing':''}" data-id="${p.id}">
        <div class="post-top post-author-line compact-author">
          ${avatarHTML(p.author||'달빛독서가','post-avatar')}
          <div class="post-author-text"><strong>${esc(p.author||'달빛독서가')}</strong><span>${esc(p.time||'방금 전')}</span></div>
          <span class="role">${esc(p.category)}</span>
          ${postOwner ? renderOwnerActions('post') : renderAdminDeleteAction()}
        </div>
        ${postEdit ? `<form class="post-inline-edit-form post-edit-vertical"><label><span>제목</span><input class="post-edit-title" value="${esc(p.title)}" placeholder="제목을 입력하세요"></label><label><span>본문</span><textarea class="post-edit-body" rows="5" placeholder="내용을 입력하세요">${esc(p.body)}</textarea></label><div class="post-edit-actions"><button type="button" class="cancel-post-edit small-button">취소</button><button class="primary-button" type="submit">저장</button></div></form>` : `<h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>`}
        <div class="post-reaction-line refined">
          <button type="button" class="reaction-btn like-btn ${p.liked?'liked':''}" aria-label="좋아요">${p.liked?'❤️':'♡'} <span>좋아요 ${p.likes||0}개</span></button>
          <button type="button" class="reaction-btn comment-toggle-btn" aria-label="댓글">💬 <span>댓글 ${comments.length}개</span></button>
        </div>
        <div class="comments-wrap ${open?'open':'hidden'}">
          ${comments.map((c,idx)=>`<div class="comment rich-comment compact-comment">${avatarHTML(c.author,'post-avatar')}<div class="comment-body"><div class="comment-head"><strong>${esc(c.author)}</strong><span>${esc(c.time||'방금 전')}</span>${canEditByAuthor(c.author) ? renderOwnerActions('comment', idx) : ''}</div><div class="comment-text-line"><p>${esc(c.text)}</p><button class="comment-like-btn inline" data-comment-index="${idx}">${c.liked?'❤️':'♡'} ${c.likes||0}</button></div></div></div>`).join('')}
          <form class="comment-box"><input placeholder="댓글 쓰기..."/><button class="small-button" type="submit">등록</button></form>
        </div>
      </article>`;
    }).join('') || '<div class="empty-card">게시글이 없습니다.</div>';
  }
    function nextEditForm(b={}, i=0){
    return `<form class="next-inline-edit-form schedule-inline-editor space-y-2" data-index="${i}">
      <div class="grid grid-cols-[1fr_auto] gap-2"><input id="nextEditTitle${i}" class="px-3 py-2.5 bg-white border border-brand-ivoryDark rounded-xl text-xs" value="${esc(b.title||'')}" placeholder="도서명"><button type="button" class="next-search-book px-3 py-2.5 rounded-xl bg-brand-ivory text-brand-navy text-[11px] font-bold" data-index="${i}">책 검색</button></div>
      <input id="nextEditAuthor${i}" class="w-full px-3 py-2.5 bg-white border border-brand-ivoryDark rounded-xl text-xs" value="${esc(b.author||'')}" placeholder="저자">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"><input id="nextEditDate${i}" class="px-3 py-2.5 bg-white border border-brand-ivoryDark rounded-xl text-xs" value="${esc(b.date||'')}" placeholder="예정일"><input id="nextEditPlace${i}" class="px-3 py-2.5 bg-white border border-brand-ivoryDark rounded-xl text-xs" value="${esc(b.place||'LIVE ROOM')}" placeholder="장소"></div>
      <textarea id="nextEditMemo${i}" rows="2" class="w-full p-3 bg-white border border-brand-ivoryDark rounded-xl text-xs" placeholder="읽기 범위, 논제, 안내">${esc(b.memo||'')}</textarea>
      <div class="flex justify-end gap-2"><button type="button" class="cancel-next-edit small-button" data-index="${i}">취소</button><button class="primary-button save-next-book" type="submit" data-index="${i}">저장</button></div>
    </form>`;
  }
  function renderTopicBooks(){
    const nextPreview=q('#nextMeetingPreview');
    if(nextPreview) nextPreview.innerHTML = '<p class="muted text-xs">다음에 함께 읽을 책을 차례로 준비해두면, 모임 흐름이 자연스럽게 이어져요.</p>';
    const prev=q('#previousTopicList');
    if(prev) {
      prev.innerHTML=state.previousBooks.map((b,i)=>`<article class="topic-item previous"><div class="topic-mini-cover">${bookCoverSlot(`prevTopicCover${i}`, b)}</div><div><span class="role">이전</span><h3>${esc(b.title)}</h3><p>${esc(b.author)} · ${esc(b.date)} · ${esc(b.method)}</p><p class="muted">${esc(b.memo)}</p><div class="topic-actions"><button class="small-button">토론 내역</button>${b.archive?'<button class="primary-button archive-view-btn">아카이브 보기</button>':'<span class="muted small-muted">아카이브 없음</span>'}</div></div></article>`).join('');
      state.previousBooks.forEach((b,i)=>hydrateBookCover(`prevTopicCover${i}`, b, 'w-full h-full object-cover rounded-xl book-cover-plain'));
    }
    const next=q('#nextTopicList');
    if(next) {
      next.innerHTML=(state.nextBooks||[]).map((b,i)=> editingNextIndex===i ? `<article class="topic-item next editing">${nextEditForm(b,i)}</article>` : `<article class="topic-item next"><div class="topic-mini-cover">${bookCoverSlot(`nextTopicCover${i}`, b)}</div><div><span class="role">다음 ${i+1}</span><h3>${esc(b.title)}</h3><p>${esc(b.author)} · ${esc(b.date)} · ${esc(b.place||'방식 미정')}</p><p class="muted">${esc(b.memo)}</p><div class="topic-actions master-only"><button class="small-button edit-next-book" data-index="${i}">수정</button><button class="small-button promote-next-book" data-index="${i}">현재 도서로 지정</button><button class="danger-button remove-next-book" data-index="${i}">삭제</button></div></div></article>`).join('') || '<div class="empty-card">다음 모임이 아직 없습니다.</div>';
      (state.nextBooks||[]).forEach((b,i)=>{ if(editingNextIndex!==i) hydrateBookCover(`nextTopicCover${i}`, b, 'w-full h-full object-cover rounded-xl book-cover-plain'); });
    }
  }
    function renderMembers(selected=0){
    const list=q('#memberList'); if(list) list.innerHTML=state.members.map((m,i)=>`<button class="member-row ${i===selected?'active':''}" data-index="${i}">${avatarHTML(m.name)}<span><strong>${esc(m.name)}</strong><small>${esc(m.role)} · ${m.online?'접속중':'오프라인'}</small></span></button>`).join('');
    renderMemberDetail(selected);
  }
  function renderMemberDetail(index=0){
    const m=state.members[index] || state.members[0]; const el=q('#memberDetail'); if(!el || !m) return;
    el.innerHTML=`<div class="member-detail-head">${avatarHTML(m.name,'member-avatar big')}<div><h3>${esc(m.name)}</h3><p class="muted">${esc(m.role)}</p></div></div><div class="member-stats"><div><strong>${m.visits}</strong><span>방문수</span></div><div><strong>${m.meetings}</strong><span>독서모임 참여</span></div><div><strong>${m.posts}</strong><span>게시글</span></div><div><strong>${m.chats}</strong><span>채팅 참여</span></div></div><div class="member-manage master-only"><button class="small-button full">부모임장 지정</button><button class="small-button full">모임장 변경</button><button class="danger-button full">강제퇴장</button></div>`;
  }
  function renderSchedule(){
    const el=q('#scheduleList'); if(!el) return;
    el.innerHTML=state.schedules.map((s,i)=>`<article class="schedule-item"><div class="schedule-date">${esc(s.date)}</div><div><strong>${esc(s.title)}</strong><p class="muted">${esc(s.meta)}</p></div><button class="small-button delete-schedule" data-index="${i}">관리</button></article>`).join('');
  }
  function getReports(){
    try{
      const saved=JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');
      if(saved.length) return saved;
    }catch(e){}
    return [{schemaVersion:2,id:'demo-goodbye',title:'작별인사 독서모임',book:'작별인사',author:'김영하',date:'2026. 7. 13. 오후 8:33',duration:'20:30',participants:['달빛독서가','문장수집가','책읽는고양이','초록책갈피','AI 모아'],oneLine:'같은 책을 읽었지만, 서로 다른 삶이 만나 하나의 이야기를 완성한 시간.',discussionPrompts:['기억이 흔들리는 순간에도 인간다움은 유지될 수 있을까요?','작품 속 인물의 선택을 작별이 아닌 관계를 지키는 방식으로 볼 수 있을까요?'],summaryPoints:['기억이 한 사람의 정체성을 구성하는 핵심 요소인지 함께 살펴보았습니다.','기억이 흔들리더라도 관계 속 태도와 선택이 인간다움을 보여줄 수 있다는 의견이 나왔습니다.','작품의 마지막 장면을 관계의 포기가 아닌 끝까지 지키려는 선택으로 해석하기도 했습니다.','같은 장면을 두고도 기억, 관계, 선택의 중요성에 대한 서로 다른 경험과 관점이 이어졌습니다.'],differentViews:[{label:'관점 A',text:'기억이 인간을 만든다. 기억이 없다면 선택의 이유와 정체성도 달라질 수 있다.'},{label:'관점 B',text:'기억보다 선택이 인간다움을 만든다. 기억이 사라져도 타인을 대하는 태도는 남을 수 있다.'}],highlightQuote:{text:'기억보다 선택이 결국 나를 만든다고 생각해요.',speaker:'문장수집가'},keywords:['인간다움','기억','선택','정체성'],nextQuestion:'기억을 모두 잃더라도 같은 사람이라고 할 수 있을까요?'}];
  }
  function normalizeReport(r){
    const messages=Array.isArray(r.messages)?r.messages:[];
    const participants=(Array.isArray(r.participants)&&r.participants.length?r.participants:[...new Set(messages.map(m=>m.user).filter(Boolean))]);
    const book=r.book||'주제도서 미정';
    const rawDuration=r.duration||'00:00';
    const duration=/^\d{1,3}:\d{2}$/.test(rawDuration)?`${Number(rawDuration.split(':')[0])}분 ${Number(rawDuration.split(':')[1])}초`:rawDuration;
    return {
      ...r, book, author:r.author||'', title:r.title||`${book} 독서모임`,
      date:r.date||'저장된 기록', duration, participants,
      oneLine:r.oneLine||r.summary||'함께 읽고 서로의 생각을 나눈 독서모임 기록입니다.',
      discussionPrompts:Array.isArray(r.discussionPrompts)&&r.discussionPrompts.length?r.discussionPrompts:(r.prompt?[r.prompt]:[]),
      summaryPoints:Array.isArray(r.summaryPoints)&&r.summaryPoints.length?r.summaryPoints:(r.summary?[r.summary]:['서로 다른 감상과 해석을 중심으로 이야기를 나누었습니다.']),
      differentViews:Array.isArray(r.differentViews)?r.differentViews:[],
      highlightQuote:r.highlightQuote||null, keywords:Array.isArray(r.keywords)?r.keywords:[],
      nextQuestion:r.nextQuestion||'',
    };
  }
  function reportCard(r){
    r=normalizeReport(r);
    return `<article class="report-card archive-card-simple">
      <div class="report-card-main"><span class="role">${esc(r.date)}</span><h3>📖 ${esc(r.book)}${r.author?` · ${esc(r.author)}`:''}</h3>
      <p class="report-meta"><span>👥 참여 ${r.participants.length}명</span><span>🕒 ${esc(r.duration)}</span></p>
      <div class="keywords">${r.keywords.slice(0,4).map(k=>`<span>#${esc(k)}</span>`).join('')}</div></div>
      <button type="button" class="report-detail-btn" data-report-id="${esc(r.id)}">독서기록 보기</button>
    </article>`;
  }
  function renderReportPreview(){
    const reports=getReports().map(normalizeReport);
    const empty='<div class="archive-sync-note">아직 저장된 독서모임 기록이 없습니다. LIVE ROOM에서 모임을 종료하면 이곳과 독서 아카이브에 함께 저장됩니다.</div>';
    const preview=q('#reportPreviewList'); if(preview) preview.innerHTML=reports.length?reports.slice(0,4).map(reportCard).join(''):empty;
    const archive=document.getElementById('liveMeetingArchiveList'); if(archive) archive.innerHTML=reports.length?reports.map(reportCard).join(''):empty;
  }
  function openReportDetail(reportId){
    const report=getReports().map(normalizeReport).find(r=>String(r.id)===String(reportId));
    const dialog=document.getElementById('meetingArchiveDialog'), body=document.getElementById('meetingArchiveDialogBody'); if(!report||!dialog||!body) return;
    const prompts=report.discussionPrompts.length?report.discussionPrompts:['기록된 발제문이 없습니다.'];
    const views=report.differentViews.length?report.differentViews:[{label:'다양한 관점',text:'참여자들이 같은 장면을 서로 다른 경험과 시선으로 해석했습니다.'}];
    const people=report.participants.length?report.participants:['참여자 기록 없음'];
    body.innerHTML=`
      <header class="archive-detail-header"><span>📚 독서모임 아카이브</span><h2>📖 ${esc(report.book)}${report.author?` · ${esc(report.author)}`:''}</h2><p>${esc(report.date)} · 참여 ${people.length}명 · ${esc(report.duration)}</p></header>
      <section class="archive-detail-section archive-ai-line"><h3>🤖 AI가 남긴 한 줄 기록</h3><blockquote>“${esc(report.oneLine)}”</blockquote></section>
      <section class="archive-detail-section"><h3>📖 이번 모임 발제문</h3><ol>${prompts.map((v,i)=>`<li><b>${i+1}</b><span>${esc(v)}</span></li>`).join('')}</ol></section>
      <section class="archive-detail-section"><h3>💬 토론 요약</h3><ul>${report.summaryPoints.slice(0,5).map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section>
      <section class="archive-detail-section"><h3>⚖ 다양한 의견</h3><div class="viewpoint-list">${views.map(v=>`<article><strong>${esc(v.label||'관점')}</strong><p>${esc(v.text||v)}</p></article>`).join('')}</div></section>
      ${report.highlightQuote?`<section class="archive-detail-section highlight-quote"><h3>✨ 오늘의 문장</h3><blockquote>“${esc(report.highlightQuote.text||report.highlightQuote)}”</blockquote><p>— ${esc(report.highlightQuote.speaker||'참여자')}</p></section>`:''}
      <section class="archive-detail-section"><h3>🏷 핵심 키워드</h3><div class="detail-keywords">${report.keywords.map(k=>`<span>#${esc(k)}</span>`).join('')||'<span>#독서모임</span>'}</div></section>
      ${report.nextQuestion?`<section class="archive-detail-section next-question"><h3>🌱 다음 모임을 위한 질문</h3><p>“${esc(report.nextQuestion)}”</p></section>`:''}
      <section class="archive-detail-section people-section"><h3>📚 함께 읽은 사람들</h3><div class="archive-people">${people.map(name=>`<span>${name==='AI 모아'?'🤖':'🙂'} ${esc(name)}</span>`).join('')}</div></section>`;
    dialog.showModal(); document.body.classList.add('archive-dialog-open');
  }
  function closeReportDetail(){ const d=document.getElementById('meetingArchiveDialog'); if(d?.open)d.close(); document.body.classList.remove('archive-dialog-open'); }
  function copyInvite(){ navigator.clipboard?.writeText(location.href.split('?')[0]+'?invite=1#club-meeting').then(()=>toast('초대링크를 복사했어요.')).catch(()=>toast('초대링크 복사가 지원되지 않아요.')); }

  function renderLiveVote(){
    const summary=q('#liveVoteSummary'), comments=q('#liveVoteComments');
    const vote=state.liveVote || {choice:'참여', total:8, join:5, comments:[]};
    if(summary) summary.textContent = `총 ${vote.total}명 중 ${vote.join}명 참여 예정`;
    const joinCount=q('#liveVoteJoinCount'); if(joinCount) joinCount.textContent = `${vote.join}명`;
    const bar=q('#liveVoteBar'); if(bar) bar.style.width = `${Math.max(0, Math.min(100, Math.round((vote.join / Math.max(1, vote.total)) * 100)))}%`;
    qa('.live-vote-btn').forEach(btn=>btn.classList.remove('active','bg-brand-sageLight','text-brand-sageDark','border-brand-sage'));
    const active = vote.choice === '참여' ? q('#voteJoinBtn') : q('#voteMaybeBtn');
    if(active) active.classList.add('active','bg-brand-sageLight','text-brand-sageDark','border-brand-sage');
    if(comments) comments.innerHTML = (vote.comments||[]).map(c=>`<div class="vote-comment compact-line">${avatarHTML(c.user,'post-avatar')}<strong>${esc(c.user)}</strong><span class="vote-comment-text">${esc(c.text)}</span></div>`).join('');
  }
  function fillScheduleEditor(){
    const b=state.currentBook; const n=state.nextBooks?.[0] || {};
    const set=(id,val)=>{ const el=q('#'+id); if(el) el.value=val||''; };
    set('currentScheduleTitle', b.title); set('currentScheduleAuthor', b.author); set('currentScheduleDate', b.date); set('currentSchedulePlace', b.place); set('currentScheduleRange', b.readingRange); set('currentSchedulePoints', b.points);
    set('nextScheduleTitle', n.title); set('nextScheduleAuthor', n.author); set('nextScheduleDate', n.date); set('nextSchedulePlace', n.place); set('nextScheduleMemo', n.memo);
  }
  function toggleScheduleEditor(show=true){ editingCurrent=!!show; const form=q('#currentInlineEditForm'); if(!form) return; if(show){ fillScheduleEditor(); form.classList.remove('hidden'); form.scrollIntoView({behavior:'smooth', block:'center'}); } else form.classList.add('hidden'); }
  function saveScheduleEditor(){
    const val=id=>q('#'+id)?.value.trim() || '';
    const currentMeta = (typeof getSelectedBookMeta === 'function') ? getSelectedBookMeta('currentScheduleTitle') : {};
    state.currentBook.title=currentMeta.title || val('currentScheduleTitle')||state.currentBook.title;
    state.currentBook.author=currentMeta.author || val('currentScheduleAuthor')||state.currentBook.author;
    state.currentBook.coverUrl=currentMeta.coverUrl || state.currentBook.coverUrl || '';
    state.currentBook.publisher=currentMeta.publisher || state.currentBook.publisher || '모임장 지정';
    state.currentBook.isbn=currentMeta.isbn || state.currentBook.isbn || '';
    state.currentBook.date=val('currentScheduleDate')||state.currentBook.date;
    state.currentBook.place=val('currentSchedulePlace')||state.currentBook.place;
    state.currentBook.readingRange=val('currentScheduleRange')||state.currentBook.readingRange;
    state.currentBook.points=val('currentSchedulePoints')||state.currentBook.points;
    saveState(); syncBook(); renderActivity(); renderLiveVote(); toggleScheduleEditor(false); toast('이번 모임을 저장했어요.');
  }
  function saveNextBookEdit(idx){
    const val=id=>q('#'+id)?.value.trim() || '';
    const meta = (typeof getSelectedBookMeta === 'function') ? getSelectedBookMeta(`nextEditTitle${idx}`) : {};
    const nb=state.nextBooks[idx]; if(!nb) return;
    nb.title=meta.title || val(`nextEditTitle${idx}`) || nb.title;
    nb.author=meta.author || val(`nextEditAuthor${idx}`) || nb.author || '저자 미정';
    nb.coverUrl=meta.coverUrl || nb.coverUrl || '';
    nb.publisher=meta.publisher || nb.publisher || '모임장 지정';
    nb.isbn=meta.isbn || nb.isbn || '';
    nb.date=val(`nextEditDate${idx}`) || nb.date || '일정 미정';
    nb.place=val(`nextEditPlace${idx}`) || nb.place || 'LIVE ROOM';
    nb.memo=val(`nextEditMemo${idx}`) || nb.memo || '상세 안내 미정';
    editingNextIndex=null; saveState(); renderTopicBooks(); renderActivity(); toast('다음 모임을 저장했어요.');
  }
    function syncAiOptionSelections(){
    qa('.concise-ai-options .ai-option-card').forEach(card=>{
      const input=card.querySelector('input');
      card.classList.toggle('is-selected', !!(input && input.checked));
    });
  }
  function bootMeetingCommunity(){
    if(booted || !root()) return; booted = true;
    if(new URLSearchParams(location.search).get('invite') === '1') state.membership='invited';
    qa('.nav-item').forEach(b=>b.addEventListener('click',()=>switchCommunityView(b.dataset.view)));
    qa('[data-go]').forEach(b=>b.addEventListener('click',()=>switchCommunityView(b.dataset.go)));
    q('#activityList')?.addEventListener('click', e=>{
      const row=e.target.closest('.meeting-status-row'); if(!row) return;
      if(row.dataset.statusHref){ location.href=row.dataset.statusHref; return; }
      if(row.dataset.statusTarget) switchCommunityView(row.dataset.statusTarget);
    });
    q('#copyInviteBtn')?.addEventListener('click',copyInvite); q('#inviteMemberBtn')?.addEventListener('click',copyInvite);
    q('#membershipActionBtn')?.addEventListener('click',()=>{ if(isInvited() && state.membership !== 'member'){ state.membership='member'; toast('모임에 참여했어요.'); } else { state.membership='invited'; toast('모임에서 탈퇴했습니다. 초대링크로 다시 참여할 수 있어요.'); } saveState(); renderMembershipButton(); });
    q('#chatForm')?.addEventListener('submit',e=>{e.preventDefault(); const input=q('#chatInput'), text=input.value.trim(); if(!text) return; state.chat.push({user:currentNickname(),text}); input.value=''; saveState(); renderChat();});
    q('#addPhotoMessageBtn')?.addEventListener('click',()=>{state.chat.push({user:currentNickname(),text:'📷 사진을 첨부했습니다.'}); saveState(); renderChat(); toast('사진 메시지를 추가했어요.');});
    q('#emojiChatBtn')?.addEventListener('click',()=>{ const input=q('#chatInput'); if(input){ input.value += ' 😊'; input.focus(); }});
    qa('.board-tab').forEach(btn=>btn.addEventListener('click',()=>{ state.boardFilter=btn.dataset.boardFilter; qa('.board-tab').forEach(b=>b.classList.toggle('active',b===btn)); renderPosts(); }));
    q('#postForm')?.addEventListener('submit',e=>{e.preventDefault(); const title=q('#postTitle').value.trim(), body=q('#postBody').value.trim(), category=q('#postCategory').value; if(!title||!body) return toast('제목과 내용을 입력해주세요.'); state.posts.unshift({id:Date.now(),category,author:currentNickname(),title,body,likes:0,comments:[],time:'방금 전'}); q('#postTitle').value=''; q('#postBody').value=''; saveState(); renderPosts(); toast('게시글을 등록했어요.');});
    q('#postList')?.addEventListener('click',e=>{const post=e.target.closest('.post'); if(!post) return; const p=state.posts.find(x=>x.id==post.dataset.id); if(!p) return;
      if(e.target.closest('.post-edit-btn')){ if(!canEditByAuthor(p.author)) return toast('본인 글만 수정할 수 있어요.'); state.posts.forEach(x=>x.editing=false); p.editing=true; saveState(); renderPosts(); return; }
      if(e.target.closest('.cancel-post-edit')){ p.editing=false; saveState(); renderPosts(); return; }
      if(e.target.closest('.post-delete-btn')){ if(!canEditByAuthor(p.author)) return toast('본인 글만 삭제할 수 있어요.'); if(!confirm('이 게시글을 삭제할까요?')) return; state.posts=state.posts.filter(x=>x.id!=p.id); saveState(); renderPosts(); renderActivity(); toast('게시글을 삭제했어요.'); return; }
      if(e.target.closest('.admin-post-delete-btn')){ if(!confirm('모임장 권한으로 이 게시글을 삭제할까요?')) return; state.posts=state.posts.filter(x=>x.id!=p.id); saveState(); renderPosts(); renderActivity(); toast('게시글을 삭제했어요.'); return; }
      if(e.target.closest('.comment-edit-btn')){ const idx=Number(e.target.closest('.comment-edit-btn').dataset.commentIndex); p.comments=p.comments.map(normalizeComment); const c=p.comments[idx]; if(!c || !canEditByAuthor(c.author)) return toast('본인 댓글만 수정할 수 있어요.'); const text=prompt('댓글을 수정하세요.', c.text||''); if(text===null) return; c.text=text.trim()||c.text; c.time='수정됨'; saveState(); renderPosts(); toast('댓글을 수정했어요.'); return; }
      if(e.target.closest('.comment-delete-btn')){ const idx=Number(e.target.closest('.comment-delete-btn').dataset.commentIndex); p.comments=p.comments.map(normalizeComment); const c=p.comments[idx]; if(!c || !canEditByAuthor(c.author)) return toast('본인 댓글만 삭제할 수 있어요.'); if(!confirm('이 댓글을 삭제할까요?')) return; p.comments.splice(idx,1); saveState(); renderPosts(); renderActivity(); toast('댓글을 삭제했어요.'); return; }
      if(e.target.closest('.like-btn')){p.liked=!p.liked; p.likes=Math.max(0,(p.likes||0)+(p.liked?1:-1)); saveState(); renderPosts(); renderActivity(); return;} if(e.target.closest('.comment-toggle-btn')){ p.commentsOpen = !p.commentsOpen; saveState(); renderPosts(); return; } if(e.target.classList.contains('comment-like-btn')){ const idx=Number(e.target.dataset.commentIndex); p.comments=p.comments.map(normalizeComment); const c=p.comments[idx]; if(c){ c.liked=!c.liked; c.likes=Math.max(0,(c.likes||0)+(c.liked?1:-1)); saveState(); renderPosts(); } }});
    q('#postList')?.addEventListener('submit',e=>{ const postEl=e.target.closest('.post'); const p=state.posts.find(x=>x.id==postEl?.dataset.id); if(!p) return;
      if(e.target.classList.contains('post-inline-edit-form')){ e.preventDefault(); if(!canEditByAuthor(p.author)) return toast('본인 글만 수정할 수 있어요.'); const title=e.target.querySelector('.post-edit-title')?.value.trim(); const body=e.target.querySelector('.post-edit-body')?.value.trim(); if(!title || !body) return toast('제목과 내용을 모두 입력해주세요.'); p.title=title; p.body=body; p.time='수정됨'; p.editing=false; saveState(); renderPosts(); toast('게시글을 수정했어요.'); return; }
      if(!e.target.classList.contains('comment-box')) return; e.preventDefault(); const input=e.target.querySelector('input'), text=input.value.trim(); if(!text) return; p.comments=(p.comments||[]).map(normalizeComment); p.comments.push({author:currentNickname(), text, time:'방금 전', likes:0, liked:false}); saveState(); renderPosts(); renderActivity();});
    q('#showNextBookFormBtn')?.addEventListener('click',()=>q('#nextTopicForm')?.classList.toggle('hidden'));
    q('#openScheduleEditorBtn')?.addEventListener('click',()=>toggleScheduleEditor(true));
    q('#inlineCurrentEditBtn')?.addEventListener('click',()=>toggleScheduleEditor(true));
    q('#cancelCurrentInlineEditBtn')?.addEventListener('click',()=>toggleScheduleEditor(false));
    q('#currentInlineEditForm')?.addEventListener('submit',e=>{ e.preventDefault(); saveScheduleEditor(); });
    q('#finishCurrentMeetingBtn')?.addEventListener('click',()=>{ state.previousBooks.unshift({...state.currentBook, method:state.currentBook.place||'LIVE ROOM', archive:true, memo:'모임 종료 처리됨'}); if(state.nextBooks.length){ const nb=state.nextBooks.shift(); state.currentBook={title:nb.title, author:nb.author, publisher:nb.publisher||'모임장 지정', date:nb.date, place:nb.place||'LIVE ROOM', readingRange:nb.readingRange||'자율', points:nb.memo||'', isbn:nb.isbn||'', coverUrl:nb.coverUrl||''}; } saveState(); syncBook(); renderActivity(); toast('현재 모임을 종료하고 다음 모임을 준비 상태로 옮겼어요.'); });
    q('#searchCurrentBookBtn')?.addEventListener('click',()=>{ if(typeof openBookSearchModal==='function') openBookSearchModal('currentScheduleTitle','currentScheduleAuthor',null); else toast('책 검색 기능을 불러오지 못했어요.'); });
    q('#searchNextTopicBookBtn')?.addEventListener('click',()=>{ if(typeof openBookSearchModal==='function') openBookSearchModal('nextTopicTitle','nextTopicAuthor',null); else toast('책 검색 기능을 불러오지 못했어요.'); });
    q('#nextTopicForm')?.addEventListener('submit',e=>{ e.preventDefault(); const title=q('#nextTopicTitle').value.trim(), author=q('#nextTopicAuthor').value.trim(), date=q('#nextTopicDate').value.trim(), memo=q('#nextTopicMemo').value.trim(); if(!title||!author) return toast('도서명과 저자를 입력해주세요.'); const meta=(typeof getSelectedBookMeta==='function')?getSelectedBookMeta('nextTopicTitle'):{}; state.nextBooks.push({title:meta.title||title,author:meta.author||author,date:date||'일정 미정', place:'LIVE ROOM', memo:memo||'상세 메모 없음', coverUrl:meta.coverUrl||'', publisher:meta.publisher||'모임장 지정', isbn:meta.isbn||''}); ['#nextTopicTitle','#nextTopicAuthor','#nextTopicDate','#nextTopicMemo'].forEach(sel=>q(sel).value=''); saveState(); renderTopicBooks(); toast('다음 주제도서를 추가했어요.'); });
    q('#nextTopicList')?.addEventListener('click',e=>{ const idx=Number(e.target.dataset.index); if(Number.isNaN(idx)) return; if(e.target.classList.contains('remove-next-book')){ state.nextBooks.splice(idx,1); editingNextIndex=null; saveState(); renderTopicBooks(); renderActivity(); return; } if(e.target.classList.contains('edit-next-book')){ editingNextIndex=idx; renderTopicBooks(); return; } if(e.target.classList.contains('cancel-next-edit')){ editingNextIndex=null; renderTopicBooks(); return; } if(e.target.classList.contains('next-search-book')){ if(typeof openBookSearchModal==='function') openBookSearchModal(`nextEditTitle${idx}`,`nextEditAuthor${idx}`,null); else toast('책 검색 기능을 불러오지 못했어요.'); return; } if(e.target.classList.contains('promote-next-book')){ const nb=state.nextBooks.splice(idx,1)[0]; state.previousBooks.unshift({...state.currentBook, method:'온라인', archive:true, memo:'이전 현재도서에서 이동됨'}); state.currentBook={title:nb.title, author:nb.author, publisher:nb.publisher||'모임장 지정', date:nb.date, place:nb.place||'LIVE ROOM', readingRange:nb.readingRange||'자율', points:nb.memo, progress:0, isbn:nb.isbn||'', coverUrl:nb.coverUrl||''}; saveState(); syncBook(); renderActivity(); toast('현재 주제도서로 지정했어요.'); }});
    q('#nextTopicList')?.addEventListener('submit',e=>{ if(!e.target.classList.contains('next-inline-edit-form')) return; e.preventDefault(); saveNextBookEdit(Number(e.target.dataset.index)); });
    q('#memberList')?.addEventListener('click',e=>{ const row=e.target.closest('.member-row'); if(!row) return; renderMembers(Number(row.dataset.index)); });
    q('#scheduleForm')?.addEventListener('submit',e=>{e.preventDefault(); const date=q('#scheduleDate').value.trim(), title=q('#scheduleTitle').value.trim(), meta=q('#scheduleMeta').value.trim(); if(!date||!title) return toast('날짜와 일정명을 입력해주세요.'); state.schedules.unshift({date,title,meta:meta||'세부 미정'}); ['#scheduleDate','#scheduleTitle','#scheduleMeta'].forEach(s=>q(s).value=''); saveState(); renderSchedule(); toast('일정을 등록했어요.');});
    q('#clubSettingsForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.club.title=q('#clubNameInput').value.trim()||state.club.title; state.club.category=q('#clubCategoryInput').value.trim()||state.club.category; state.club.desc=q('#clubDescInput').value.trim()||state.club.desc; state.club.privacy=q('#clubPrivacyInput').value; state.club.joinType=q('#clubJoinTypeInput').value; state.club.age=q('#clubAgeInput').value.trim()||state.club.age; state.club.region=q('#clubRegionInput').value.trim()||state.club.region; state.club.rule=q('#clubRuleInput').value.trim()||state.club.rule; saveState(); syncClub(); toast('모임 기본 정보를 저장했어요.'); });
    qa('.ai-option-card[data-ai-role]').forEach(card=>card.addEventListener('click',()=>{ const input=card.querySelector('input'); if(input) input.checked=true; state.aiMode=card.dataset.aiRole; qa('.ai-option-card[data-ai-role]').forEach(c=>c.classList.toggle('active', c===card)); syncAiOptionSelections(); saveState(); syncAiMode(); renderActivity(); toast(`AI 역할을 ${state.aiMode}(으)로 설정했어요.`)}));
    qa('.concise-ai-options input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{ syncAiOptionSelections(); }));
    q('#voteJoinBtn')?.addEventListener('click',()=>{ state.liveVote.choice='참여'; state.liveVote.join=Math.max(state.liveVote.join,5); saveState(); renderLiveVote(); renderActivity(); toast('참여 예정으로 표시했어요.'); });
    q('#voteMaybeBtn')?.addEventListener('click',()=>{ state.liveVote.choice='다음에 참여'; state.liveVote.join=Math.max(0,state.liveVote.join-1); saveState(); renderLiveVote(); renderActivity(); toast('다음에 참여로 표시했어요.'); });
    q('#liveVoteForm')?.addEventListener('submit',e=>{ e.preventDefault(); const input=q('#liveVoteReason'); const text=input.value.trim(); if(!text) return toast('댓글 내용을 입력해주세요.'); state.liveVote.comments.unshift({user:currentNickname(),text}); input.value=''; saveState(); renderLiveVote(); });
    q('#previewLiveReportBtn')?.addEventListener('click',renderReportPreview);
    document.addEventListener('click',e=>{ const btn=e.target.closest('.report-detail-btn'); if(btn) openReportDetail(btn.dataset.reportId); });
    document.getElementById('meetingArchiveDialogClose')?.addEventListener('click',closeReportDetail);
    document.getElementById('meetingArchiveDialog')?.addEventListener('click',e=>{ if(e.target===e.currentTarget) closeReportDetail(); });
    syncAiOptionSelections(); syncClub(); syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderLiveVote(); renderReportPreview();
  }
  window.openBookmateCommunityMeeting = function(activeGathering){ bootMeetingCommunity(); syncClub(activeGathering); syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderLiveVote(); renderReportPreview(); switchCommunityView('home'); };
  function findGatheringByTitle(bookTitle, gatheringId){
    try{ const list = (typeof state !== 'undefined' && state.gatherings) ? state.gatherings : (window.state && window.state.gatherings ? window.state.gatherings : []); if(gatheringId) return list.find(x => Number(x.id) === Number(gatheringId)); return list.find(x => x.book === bookTitle && x.joined) || list.find(x => x.book === bookTitle) || null; } catch(e){ return null; }
  }
  window.enterMeetingRoom = function(bookTitle = '작별인사', gatheringId = null){ const activeGathering = findGatheringByTitle(bookTitle, gatheringId); if(activeGathering) window.bookmateCurrentGatheringId = activeGathering.id; if(typeof navigate === 'function') navigate('club-meeting'); setTimeout(()=>window.openBookmateCommunityMeeting(activeGathering), 0); toast('독서모임 커뮤니티에 입장했습니다. LIVE는 LIVE 탭에서 별도 입장할 수 있어요.'); };
  window.enterMeetingRoomById = function(id){ const activeGathering = findGatheringByTitle('', id); if(activeGathering) window.bookmateCurrentGatheringId = activeGathering.id; if(typeof navigate === 'function') navigate('club-meeting'); setTimeout(()=>window.openBookmateCommunityMeeting(activeGathering), 0); toast('독서모임 커뮤니티에 입장했습니다.'); };
  document.addEventListener('DOMContentLoaded', bootMeetingCommunity);
})();
