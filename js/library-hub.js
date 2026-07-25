/* BOOKMATE RC21 - 내 도서관 허브 / 실제 활동 기반 독서미션 */
(function () {
  const DEFAULT_LIBRARY = '익산시립도서관';
  const AI_ARCHIVE_KEY = 'bookmate_v3_ai_archives';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function currentUser() {
    return (typeof state !== 'undefined' && state.currentUser) ? state.currentUser : { isGuest:true, library:'소속도서관 없음', libraryVerified:false };
  }
  function currentLibraryName() {
    const user = currentUser();
    const raw = user.library && user.library !== '소속도서관 없음' ? user.library : DEFAULT_LIBRARY;
    return typeof window.normalizeBookmateLibraryName === 'function' ? window.normalizeBookmateLibraryName(raw) : raw;
  }
  function currentLibraryProvider() {
    return typeof window.findBookmateLibrary === 'function' ? window.findBookmateLibrary(currentLibraryName()) : null;
  }
  function currentHub() {
    return typeof window.getBookmateLibraryHub === 'function' ? window.getBookmateLibraryHub(currentLibraryName()) : null;
  }
  function missionStorageKey(missionId) {
    const user = currentUser();
    return `bookmate_library_mission_${user.id || user.nickname || 'guest'}_${missionId}`;
  }
  function rewardStorageKey() {
    const user = currentUser();
    return `bookmate_library_rewards_${user.id || user.nickname || 'guest'}`;
  }
  function getRawMissionProgress(mission) {
    if (!mission) return { enrolled:false, selectedBook:'', readRegistered:false, recordText:'', discussionComplete:false };
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(missionStorageKey(mission.id)) || 'null'); } catch(e) {}
    const progress = saved && typeof saved === 'object' ? saved : {};
    if (Array.isArray(progress.completed)) {
      if (!progress.selectedBook && progress.completed.includes('choose')) progress.selectedBook = mission.books?.[0] || '';
      if (!progress.recordText && progress.completed.includes('record')) progress.recordText = '이전 버전에서 저장된 독서기록입니다. 책 속 장면과 나의 생각을 연결해 기록했습니다.';
      if (progress.completed.includes('connect')) progress.discussionComplete = true;
    }
    if (currentUser().libraryVerified && !currentUser().isGuest && saved == null) progress.enrolled = false;
    return Object.assign({ enrolled:false, selectedBook:'', readRegistered:false, recordText:'', discussionComplete:false }, progress);
  }
  function saveMissionProgress(mission, progress) {
    try { localStorage.setItem(missionStorageKey(mission.id), JSON.stringify(progress)); } catch(e) {}
  }
  function getLibraryMissionRewards() {
    try { const saved = JSON.parse(localStorage.getItem(rewardStorageKey()) || '[]'); return Array.isArray(saved) ? saved : []; }
    catch(e) { return []; }
  }
  function grantLibraryMissionRewards(hub) {
    if (!hub || !hub.mission) return;
    const saved = getLibraryMissionRewards();
    (hub.mission.rewards || []).forEach(reward => { if (!saved.includes(reward.title)) saved.push(reward.title); });
    try { localStorage.setItem(rewardStorageKey(), JSON.stringify(saved)); } catch(e) {}
  }
  function getBook(title) { return (window.BOOKMATE_BOOKS_BY_TITLE || {})[title] || { title, author:'', cover:'' }; }
  function coverHtml(title, className) {
    const book = getBook(title);
    if (!book.cover) return `<div class="${className} library-book-fallback">${esc(title)}</div>`;
    return `<div class="${className}"><img src="${esc(book.cover)}" alt="${esc(title)} 표지" onerror="this.parentElement.classList.add('library-book-fallback');this.parentElement.textContent='${esc(title)}'"/></div>`;
  }
  function readTitles() {
    return new Set(((typeof state !== 'undefined' && state.recentBooks) || []).map(book => String(book.title || '').trim()));
  }
  function aiArchives() {
    try { const list = JSON.parse(localStorage.getItem(AI_ARCHIVE_KEY) || '[]'); return Array.isArray(list) ? list : []; }
    catch(e) { return []; }
  }
  function hasDiscussionForBook(title) {
    const nick = currentUser().nickname;
    return ((typeof state !== 'undefined' && state.socialPosts) || []).some(post => post.book === title && post.author === nick);
  }
  function deriveMissionProgress(hub) {
    const mission = hub.mission;
    const raw = getRawMissionProgress(mission);
    const selected = raw.selectedBook || '';
    const choose = !!selected;
    const read = !!selected && (raw.readRegistered || readTitles().has(selected));
    const record = String(raw.recordText || '').trim().length >= 100;
    const ai = !!selected && aiArchives().some(item => item.book === selected || String(item.title || '').includes(selected));
    const discussion = !!selected && (raw.discussionComplete || hasDiscussionForBook(selected));
    const reflect = record || ai || discussion;
    const completed = [choose && 'choose', read && 'read', reflect && 'reflect', discussion && 'bonus'].filter(Boolean);
    return Object.assign({}, raw, { selectedBook:selected, choose, read, record, ai, discussion, reflect, completed, done:choose && read && reflect });
  }

  function renderVerificationState(root) {
    const user = currentUser();
    const isGuest = !!user.isGuest;
    root.innerHTML = `<div class="library-empty-state"><div class="library-empty-icon">🏛️</div><p class="library-eyebrow">MY LIBRARY</p><h2>${isGuest ? '나의 도서관을 연결해보세요' : '소속도서관 인증이 필요해요'}</h2><p>${isGuest ? 'BOOKMATE 회원이 되어 소속도서관을 인증하면 도서 검색, 사서 추천도서, 독서미션과 도서관 전용 모임을 이용할 수 있습니다.' : '소속도서관을 인증하면 도서관별 독서미션과 추천 책장, 프로그램, 전용 독서모임이 연결됩니다.'}</p><div class="library-empty-actions">${isGuest ? '<button class="library-btn library-btn-primary" onclick="openAuthPage(\'login\')">로그인 / 회원가입</button>' : '<button class="library-btn library-btn-primary" onclick="startLibraryVerification()">소속도서관 인증하기</button>'}<button class="library-btn library-btn-light" onclick="navigate(\'home\')">홈으로 돌아가기</button></div></div>`;
  }

  function missionStepHtml(number, title, description, complete, current) {
    return `<article class="mission-compact-step ${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''}"><span>${complete ? '✓' : number}</span><div><b>${esc(title)}</b><p>${esc(description)}</p></div><em>${complete ? '완료' : current ? '진행 중' : '예정'}</em></article>`;
  }
  function getMissionNextAction(progress) {
    if (!progress.choose) return { icon:'📖', eyebrow:'먼저 할 일', title:'이번 달 함께 읽을 책을 골라보세요.', description:'사서 추천도서 가운데 마음에 드는 책 한 권을 선택하면 미션이 시작됩니다.', label:'추천도서에서 선택', action:'openLibraryMissionBookPicker()' };
    if (!progress.read) return { icon:'✓', eyebrow:'다음 활동', title:`『${progress.selectedBook}』을 다 읽으셨나요?`, description:'다 읽었다면 내 서재의 읽은 책으로 등록해 주세요. 등록과 동시에 다음 단계가 열립니다.', label:'읽은 책으로 등록', action:'registerSelectedMissionBookAsRead()' };
    if (!progress.reflect) return { icon:'✍', eyebrow:'다음 활동', title:'책에 대한 생각을 한 가지 방식으로 남겨보세요.', description:'짧은 독서기록, AI 모아와의 대화, 다른 독자와의 토론 중 편한 방법 하나면 충분합니다.', label:'생각 남기기', action:'openLibraryMissionReflectionChoices()' };
    return { icon:'🎉', eyebrow:'미션 완료', title:'이번 달 독서미션을 완료했어요.', description:'읽은 책과 남긴 생각은 나의 독서활동에 자동으로 기록되었습니다.', label:'완료 기록 보기', action:'toggleLibraryMissionDetails(true)' };
  }
  function renderMissionCard(hub) {
    const mission = hub.mission;
    const progress = deriveMissionProgress(hub);
    const coreCount = [progress.choose, progress.read, progress.reflect].filter(Boolean).length;
    const pct = Math.round(coreCount / 3 * 100);
    if (progress.done) grantLibraryMissionRewards(hub);
    const next = getMissionNextAction(progress);
    const selectedBookLine = progress.selectedBook
      ? `<span class="mission-selected-inline">선택 도서 <b>『${esc(progress.selectedBook)}』</b>${getBook(progress.selectedBook).author ? ` · ${esc(getBook(progress.selectedBook).author)}` : ''}</span>`
      : '';
    const rewardSummary = (mission.rewards || []).map(r => `${r.icon} ${esc(r.title)}`).join(' · ');
    const reflectionMethod = progress.record ? '독서기록' : progress.ai ? 'AI 대화' : progress.discussion ? '토론 참여' : '';
    return `<section class="library-mission-compact" id="library-mission-card">
      <div class="mission-compact-header">
        <div>
          <div class="mission-compact-topline"><span>${esc(mission.label)}</span><em>${mission.participants}명 참여 중</em></div>
          <h2>${esc(mission.title)}</h2>
          <p>${esc(mission.description)}</p>
          <div class="mission-compact-meta"><span>📅 ${esc(mission.period)}</span>${selectedBookLine}</div>
        </div>
        <div class="mission-compact-progress"><b>${coreCount}<small>/ 3</small></b><span>진행</span></div>
      </div>
      <div class="mission-compact-track"><i style="width:${pct}%"></i></div>
      <div class="mission-next-action ${progress.done ? 'is-complete' : ''}">
        <span class="mission-next-icon">${next.icon}</span>
        <div><small>${next.eyebrow}</small><b>${esc(next.title)}</b><p>${esc(next.description)}</p></div>
        <button class="mission-primary-action" onclick="${next.action}">${esc(next.label)}</button>
      </div>
      <div class="mission-compact-footer">
        <span>BOOKMATE 활동이 확인되면 단계가 자동으로 반영됩니다.</span>
        <button id="mission-detail-toggle" onclick="toggleLibraryMissionDetails()">과정 자세히</button>
      </div>
      <div class="mission-detail-panel hidden" id="mission-detail-panel">
        <div class="mission-detail-heading"><div><small>MISSION STEPS</small><h3>전체 과정</h3></div><span>필요할 때만 확인해보세요.</span></div>
        <div class="mission-compact-steps">
          ${missionStepHtml(1,'책 선택','사서 추천도서에서 이번 달 함께 읽을 책 한 권을 고릅니다.',progress.choose,!progress.choose)}
          ${missionStepHtml(2,'읽은 책으로 등록',progress.selectedBook ? `『${progress.selectedBook}』을 다 읽은 뒤 내 서재에 등록합니다.` : '책을 선택한 뒤 진행할 수 있습니다.',progress.read,progress.choose&&!progress.read)}
          ${missionStepHtml(3,'생각 남기기',progress.reflect ? `${reflectionMethod}으로 생각을 남겼습니다.` : '독서기록·AI 대화·토론 중 편한 방법 하나를 선택합니다.',progress.reflect,progress.read&&!progress.reflect)}
        </div>
        ${progress.read && !progress.reflect ? `<div class="mission-method-section"><div><small>CHOOSE A WAY</small><h3>어떤 방식으로 생각을 남길까요?</h3><p>한 가지만 선택하면 됩니다.</p></div><div class="mission-method-grid"><button onclick="openLibraryMissionRecordModal()"><span>✍</span><b>짧은 독서기록</b><small>책을 읽고 든 생각을 글로 정리해요.</small></button><button onclick="startMissionAIConversation()"><span>✨</span><b>AI 모아와 대화</b><small>기억에 남은 장면을 중심으로 생각을 넓혀요.</small></button><button onclick="openMissionDiscussion()"><span>💬</span><b>다른 독자와 토론</b><small>같은 책을 읽은 사람들과 의견을 나눠요.</small></button></div></div>` : ''}
        ${progress.done ? `<div class="mission-after-complete"><span>함께 이어가기</span><p>다른 참여자들이 남긴 기록을 둘러보거나 관련 토론에 참여할 수 있어요.</p><button onclick="openMissionDiscussion()">관련 이야기 보기</button></div>` : ''}
        <details class="mission-reward-details"><summary><span>🎁 완료 보상</span><em>보기</em></summary><div>${(mission.rewards || []).map(r=>`<article><span>${r.icon}</span><div><b>${esc(r.title)}</b><small>${esc(r.type)}</small></div></article>`).join('')}</div><p>${rewardSummary}</p></details>
      </div>
    </section>`;
  }

  function renderRecommendations(hub) {
    return hub.recommendations.map(title => { const book=getBook(title); return `<button class="library-book-card" onclick="openLibraryBookInfo('${esc(title)}')">${coverHtml(title,'library-book-cover')}<span><b>${esc(title)}</b><small>${esc(book.author||'')}</small></span><em>책 정보 보기</em></button>`; }).join('');
  }
  function renderPrograms(hub) {
    return (hub.programs || []).map(program => `<article class="library-program-card"><div class="library-program-badge">${esc(program.type)}</div><h3>${esc(program.title)}</h3><p>${esc(program.date)}</p><p>${esc(program.place)}</p><div><span>${esc(program.status)}</span><button onclick="openCurrentLibraryHome()">자세히 보기</button></div></article>`).join('');
  }
  function libraryGroups() {
    const library=currentLibraryName(); const all=(window.BOOKMATE_GROUPS || (typeof state!=='undefined'?state.gatherings:[]) || []);
    return all.filter(group=>group.libraryOnly || group.scope==='도서관 전용').filter(group=>!group.library || (typeof window.normalizeBookmateLibraryName==='function'?window.normalizeBookmateLibraryName(group.library):group.library)===library).slice(0,4);
  }
  function renderGroups() {
    const groups=libraryGroups(); if(!groups.length) return '<div class="library-list-empty">현재 모집 중인 소속도서관 전용 모임이 없습니다.</div>';
    return groups.map(group=>`<button class="library-group-card" onclick="enterMeetingRoom('${esc(group.book||'')}', ${Number(group.id)||'null'})">${coverHtml(group.book,'library-group-cover')}<span><small>🏛️ ${esc(currentLibraryName())} 전용</small><b>${esc(group.title)}</b><em>${esc(group.schedule||'')} · ${esc(group.method||'')}</em><i>${Number(group.membersCount||0)}/${Number(group.maxMembers||0)}명 참여</i></span></button>`).join('');
  }
  function getBadgeState(hub,badge) {
    const progress=deriveMissionProgress(hub); const rewards=getLibraryMissionRewards(); let earned=false;
    if(badge.kind==='verified') earned=!!(currentUser().libraryVerified && !currentUser().isGuest);
    else if(badge.stepId==='choose') earned=progress.choose;
    else if(badge.stepId==='record' || badge.stepId==='reflect') earned=progress.reflect;
    else if(badge.stepId==='connect' || badge.stepId==='bonus') earned=progress.discussion;
    else if(badge.requiresAll) earned=progress.done;
    else earned=!!badge.earned || rewards.includes(badge.title);
    return {earned,desc:badge.desc || (earned?'획득 완료':'독서미션 활동으로 획득')};
  }
  function renderBadges(hub) { return (hub.badges||[]).map(b=>{const st=getBadgeState(hub,b);return `<div class="library-badge-card ${st.earned?'is-earned':''}"><span>${b.icon}</span><div><b>${esc(b.title)}</b><small>${st.earned?`획득 완료 · ${esc(st.desc)}`:esc(st.desc)}</small></div><em>${st.earned?'획득':'미획득'}</em></div>`;}).join(''); }
  function countEarnedBadges(hub) { return (hub.badges||[]).filter(b=>getBadgeState(hub,b).earned).length; }

  function renderMyLibraryHub() {
    const root=document.getElementById('library-hub-content'); if(!root)return; const user=currentUser();
    if(user.isGuest || !user.libraryVerified || !user.library || user.library==='소속도서관 없음'){renderVerificationState(root);updateLibraryHeader(null);return;}
    const hub=currentHub(), provider=currentLibraryProvider(); if(!hub||!provider){root.innerHTML='<div class="library-list-empty">소속도서관 연결 정보를 불러오지 못했습니다.</div>';return;}
    updateLibraryHeader(provider); const stats=hub.stats||{};
    root.innerHTML=`<section class="library-overview-card"><div class="library-overview-copy"><div class="library-status-line"><span>✓ 인증 회원</span><em>${esc(provider.name)}</em></div><h2>도서관에서 발견하고,<br>BOOKMATE에서 함께 읽어요.</h2><p>${esc(hub.intro)}</p><div class="library-overview-actions"><button class="library-btn library-btn-primary" onclick="focusLibrarySearch()">소장자료 검색</button><button class="library-btn library-btn-light" onclick="openCurrentLibraryHome()">도서관 홈페이지</button></div></div><div class="library-overview-stats"><div><b>${Number(stats.missions||0)}</b><span>완료한 미션</span></div><div><b>${Number(stats.programs||0)}</b><span>참여 프로그램</span></div><div><b>${countEarnedBadges(hub)}</b><span>획득한 배지</span></div><div><b>${Number(stats.books||0)}</b><span>함께 읽은 책</span></div></div></section>
      <section class="library-search-panel" id="library-search-panel"><div><p class="library-eyebrow">LIBRARY SEARCH</p><h2>소속도서관에서 책 찾기</h2><p>책 제목을 입력하면 ${esc(provider.name)} 소장자료 검색결과로 바로 이동합니다.</p></div><form onsubmit="searchCurrentLibraryBook(event)"><input id="library-book-search-input" placeholder="예: 달러구트 꿈 백화점"/><button type="submit">검색하기</button></form></section>
      <div class="library-section-heading mission-section-heading"><div><p class="library-eyebrow">READING MISSION</p><h2>진행 중인 독서미션</h2></div><span>${esc(hub.mission.period)}</span></div>${renderMissionCard(hub)}
      <section class="library-content-section"><div class="library-section-heading"><div><p class="library-eyebrow">LIBRARIAN'S PICKS</p><h2>사서 추천 책장</h2></div><span>책을 누르면 정보와 소장자료 검색을 확인할 수 있어요.</span></div><div class="library-book-rail">${renderRecommendations(hub)}</div></section>
      <div class="library-split-grid"><section class="library-content-section"><div class="library-section-heading"><div><p class="library-eyebrow">PROGRAMS</p><h2>우리 도서관에서 열려요</h2></div></div><div class="library-program-list">${renderPrograms(hub)}</div></section><section class="library-content-section"><div class="library-section-heading"><div><p class="library-eyebrow">LIBRARY CLUBS</p><h2>도서관 전용 독서모임</h2></div><button onclick="navigate('search-results')">전체 탐색</button></div><div class="library-group-list">${renderGroups()}</div></section></div>
      <section class="library-content-section"><div class="library-section-heading"><div><p class="library-eyebrow">MY ACHIEVEMENTS</p><h2>나의 도서관 배지</h2></div><span>실제 미션 활동이 확인되면 자동으로 업데이트됩니다.</span></div><div class="library-badge-list">${renderBadges(hub)}</div></section>`;
    try{lucide.createIcons();}catch(e){}
  }
  function updateLibraryHeader(provider) {
    const user=currentUser(),title=document.getElementById('library-page-title'),desc=document.getElementById('library-page-desc'),badge=document.getElementById('library-page-badge');
    if(title)title.textContent=provider?provider.name:'내 도서관'; if(desc)desc.textContent=provider?'나의 도서관 장서와 독서활동을 한곳에서 연결합니다.':'소속도서관을 인증하고 도서관 기반 독서활동을 시작해보세요.';
    if(badge){badge.textContent=user.libraryVerified&&provider?'인증 완료':'미인증';badge.classList.toggle('is-verified',!!(user.libraryVerified&&provider));}
  }
  function renderHomeLibraryMissionPreview() {
    const section=document.getElementById('home-library-mission-section'),card=document.getElementById('home-library-mission-card'); if(!section||!card)return; const user=currentUser();
    if(user.isGuest||!user.libraryVerified){section.classList.add('hidden');return;} const hub=currentHub(); if(!hub?.mission){section.classList.add('hidden');return;} section.classList.remove('hidden');
    const p=deriveMissionProgress(hub),complete=[p.choose,p.read,p.reflect].filter(Boolean).length;
    card.innerHTML=`<div class="home-library-mission-icon">🏛️</div><div class="home-library-mission-copy"><span>${esc(currentLibraryName())} · ${esc(hub.mission.label)}</span><h3>${esc(hub.mission.title)}</h3><p>${p.selectedBook?`선택한 책 『${esc(p.selectedBook)}』 · `:''}${esc(hub.mission.period)} · ${hub.mission.participants}명 참여 중</p><div class="home-library-progress"><i style="width:${Math.round(complete/3*100)}%"></i></div></div><div class="home-library-mission-action"><b>${complete}/3</b><button onclick="navigate('library')">미션 보기</button></div>`;
  }

  function openLibraryMissionBookPicker() {
    const hub=currentHub(); if(!hub)return; let modal=document.getElementById('library-mission-modal'); if(!modal){modal=document.createElement('div');modal.id='library-mission-modal';modal.className='mission-modal hidden';document.body.appendChild(modal);}
    modal.innerHTML=`<div class="mission-modal-backdrop" onclick="closeLibraryMissionModal()"></div><div class="mission-modal-card"><button class="mission-modal-close" onclick="closeLibraryMissionModal()">×</button><span class="library-eyebrow">CHOOSE A BOOK</span><h2>이번 미션에서 읽을 책을 골라보세요.</h2><p>선택한 책은 언제든 바꿀 수 있습니다.</p><div class="mission-book-picker">${hub.mission.books.map(title=>`<button onclick="selectLibraryMissionBook('${esc(title)}')">${coverHtml(title,'mission-picker-cover')}<span><b>${esc(title)}</b><small>${esc(getBook(title).author||'')}</small></span></button>`).join('')}</div></div>`;
    modal.classList.remove('hidden');
  }
  function closeLibraryMissionModal(){document.getElementById('library-mission-modal')?.classList.add('hidden');}
  function selectLibraryMissionBook(title){const hub=currentHub();if(!hub)return;const p=getRawMissionProgress(hub.mission);p.enrolled=true;p.selectedBook=title;p.readRegistered=readTitles().has(title);saveMissionProgress(hub.mission,p);closeLibraryMissionModal();showToast?.(`『${title}』로 독서미션을 시작합니다.`);renderMyLibraryHub();renderHomeLibraryMissionPreview();}
  function registerSelectedMissionBookAsRead(){const hub=currentHub();if(!hub)return;const p=getRawMissionProgress(hub.mission),title=p.selectedBook;if(!title){openLibraryMissionBookPicker();return;} if(!readTitles().has(title)){const meta=getBook(title),today=new Date(),date=`${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')} 완독`;state.recentBooks.unshift({id:Date.now(),title,author:meta.author||'저자 미상',date,review:'',coverUrl:meta.cover||'',color:'bg-[#5F8575]'});state.currentUser.readBooksCount=Number(state.currentUser.readBooksCount||0)+1;p.readRegistered=true;saveMissionProgress(hub.mission,p);saveAppState?.();renderMyPageRecentBooks?.();renderReadingTimeline?.();showToast?.(`『${title}』을 읽은 책으로 등록했어요.`);}else showToast?.('이미 읽은 책으로 등록되어 있어요.');renderMyLibraryHub();renderHomeLibraryMissionPreview();}
  function toggleLibraryMissionDetails(forceOpen){
    const panel=document.getElementById('mission-detail-panel'),button=document.getElementById('mission-detail-toggle');
    if(!panel)return;
    const shouldOpen=forceOpen===true ? true : panel.classList.contains('hidden');
    panel.classList.toggle('hidden',!shouldOpen);
    if(button)button.textContent=shouldOpen?'간단히 보기':'과정 자세히';
    if(shouldOpen) setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}),40);
  }
  function openLibraryMissionReflection(){
    const hub=currentHub();if(!hub)return;const p=deriveMissionProgress(hub);
    if(!p.selectedBook){openLibraryMissionBookPicker();return;}
    if(p.reflect){toggleLibraryMissionDetails(true);return;}
    openLibraryMissionReflectionChoices();
  }
  function openLibraryMissionReflectionChoices(){
    const hub=currentHub();if(!hub)return;const p=deriveMissionProgress(hub);
    if(!p.selectedBook){openLibraryMissionBookPicker();return;}
    let modal=document.getElementById('library-mission-modal');
    if(!modal){modal=document.createElement('div');modal.id='library-mission-modal';modal.className='mission-modal hidden';document.body.appendChild(modal);}
    modal.innerHTML=`<div class="mission-modal-backdrop" onclick="closeLibraryMissionModal()"></div><div class="mission-modal-card mission-choice-modal"><button class="mission-modal-close" onclick="closeLibraryMissionModal()">×</button><span class="library-eyebrow">CHOOSE A WAY</span><h2>어떤 방식으로 생각을 남길까요?</h2><p>『${esc(p.selectedBook)}』을 읽고 편한 방법 하나만 선택해 주세요.</p><div class="mission-choice-modal-grid"><button onclick="closeLibraryMissionModal();openLibraryMissionRecordModal()"><span>✍</span><b>짧은 독서기록</b><small>책을 읽고 든 생각을 글로 남겨요.</small></button><button onclick="closeLibraryMissionModal();startMissionAIConversation()"><span>✨</span><b>AI 모아와 대화</b><small>기억에 남은 장면을 함께 이야기해요.</small></button><button onclick="closeLibraryMissionModal();openMissionDiscussion()"><span>💬</span><b>다른 독자와 토론</b><small>같은 책을 읽은 사람들의 생각을 만나봐요.</small></button></div></div>`;
    modal.classList.remove('hidden');
  }
  function openLibraryMissionRecordModal(){const hub=currentHub();if(!hub)return;const p=getRawMissionProgress(hub.mission);if(!p.selectedBook){openLibraryMissionBookPicker();return;}let modal=document.getElementById('library-mission-modal');if(!modal){modal=document.createElement('div');modal.id='library-mission-modal';modal.className='mission-modal hidden';document.body.appendChild(modal);}modal.innerHTML=`<div class="mission-modal-backdrop" onclick="closeLibraryMissionModal()"></div><div class="mission-modal-card mission-record-card"><button class="mission-modal-close" onclick="closeLibraryMissionModal()">×</button><span class="library-eyebrow">READING NOTE</span><h2>『${esc(p.selectedBook)}』에서 오래 남은 생각</h2><p>인상 깊은 장면이나 문장, 그 이유를 100자 이상 남겨주세요.</p><textarea id="mission-record-text" maxlength="1200" placeholder="예: 이 장면에서 인물이 내린 선택이 오래 남았습니다. 내가 같은 상황이었다면…">${esc(p.recordText||'')}</textarea><div class="mission-record-footer"><span id="mission-record-count">${String(p.recordText||'').length}/100자 이상</span><button onclick="saveLibraryMissionRecord()">독서기록 저장</button></div></div>`;modal.classList.remove('hidden');const ta=document.getElementById('mission-record-text');ta?.addEventListener('input',()=>{document.getElementById('mission-record-count').textContent=`${ta.value.trim().length}/100자 이상`;});}
  function saveLibraryMissionRecord(){const hub=currentHub();if(!hub)return;const ta=document.getElementById('mission-record-text'),text=ta?.value.trim()||'';if(text.length<100){showToast?.('독서기록을 100자 이상 작성해 주세요.','error');return;}const p=getRawMissionProgress(hub.mission);p.recordText=text;p.enrolled=true;saveMissionProgress(hub.mission,p);const book=(state.recentBooks||[]).find(b=>b.title===p.selectedBook);if(book&&!book.review)book.review=text;saveAppState?.();closeLibraryMissionModal();showToast?.('독서기록이 저장되어 미션 단계가 완료되었습니다.');renderReadingTimeline?.();renderMyLibraryHub();renderHomeLibraryMissionPreview();}
  function startMissionAIConversation(){const hub=currentHub();const p=deriveMissionProgress(hub);if(!p.selectedBook){openLibraryMissionBookPicker();return;}if(typeof openHomeAIQuestion==='function')openHomeAIQuestion(p.selectedBook,'책에서 가장 오래 남은 장면','그 장면이 나에게 오래 남은 이유를 함께 이야기해볼까요? 대화를 저장하면 독서미션에 자동 반영됩니다.');else navigate('ai-chat');}
  function openMissionDiscussion(){const hub=currentHub();const p=deriveMissionProgress(hub);if(!p.selectedBook){openLibraryMissionBookPicker();return;}navigate('realtime-room');setTimeout(()=>{if(typeof openBookDiscussion==='function')openBookDiscussion(p.selectedBook);},100);}

  function searchCurrentLibraryBook(event){if(event)event.preventDefault();const input=document.getElementById('library-book-search-input'),title=input?input.value.trim():'';if(!title){showToast?.('검색할 책 제목을 입력해 주세요.','error');return;}searchLibraryBookByTitle(title);}
  function searchLibraryBookByTitle(title){const provider=currentLibraryProvider();if(!provider||typeof provider.buildSearchUrl!=='function'){showToast?.('도서관 검색 주소를 찾지 못했습니다.','error');return;}window.open(provider.buildSearchUrl(title),'_blank','noopener,noreferrer');}
  function openCurrentLibraryHome(){const provider=currentLibraryProvider();if(provider?.homeUrl)window.open(provider.homeUrl,'_blank','noopener,noreferrer');}
  function focusLibrarySearch(){const panel=document.getElementById('library-search-panel'),input=document.getElementById('library-book-search-input');panel?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>input?.focus(),350);}
  function openLibraryBookInfo(title){if(typeof openHomeBookInfo==='function')openHomeBookInfo(title);else searchLibraryBookByTitle(title);}
  function startLibraryVerification(){const user=currentUser();if(user.isGuest){openAuthPage?.('login');return;}if(!user.library||user.library==='소속도서관 없음'){openSettingsModal?.();showToast?.('설정에서 소속도서관을 먼저 선택해 주세요.');return;}user.libraryVerified=true;saveAppState?.();updateUIProfileData?.();showToast?.(`${user.library} 인증이 완료되었습니다.`);renderMyLibraryHub();renderHomeLibraryMissionPreview();}
  function toggleLibraryMissionEnrollment(){const hub=currentHub();if(!hub)return;const p=getRawMissionProgress(hub.mission);p.enrolled=true;saveMissionProgress(hub.mission,p);if(!p.selectedBook)openLibraryMissionBookPicker();else document.querySelector('.library-mission-compact')?.scrollIntoView({behavior:'smooth',block:'center'});}
  function toggleLibraryMissionStep(){showToast?.('체크박스 대신 실제 독서활동을 완료해 주세요.');}

  window.renderMyLibraryHub=renderMyLibraryHub;window.renderHomeLibraryMissionPreview=renderHomeLibraryMissionPreview;window.toggleLibraryMissionEnrollment=toggleLibraryMissionEnrollment;window.toggleLibraryMissionStep=toggleLibraryMissionStep;window.searchCurrentLibraryBook=searchCurrentLibraryBook;window.searchLibraryBookByTitle=searchLibraryBookByTitle;window.openCurrentLibraryHome=openCurrentLibraryHome;window.focusLibrarySearch=focusLibrarySearch;window.openLibraryBookInfo=openLibraryBookInfo;window.startLibraryVerification=startLibraryVerification;window.getLibraryMissionRewards=getLibraryMissionRewards;
  window.toggleLibraryMissionDetails=toggleLibraryMissionDetails;window.openLibraryMissionReflectionChoices=openLibraryMissionReflectionChoices;window.openLibraryMissionBookPicker=openLibraryMissionBookPicker;window.closeLibraryMissionModal=closeLibraryMissionModal;window.selectLibraryMissionBook=selectLibraryMissionBook;window.registerSelectedMissionBookAsRead=registerSelectedMissionBookAsRead;window.openLibraryMissionReflection=openLibraryMissionReflection;window.openLibraryMissionRecordModal=openLibraryMissionRecordModal;window.saveLibraryMissionRecord=saveLibraryMissionRecord;window.startMissionAIConversation=startMissionAIConversation;window.openMissionDiscussion=openMissionDiscussion;
})();
