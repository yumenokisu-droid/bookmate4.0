(function(){
  const ROOT_ID = 'view-club-meeting';
  const STORAGE_KEY = 'bookmate_meeting_phase13_realfix';
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
    currentBook:{title:'작별인사', author:'김영하', publisher:'복복서가', date:'7월 11일 오후 8시', place:'LIVE ROOM', points:'인간다움, 선택, 작별의 의미', coverUrl:'https://image.yes24.com/goods/108887930/XL', isbn:'9791191114225'},
    previousBooks:[
      {title:'데미안', author:'헤르만 헤세', date:'6월 12일', method:'온라인', archive:true, memo:'자아와 성장에 대한 토론', isbn:'9788937460449'},
      {title:'노인과 바다', author:'어니스트 헤밍웨이', date:'5월 18일', method:'오프라인', archive:false, memo:'포기하지 않는 태도에 대한 대화', isbn:'9788937462788'}
    ],
    nextBooks:[
      {title:'아몬드', author:'손원평', date:'8월 9일 오후 8시', memo:'공감 능력과 성장에 대해 이야기하기', isbn:'9788936434267'},
      {title:'소년이 온다', author:'한강', date:'9월 예정', memo:'역사와 기억을 다루는 방식 함께 읽기', isbn:'9788936434120'}
    ],
    chat:[
      {user:'문장수집가', text:'이번 책은 마지막 장면 이야기가 제일 많을 것 같아요.'},
      {user:'AI 모아', text:'필요하면 “모아야”라고 불러주세요. 줄거리나 등장인물 정리를 도와드릴게요.'}
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
  function root(){ return document.getElementById(ROOT_ID); }
  function q(sel){ const r=root(); return r ? r.querySelector(sel) : null; }
  function qa(sel){ const r=root(); return r ? Array.from(r.querySelectorAll(sel)) : []; }
  function loadState(){ try { return merge(defaultState, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}); } catch(e){ return JSON.parse(JSON.stringify(defaultState)); } }
  function merge(a,b){ if(Array.isArray(a)) return Array.isArray(b)?b:a; if(a && typeof a==='object'){ const out={...a}; Object.keys(b||{}).forEach(k=>out[k]=merge(a[k],b[k])); return out; } return b===undefined?a:b; }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function toast(text){ if (typeof showToast === 'function') showToast(text); else alert(text); }
  function isInvited(){ return new URLSearchParams(location.search).get('invite') === '1' || state.membership === 'invited'; }
  function bookCoverSlot(id, book, cls='w-full h-full object-cover rounded-2xl'){
    const title = book?.title || book?.book || 'BOOKMATE';
    return `<div id="${id}" class="w-full h-full rounded-2xl bg-brand-ivory border border-brand-ivoryDark overflow-hidden flex items-center justify-center text-center text-brand-navy text-xs font-bold px-2">${esc(title)}</div>`;
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
    const meta=q('#bookMeta'); if(meta) meta.textContent=`${b.author} · ${b.publisher}`;
    const date=q('#bookDiscussDate'); if(date) date.textContent=`토론일: ${b.date} · ${b.place}`;
    const points=q('#bookDiscussionPoints'); if(points) points.textContent=`논제: ${b.points}`;
    const homeCover=q('#homeBookCover'); if(homeCover){ homeCover.innerHTML = bookCoverSlot('homeBookCoverImg', b); hydrateBookCover('homeBookCoverImg', b, 'w-full h-full object-cover rounded-2xl'); }
    const bookCover=q('#bookCoverTitle'); if(bookCover){ bookCover.innerHTML = bookCoverSlot('bookCoverMainImg', b); hydrateBookCover('bookCoverMainImg', b, 'w-full h-full object-cover rounded-2xl'); }
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
    const items=[
      '달빛독서가님이 LIVE 참여 예정으로 표시했습니다.',
      '책읽는고양이님이 수다 게시판에 감상을 남겼습니다.',
      `AI 모아가 ${state.aiMode} 모드로 LIVE 발제문을 준비했습니다.`,
      '지난 LIVE 리포트가 아카이브와 연결되었습니다.'
    ];
    const el=q('#activityList'); if(el) el.innerHTML=items.map(x=>`<li>${esc(x)}</li>`).join('');
  }
  function renderChat(){
    const el=q('#chatFeed'); if(!el) return;
    const me = currentNickname();
    el.innerHTML=state.chat.map(m=>`<div class="message ${m.user===me||m.user==='달빛독서가'?'me':m.user.includes('AI')?'ai':''}">${avatarHTML(m.user,'chat-avatar')}<div class="message-bubble"><small>${esc(m.user)}</small><p>${esc(m.text)}</p></div></div>`).join('');
    el.scrollTop=el.scrollHeight;
    renderOnlineMembers();
  }
  function renderOnlineMembers(){
    const el=q('#onlineMemberList'); if(!el) return;
    const online = state.members.filter(m=>m.online).slice(0,5);
    el.innerHTML = online.map(m=>`<span class="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-ivory">${avatarHTML(m.name,'w-7 h-7 rounded-full overflow-hidden shrink-0')}<span class="min-w-0 truncate">🟢 ${esc(m.name)}</span></span>`).join('') + `<span class="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-sageLight text-brand-sageDark">${avatarHTML('AI 모아','w-7 h-7 rounded-full overflow-hidden shrink-0')}<span>AI 모아</span></span>`;
  }
  function renderPosts(){
    const el=q('#postList'); if(!el) return;
    const posts = state.boardFilter === '전체' ? state.posts : state.posts.filter(p=>p.category === state.boardFilter);
    el.innerHTML=posts.map(p=>`<article class="post refined-post" data-id="${p.id}"><div class="post-top post-author-line">${avatarHTML(p.author||'달빛독서가','post-avatar')}<span class="role">${esc(p.category)}</span><strong>${esc(p.author||'달빛독서가')}</strong><span>${esc(p.time||'방금 전')}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="post-meta-line"><span>좋아요 ${p.likes}</span><span>댓글 ${p.comments.length}</span></div><div class="post-actions"><button class="small-button like-btn">좋아요</button><button class="small-button comment-toggle-btn">댓글</button></div><div class="comments-wrap">${p.comments.map(c=>`<div class="comment">${esc(c)}</div>`).join('')}<form class="comment-box"><input placeholder="댓글 쓰기"/><button class="small-button" type="submit">등록</button></form></div></article>`).join('') || '<div class="empty-card">게시글이 없습니다.</div>';
  }
  function renderTopicBooks(){
    const prev=q('#previousTopicList');
    if(prev) {
      prev.innerHTML=state.previousBooks.map((b,i)=>`<article class="topic-item previous"><div class="topic-mini-cover">${bookCoverSlot(`prevTopicCover${i}`, b, 'w-full h-full object-cover rounded-xl')}</div><div><span class="role">이전</span><h3>${esc(b.title)}</h3><p>${esc(b.author)} · ${esc(b.date)} · ${esc(b.method)}</p><p class="muted">${esc(b.memo)}</p><div class="topic-actions"><button class="small-button">토론 내역</button>${b.archive?'<button class="primary-button archive-view-btn">아카이브 보기</button>':'<span class="muted small-muted">아카이브 없음</span>'}</div></div></article>`).join('');
      state.previousBooks.forEach((b,i)=>hydrateBookCover(`prevTopicCover${i}`, b, 'w-full h-full object-cover rounded-xl'));
    }
    const next=q('#nextTopicList');
    if(next) {
      next.innerHTML=state.nextBooks.map((b,i)=>`<article class="topic-item next"><div class="topic-mini-cover">${bookCoverSlot(`nextTopicCover${i}`, b, 'w-full h-full object-cover rounded-xl')}</div><div><span class="role">다음 ${i+1}</span><h3>${esc(b.title)}</h3><p>${esc(b.author)} · ${esc(b.date)}</p><p class="muted">메모: ${esc(b.memo)}</p><div class="topic-actions master-only"><button class="small-button promote-next-book" data-index="${i}">현재 도서로 지정</button><button class="small-button remove-next-book" data-index="${i}">삭제</button></div></div></article>`).join('');
      state.nextBooks.forEach((b,i)=>hydrateBookCover(`nextTopicCover${i}`, b, 'w-full h-full object-cover rounded-xl'));
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
  function getReports(){ try{return JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');}catch(e){return [];} }
  function renderReportPreview(){
    const el=q('#reportPreviewList'); if(!el) return;
    const reports=getReports();
    if(!reports.length){ el.innerHTML='<div class="archive-sync-note">아직 저장된 LIVE 리포트가 없습니다. LIVE ROOM에서 종료 리포트를 생성하면 이곳과 아카이브에 표시됩니다.</div>'; return; }
    el.innerHTML=reports.slice(0,4).map(r=>`<article class="report-card"><span class="role">${esc(r.date)}</span><h3>${esc(r.title)}</h3><p class="muted">『${esc(r.book)}』 · ${esc(r.duration)} · 참여 ${r.participants?.length||0}명</p><p>${esc(r.summary)}</p><div class="keywords">${(r.keywords||[]).map(k=>`<span>#${esc(k)}</span>`).join('')}</div></article>`).join('');
  }
  function copyInvite(){ navigator.clipboard?.writeText(location.href.split('?')[0]+'?invite=1#club-meeting').then(()=>toast('초대링크를 복사했어요.')).catch(()=>toast('초대링크 복사가 지원되지 않아요.')); }

  function renderLiveVote(){
    const summary=q('#liveVoteSummary'), comments=q('#liveVoteComments');
    const vote=state.liveVote || {choice:'참여', total:8, join:5, comments:[]};
    if(summary) summary.textContent = `총 ${vote.total}명 중 ${vote.join}명 참여 예정`;
    qa('.live-vote-btn').forEach(btn=>btn.classList.remove('active','bg-brand-sageLight','text-brand-sageDark','border-brand-sage'));
    const active = vote.choice === '참여' ? q('#voteJoinBtn') : q('#voteMaybeBtn');
    if(active) active.classList.add('active','bg-brand-sageLight','text-brand-sageDark','border-brand-sage');
    if(comments) comments.innerHTML = (vote.comments||[]).map(c=>`<div class="vote-comment">${avatarHTML(c.user,'post-avatar')}<span><strong>${esc(c.user)}</strong><br>${esc(c.text)}</span></div>`).join('');
  }
  function bootMeetingCommunity(){
    if(booted || !root()) return; booted = true;
    if(new URLSearchParams(location.search).get('invite') === '1') state.membership='invited';
    qa('.nav-item').forEach(b=>b.addEventListener('click',()=>switchCommunityView(b.dataset.view)));
    qa('[data-go]').forEach(b=>b.addEventListener('click',()=>switchCommunityView(b.dataset.go)));
    q('#copyInviteBtn')?.addEventListener('click',copyInvite); q('#inviteMemberBtn')?.addEventListener('click',copyInvite);
    q('#membershipActionBtn')?.addEventListener('click',()=>{ if(isInvited() && state.membership !== 'member'){ state.membership='member'; toast('모임에 참여했어요.'); } else { state.membership='invited'; toast('모임에서 탈퇴했습니다. 초대링크로 다시 참여할 수 있어요.'); } saveState(); renderMembershipButton(); });
    q('#chatForm')?.addEventListener('submit',e=>{e.preventDefault(); const input=q('#chatInput'), text=input.value.trim(); if(!text) return; state.chat.push({user:currentNickname(),text}); if(text.includes('모아')) state.chat.push({user:'AI 모아',text:'좋아요. 이 장면은 인물의 선택과 관계의 변화에 집중해 보면 이해하기 쉬워요.'}); input.value=''; saveState(); renderChat();});
    q('#addPhotoMessageBtn')?.addEventListener('click',()=>{state.chat.push({user:currentNickname(),text:'📷 사진을 첨부했습니다.'}); saveState(); renderChat(); toast('사진 메시지를 추가했어요.');});
    q('#emojiChatBtn')?.addEventListener('click',()=>{ const input=q('#chatInput'); if(input){ input.value += ' 😊'; input.focus(); }});
    qa('.board-tab').forEach(btn=>btn.addEventListener('click',()=>{ state.boardFilter=btn.dataset.boardFilter; qa('.board-tab').forEach(b=>b.classList.toggle('active',b===btn)); renderPosts(); }));
    q('#postForm')?.addEventListener('submit',e=>{e.preventDefault(); const title=q('#postTitle').value.trim(), body=q('#postBody').value.trim(), category=q('#postCategory').value; if(!title||!body) return toast('제목과 내용을 입력해주세요.'); state.posts.unshift({id:Date.now(),category,author:currentNickname(),title,body,likes:0,comments:[],time:'방금 전'}); q('#postTitle').value=''; q('#postBody').value=''; saveState(); renderPosts(); toast('게시글을 등록했어요.');});
    q('#postList')?.addEventListener('click',e=>{const post=e.target.closest('.post'); if(!post) return; const p=state.posts.find(x=>x.id==post.dataset.id); if(e.target.classList.contains('like-btn')){p.likes++; saveState(); renderPosts();}});
    q('#postList')?.addEventListener('submit',e=>{if(!e.target.classList.contains('comment-box')) return; e.preventDefault(); const p=state.posts.find(x=>x.id==e.target.closest('.post').dataset.id), input=e.target.querySelector('input'), text=input.value.trim(); if(!text) return; p.comments.push(text); saveState(); renderPosts();});
    q('#showNextBookFormBtn')?.addEventListener('click',()=>q('#nextTopicForm')?.classList.toggle('hidden'));
    q('#nextTopicForm')?.addEventListener('submit',e=>{ e.preventDefault(); const title=q('#nextTopicTitle').value.trim(), author=q('#nextTopicAuthor').value.trim(), date=q('#nextTopicDate').value.trim(), memo=q('#nextTopicMemo').value.trim(); if(!title||!author) return toast('도서명과 저자를 입력해주세요.'); state.nextBooks.push({title,author,date:date||'일정 미정',memo:memo||'상세 메모 없음'}); ['#nextTopicTitle','#nextTopicAuthor','#nextTopicDate','#nextTopicMemo'].forEach(sel=>q(sel).value=''); saveState(); renderTopicBooks(); toast('다음 주제도서를 추가했어요.'); });
    q('#nextTopicList')?.addEventListener('click',e=>{ const idx=Number(e.target.dataset.index); if(e.target.classList.contains('remove-next-book')){ state.nextBooks.splice(idx,1); saveState(); renderTopicBooks(); } if(e.target.classList.contains('promote-next-book')){ const nb=state.nextBooks.splice(idx,1)[0]; state.previousBooks.unshift({...state.currentBook, method:'온라인', archive:true, memo:'이전 현재도서에서 이동됨'}); state.currentBook={title:nb.title, author:nb.author, publisher:'모임장 지정', date:nb.date, place:'LIVE ROOM', points:nb.memo, progress:0}; saveState(); syncBook(); renderActivity(); toast('현재 주제도서로 지정했어요.'); }});
    q('#memberList')?.addEventListener('click',e=>{ const row=e.target.closest('.member-row'); if(!row) return; renderMembers(Number(row.dataset.index)); });
    q('#scheduleForm')?.addEventListener('submit',e=>{e.preventDefault(); const date=q('#scheduleDate').value.trim(), title=q('#scheduleTitle').value.trim(), meta=q('#scheduleMeta').value.trim(); if(!date||!title) return toast('날짜와 일정명을 입력해주세요.'); state.schedules.unshift({date,title,meta:meta||'세부 미정'}); ['#scheduleDate','#scheduleTitle','#scheduleMeta'].forEach(s=>q(s).value=''); saveState(); renderSchedule(); toast('일정을 등록했어요.');});
    q('#clubSettingsForm')?.addEventListener('submit',e=>{ e.preventDefault(); state.club.title=q('#clubNameInput').value.trim()||state.club.title; state.club.category=q('#clubCategoryInput').value.trim()||state.club.category; state.club.desc=q('#clubDescInput').value.trim()||state.club.desc; state.club.privacy=q('#clubPrivacyInput').value; state.club.joinType=q('#clubJoinTypeInput').value; state.club.age=q('#clubAgeInput').value.trim()||state.club.age; state.club.region=q('#clubRegionInput').value.trim()||state.club.region; state.club.rule=q('#clubRuleInput').value.trim()||state.club.rule; saveState(); syncClub(); toast('모임 기본 정보를 저장했어요.'); });
    qa('.ai-role-choice').forEach(btn=>btn.addEventListener('click',()=>{state.aiMode=btn.dataset.role; saveState(); syncAiMode(); renderActivity(); toast(`AI 역할을 ${state.aiMode}(으)로 설정했어요.`)}));
    q('#voteJoinBtn')?.addEventListener('click',()=>{ state.liveVote.choice='참여'; state.liveVote.join=Math.max(state.liveVote.join,5); saveState(); renderLiveVote(); toast('참여 예정으로 표시했어요.'); });
    q('#voteMaybeBtn')?.addEventListener('click',()=>{ state.liveVote.choice='다음에 참여'; state.liveVote.join=Math.max(0,state.liveVote.join-1); saveState(); renderLiveVote(); toast('다음에 참여로 표시했어요.'); });
    q('#liveVoteForm')?.addEventListener('submit',e=>{ e.preventDefault(); const input=q('#liveVoteReason'); const text=input.value.trim(); if(!text) return toast('댓글 내용을 입력해주세요.'); state.liveVote.comments.unshift({user:currentNickname(),text}); input.value=''; saveState(); renderLiveVote(); });
    q('#previewLiveReportBtn')?.addEventListener('click',renderReportPreview);
    syncClub(); syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderLiveVote(); renderReportPreview();
  }
  window.openBookmateCommunityMeeting = function(activeGathering){ bootMeetingCommunity(); syncClub(activeGathering); syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderLiveVote(); renderReportPreview(); switchCommunityView('home'); };
  function findGatheringByTitle(bookTitle, gatheringId){
    try{ const list = (typeof state !== 'undefined' && state.gatherings) ? state.gatherings : (window.state && window.state.gatherings ? window.state.gatherings : []); if(gatheringId) return list.find(x => Number(x.id) === Number(gatheringId)); return list.find(x => x.book === bookTitle && x.joined) || list.find(x => x.book === bookTitle) || null; } catch(e){ return null; }
  }
  window.enterMeetingRoom = function(bookTitle = '작별인사', gatheringId = null){ const activeGathering = findGatheringByTitle(bookTitle, gatheringId); if(activeGathering) window.bookmateCurrentGatheringId = activeGathering.id; if(typeof navigate === 'function') navigate('club-meeting'); setTimeout(()=>window.openBookmateCommunityMeeting(activeGathering), 0); toast('독서모임 커뮤니티에 입장했습니다. LIVE는 LIVE 탭에서 별도 입장할 수 있어요.'); };
  window.enterMeetingRoomById = function(id){ const activeGathering = findGatheringByTitle('', id); if(activeGathering) window.bookmateCurrentGatheringId = activeGathering.id; if(typeof navigate === 'function') navigate('club-meeting'); setTimeout(()=>window.openBookmateCommunityMeeting(activeGathering), 0); toast('독서모임 커뮤니티에 입장했습니다.'); };
  document.addEventListener('DOMContentLoaded', bootMeetingCommunity);
})();
