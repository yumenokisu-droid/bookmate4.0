(function(){
  const ROOT_ID = 'view-club-meeting';
  const STORAGE_KEY = 'bookmate_meeting_phase4_embedded';
  const REPORT_KEY = 'bookmate_live_reports';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const baseState = {
    aiMode:'퍼실리테이터',
    club:{title:'우리의 문학', desc:'좋은 책은 사람을 만나 완성됩니다. 함께 읽고, 묻고, 기록하는 문학 독서모임입니다.', meta:'문학 · 공개모임 · 18명'},
    book:{title:'작별인사',author:'김영하',publisher:'복복서가',date:'7월 11일 오후 8시',points:'인간다움, 선택, 작별의 의미'},
    nextBook:{title:'아몬드',author:'손원평'},
    monthBooks:[
      {month:'7월',title:'작별인사',author:'김영하',note:'현재 주제도서'},
      {month:'8월',title:'아몬드',author:'손원평',note:'다음 주제도서'},
      {month:'9월',title:'소년이 온다',author:'한강',note:'역사와 기억'},
      {month:'10월',title:'1984',author:'조지 오웰',note:'사회와 감시'}
    ],
    chat:[
      {user:'민지',text:'이번 책은 마지막 장면 이야기가 제일 많을 것 같아요.'},
      {user:'AI 모아',text:'필요하면 “모아야”라고 불러주세요. 줄거리나 등장인물 정리를 도와드릴게요.'}
    ],
    posts:[{id:1,category:'공지',title:'7월 LIVE 독서토론 안내',body:'토요일 오후 8시에 LIVE ROOM에서 만나요. 이어폰이 없어도 AI 음성 요약으로 흐름을 볼 수 있어요.',likes:3,comments:['확인했습니다.']}],
    schedules:[
      {date:'7.11',title:'작별인사 LIVE 토론',meta:'20:00 · LIVE ROOM'},
      {date:'7.18',title:'아몬드 사전 대화',meta:'20:00 · 일반 채팅방'},
      {date:'8.03',title:'월별 도서 선정 회의',meta:'19:30 · 온라인'}
    ]
  };
  let meetingState = loadState();
  let booted = false;
  function root(){ return document.getElementById(ROOT_ID); }
  function q(sel){ const r=root(); return r ? r.querySelector(sel) : null; }
  function qa(sel){ const r=root(); return r ? Array.from(r.querySelectorAll(sel)) : []; }
  function loadState(){ try { return {...baseState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}; } catch(e){ return JSON.parse(JSON.stringify(baseState)); } }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(meetingState)); }
  function toast(text){ if (typeof showToast === 'function') showToast(text); else alert(text); }
  function coverTitle(t){ return esc(t).replace(/(.{2,4})/g,'$1<br/>').replace(/<br\/>$/,''); }
  function switchCommunityView(view){
    qa('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    qa('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if(view === 'live') renderReportPreview();
    const target = q('.meeting-main');
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  }
  function syncClub(activeGathering){
    if(activeGathering){
      meetingState.club.title = activeGathering.title || meetingState.club.title;
      meetingState.club.desc = activeGathering.desc || meetingState.club.desc;
      meetingState.club.meta = `${activeGathering.category || '문학'} · ${activeGathering.scope || '공개모임'} · ${activeGathering.membersCount || 18}명`;
      meetingState.book.title = activeGathering.book || meetingState.book.title;
      meetingState.book.author = activeGathering.author || meetingState.book.author;
      meetingState.nextBook.title = activeGathering.nextBook || meetingState.nextBook.title;
    }
    const titleEls = [q('.club-card-mini strong'), q('.hero-content h1')];
    titleEls.forEach(el => { if(el) el.textContent = meetingState.club.title; });
    const miniMeta = q('.club-card-mini p'); if(miniMeta) miniMeta.textContent = meetingState.club.meta;
    const heroDesc = q('.hero-desc'); if(heroDesc) heroDesc.textContent = meetingState.club.desc;
  }
  function syncBook(){
    const b=meetingState.book;
    ['#heroBookTitle','#homeBookTitle','#bookTitle','#liveBookTitle'].forEach(sel=>{const el=q(sel); if(el) el.textContent=b.title;});
    const author=q('#heroBookAuthor'); if(author) author.textContent=b.author;
    const homeInfo=q('#homeBookInfo'); if(homeInfo) homeInfo.textContent=`${b.author} · ${b.publisher}`;
    const meta=q('#bookMeta'); if(meta) meta.textContent=`${b.author} · ${b.publisher}`;
    const date=q('#bookDiscussDate'); if(date) date.textContent=`토론일: ${b.date}`;
    const points=q('#bookDiscussionPoints'); if(points) points.textContent=`논제: ${b.points}`;
    const cover=q('#bookCoverTitle'); if(cover) cover.innerHTML=coverTitle(b.title);
    const next=q('#nextBookText'); if(next) next.textContent=`${meetingState.nextBook.title} · ${meetingState.nextBook.author}`;
    const month=q('#monthGoalText'); if(month) month.textContent=`${meetingState.monthBooks[0]?.month||'이번 달'}: ${meetingState.monthBooks.slice(0,2).map(x=>x.title).join(' → ')}`;
    renderMonthBooks();
  }
  function syncAiMode(){ ['#sidebarAiMode','#adminAiMode','#communityAiMode'].forEach(sel=>{const el=q(sel); if(el) el.textContent=meetingState.aiMode;}); }
  function renderActivity(){
    const items=['윤님이 독후감을 작성했습니다.','민지님이 LIVE 참여 예정으로 표시했습니다.',`AI 모아가 ${meetingState.aiMode} 모드로 LIVE 발제문을 준비했습니다.`, 'LIVE 종료 리포트가 아카이브와 연동됩니다.'];
    const el=q('#activityList'); if(el) el.innerHTML=items.map(x=>`<li>${esc(x)}</li>`).join('');
  }
  function renderChat(){
    const el=q('#chatFeed'); if(!el) return;
    el.innerHTML=meetingState.chat.map(m=>`<div class="message ${m.user==='나'?'me':m.user.includes('AI')?'ai':''}"><small>${esc(m.user)}</small>${esc(m.text)}</div>`).join('');
    el.scrollTop=el.scrollHeight;
  }
  function renderPosts(){
    const el=q('#postList'); if(!el) return;
    el.innerHTML=meetingState.posts.map(p=>`<article class="post" data-id="${p.id}"><div class="post-header"><div><span class="role">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div></div><div class="post-actions"><button class="small-button like-btn">좋아요 ${p.likes}</button><button class="small-button">댓글 ${p.comments.length}</button></div><div>${p.comments.map(c=>`<div class="comment">${esc(c)}</div>`).join('')}</div><form class="comment-box"><input placeholder="댓글 쓰기"/><button class="small-button" type="submit">등록</button></form></article>`).join('');
  }
  function renderMonthBooks(){
    const el=q('#monthBookList'); if(!el) return;
    el.innerHTML=meetingState.monthBooks.map((b,i)=>`<article class="month-book"><span class="role">${esc(b.month)}</span><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p><p class="muted">${esc(b.note||'')}</p>${i>1?`<button class="small-button remove-month" data-index="${i}">삭제</button>`:''}</article>`).join('');
  }
  function renderMembers(){
    const members=[['윤','모임장'],['민지','부모임장'],['수현','회원'],['지훈','회원'],['AI','AI 모아'],['서연','회원'],['도윤','회원'],['하린','회원']];
    const el=q('#memberGrid'); if(el) el.innerHTML=members.map(([n,r])=>`<article class="member-card"><div class="avatar">${esc(n[0])}</div><div><strong>${esc(n)}</strong><br/><span class="role">${esc(r)}</span></div></article>`).join('');
  }
  function renderSchedule(){
    const el=q('#scheduleList'); if(!el) return;
    el.innerHTML=meetingState.schedules.map((s,i)=>`<article class="schedule-item"><div class="schedule-date">${esc(s.date)}</div><div><strong>${esc(s.title)}</strong><p class="muted">${esc(s.meta)}</p></div><button class="small-button delete-schedule" data-index="${i}">관리</button></article>`).join('');
  }
  function getReports(){ try{return JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');}catch(e){return [];} }
  function renderReportPreview(){
    const el=q('#reportPreviewList'); if(!el) return;
    const reports=getReports();
    if(!reports.length){ el.innerHTML='<div class="archive-sync-note">아직 저장된 LIVE 리포트가 없습니다. LIVE ROOM에서 종료 리포트를 생성하면 이곳과 아카이브에 표시됩니다.</div>'; return; }
    el.innerHTML=reports.slice(0,4).map(r=>`<article class="report-card"><span class="role">${esc(r.date)}</span><h3>${esc(r.title)}</h3><p class="muted">『${esc(r.book)}』 · ${esc(r.duration)} · 참여 ${r.participants?.length||0}명</p><p>${esc(r.summary)}</p><div class="keywords">${(r.keywords||[]).map(k=>`<span>#${esc(k)}</span>`).join('')}</div></article>`).join('');
  }
  function copyInvite(){ navigator.clipboard?.writeText(location.href.split('#')[0]).then(()=>toast('초대링크를 복사했어요.')).catch(()=>toast('초대링크 복사가 지원되지 않아요.')); }
  function bootMeetingCommunity(){
    if(booted || !root()) return; booted = true;
    qa('.nav-item').forEach(b=>b.addEventListener('click',()=>switchCommunityView(b.dataset.view)));
    qa('[data-go]').forEach(b=>b.addEventListener('click',()=>switchCommunityView(b.dataset.go)));
    q('#copyInviteBtn')?.addEventListener('click',copyInvite); q('#adminInviteBtn')?.addEventListener('click',copyInvite);
    q('#chatForm')?.addEventListener('submit',e=>{e.preventDefault(); const input=q('#chatInput'), text=input.value.trim(); if(!text) return; meetingState.chat.push({user:'나',text}); if(text.includes('모아')) meetingState.chat.push({user:'AI 모아',text:'좋아요. 이 장면은 인물의 선택과 관계의 변화에 집중해 보면 이해하기 쉬워요.'}); input.value=''; saveState(); renderChat();});
    q('#addPhotoMessageBtn')?.addEventListener('click',()=>{meetingState.chat.push({user:'나',text:'📷 사진을 첨부했습니다.'}); saveState(); renderChat(); toast('사진 메시지를 추가했어요.');});
    q('#postForm')?.addEventListener('submit',e=>{e.preventDefault(); const title=q('#postTitle').value.trim(), body=q('#postBody').value.trim(), category=q('#postCategory').value; if(!title||!body) return toast('제목과 내용을 입력해주세요.'); meetingState.posts.unshift({id:Date.now(),category,title,body,likes:0,comments:[]}); q('#postTitle').value=''; q('#postBody').value=''; saveState(); renderPosts(); toast('게시글을 등록했어요.');});
    q('#postList')?.addEventListener('click',e=>{const post=e.target.closest('.post'); if(!post) return; const p=meetingState.posts.find(x=>x.id==post.dataset.id); if(e.target.classList.contains('like-btn')){p.likes++; saveState(); renderPosts();}});
    q('#postList')?.addEventListener('submit',e=>{if(!e.target.classList.contains('comment-box')) return; e.preventDefault(); const p=meetingState.posts.find(x=>x.id==e.target.closest('.post').dataset.id), input=e.target.querySelector('input'), text=input.value.trim(); if(!text) return; p.comments.push(text); saveState(); renderPosts();});
    q('#bookForm')?.addEventListener('submit',e=>{e.preventDefault(); const title=q('#newBookTitle').value.trim(), author=q('#newBookAuthor').value.trim(), date=q('#newBookDate').value.trim(), points=q('#newBookPoints').value.trim(); if(!title||!author) return toast('도서명과 저자를 입력해주세요.'); meetingState.book={title,author,publisher:'모임장 지정',date:date||'토론일 미정',points:points||'논제 미정'}; ['#newBookTitle','#newBookAuthor','#newBookDate','#newBookPoints'].forEach(s=>q(s).value=''); saveState(); syncBook(); toast('현재 주제도서를 변경했어요.');});
    q('#monthBookForm')?.addEventListener('submit',e=>{e.preventDefault(); const month=q('#monthBookMonth').value.trim(), title=q('#monthBookTitleInput').value.trim(), author=q('#monthBookAuthorInput').value.trim(); if(!month||!title||!author) return toast('월, 도서명, 저자를 입력해주세요.'); meetingState.monthBooks.push({month,title,author,note:'모임장 지정'}); ['#monthBookMonth','#monthBookTitleInput','#monthBookAuthorInput'].forEach(s=>q(s).value=''); saveState(); syncBook(); renderActivity(); toast('월별 도서를 추가했어요.');});
    q('#monthBookList')?.addEventListener('click',e=>{if(!e.target.classList.contains('remove-month')) return; meetingState.monthBooks.splice(Number(e.target.dataset.index),1); saveState(); syncBook();});
    q('#scheduleForm')?.addEventListener('submit',e=>{e.preventDefault(); const date=q('#scheduleDate').value.trim(), title=q('#scheduleTitle').value.trim(), meta=q('#scheduleMeta').value.trim(); if(!date||!title) return toast('날짜와 일정명을 입력해주세요.'); meetingState.schedules.unshift({date,title,meta:meta||'세부 미정'}); ['#scheduleDate','#scheduleTitle','#scheduleMeta'].forEach(s=>q(s).value=''); saveState(); renderSchedule(); toast('일정을 등록했어요.');});
    q('#openArchivePreviewBtn')?.addEventListener('click',renderReportPreview); q('#previewLiveReportBtn')?.addEventListener('click',renderReportPreview);
    syncClub(); syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderReportPreview();
  }
  window.openBookmateCommunityMeeting = function(activeGathering){ bootMeetingCommunity(); syncClub(activeGathering); syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderReportPreview(); switchCommunityView('home'); };
  function findGatheringByTitle(bookTitle, gatheringId){
    try{
      const list = (typeof state !== 'undefined' && state.gatherings) ? state.gatherings : (window.state && window.state.gatherings ? window.state.gatherings : []);
      if(gatheringId) return list.find(x => Number(x.id) === Number(gatheringId));
      return list.find(x => x.book === bookTitle && x.joined) || list.find(x => x.book === bookTitle) || null;
    } catch(e){ return null; }
  }
  window.enterMeetingRoom = function(bookTitle = '작별인사', gatheringId = null){
    const activeGathering = findGatheringByTitle(bookTitle, gatheringId);
    if(activeGathering) window.bookmateCurrentGatheringId = activeGathering.id;
    if(typeof navigate === 'function') navigate('club-meeting');
    setTimeout(()=>window.openBookmateCommunityMeeting(activeGathering), 0);
    toast('독서모임 커뮤니티에 입장했습니다. LIVE는 LIVE 탭에서 별도 입장할 수 있어요.');
  };
  window.enterMeetingRoomById = function(id){
    const activeGathering = findGatheringByTitle('', id);
    if(activeGathering) window.bookmateCurrentGatheringId = activeGathering.id;
    if(typeof navigate === 'function') navigate('club-meeting');
    setTimeout(()=>window.openBookmateCommunityMeeting(activeGathering), 0);
    toast('독서모임 커뮤니티에 입장했습니다.');
  };
  document.addEventListener('DOMContentLoaded', bootMeetingCommunity);
})();
