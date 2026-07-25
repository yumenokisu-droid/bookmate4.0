/* BOOKMATE RC18 — 고전의 향기 완전 분리, 쪽지함, 기능별 알림 */
(function(){
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const NOTE_DEMO_KEY = 'bookmate_rc18_note_demo_ready';
  let notificationFilter = 'all';
  let activeMessagePartner = '';
  let pendingMessageDraft = '';

  function currentNickname(){ return (typeof state !== 'undefined' && state.currentUser && state.currentUser.nickname) || '게스트 독자'; }
  function isGuest(){ return typeof state === 'undefined' || !state.currentUser || state.currentUser.isGuest || currentNickname()==='게스트 독자'; }
  function accountByName(name){
    try{
      const users = typeof getAuthUsers === 'function' ? getAuthUsers() : (window.DEFAULT_AUTH_USERS || []);
      return users.find(u => u.nickname===name || u.name===name) || null;
    }catch(e){ return null; }
  }
  function avatar(name, size='w-10 h-10'){
    if(typeof getAvatarByName === 'function') return getAvatarByName(name,size);
    const target=accountByName(name)||{name,avatarType:'moa',avatarId:1};
    return typeof getAvatarHTML === 'function' ? getAvatarHTML(target,size) : `<span class="${size} rounded-full bg-brand-ivory"></span>`;
  }
  function save(){ try{ if(typeof saveAppState==='function') saveAppState(); }catch(e){} }
  function toast(text,type){ if(typeof showToast==='function') showToast(text,type); }

  function patchCommunityPresets(){
    const presets=window.BOOKMATE_COMMUNITY_PRESETS||{};
    if(presets[1]) presets[1].members=[
      {name:'달빛독서가',role:'모임장',intro:'문학과 오래 남는 문장을 좋아합니다.',leaderCount:5,discussionCount:48,completedBooks:31,clubsCount:4,sharedBooks:['작별인사','노인과 바다','아몬드'],online:true,avatarType:'moa',avatarId:1},
      {name:'문장수집가',role:'부모임장',intro:'질문이 많은 독서를 좋아해요. SF와 한국문학을 즐겨 읽습니다.',leaderCount:8,discussionCount:42,completedBooks:35,clubsCount:12,sharedBooks:['작별인사','1984','어린 왕자'],online:true,avatarType:'moa',avatarId:2},
      {name:'책읽는기린',role:'회원',intro:'세계관과 인물의 선택을 따라 읽는 것을 좋아해요.',leaderCount:2,discussionCount:27,completedBooks:24,clubsCount:6,sharedBooks:['작별인사','아몬드'],online:true,avatarType:'moa',avatarId:3},
      {name:'초록책갈피',role:'회원',intro:'새로운 작가를 발견하고 함께 나누는 것을 좋아해요.',leaderCount:3,discussionCount:21,completedBooks:18,clubsCount:5,sharedBooks:['작별인사','소년이 온다'],online:false,avatarType:'moa',avatarId:4},
      {name:'지혜의등대',role:'회원',intro:'책의 시대적 배경과 오늘의 삶을 연결해 읽습니다.',leaderCount:4,discussionCount:33,completedBooks:28,clubsCount:7,sharedBooks:['작별인사','데미안'],online:true,avatarType:'moa',avatarId:4},
      {name:'밤의서재',role:'회원',intro:'밤에 읽은 문장을 천천히 기록합니다.',leaderCount:1,discussionCount:17,completedBooks:15,clubsCount:3,sharedBooks:['작별인사'],online:false,avatarType:'moa',avatarId:1}
    ];
    if(presets[2]) presets[2].members=[
      {name:'사유올빼미',role:'모임장',intro:'고전이 던지는 질문을 오늘의 삶과 연결해 읽습니다.',leaderCount:11,discussionCount:54,completedBooks:42,clubsCount:8,sharedBooks:['데미안','어린 왕자','노인과 바다'],online:true,avatarType:'moa',avatarId:2},
      {name:'지혜의등대',role:'부모임장',intro:'작품의 시대적 배경을 살피고 차분히 의견을 나눕니다.',leaderCount:7,discussionCount:38,completedBooks:31,clubsCount:7,sharedBooks:['데미안','노인과 바다'],online:true,avatarType:'moa',avatarId:4},
      {name:'달빛독서가',role:'회원',intro:'오래 남는 문장을 표시하며 천천히 고전을 읽습니다.',leaderCount:5,discussionCount:48,completedBooks:31,clubsCount:4,sharedBooks:['데미안','어린 왕자'],online:true,avatarType:'moa',avatarId:1},
      {name:'문장수집가',role:'회원',intro:'한 문장을 오래 붙들고 서로 다른 해석을 모읍니다.',leaderCount:8,discussionCount:42,completedBooks:35,clubsCount:12,sharedBooks:['데미안','1984'],online:false,avatarType:'moa',avatarId:2},
      {name:'책읽는기린',role:'회원',intro:'고전을 처음 읽는 사람의 시선으로 솔직하게 이야기합니다.',leaderCount:2,discussionCount:27,completedBooks:24,clubsCount:6,sharedBooks:['데미안'],online:true,avatarType:'moa',avatarId:3},
      {name:'초록책갈피',role:'회원',intro:'고전 속 문장을 수집하고 다음 책을 함께 고릅니다.',leaderCount:3,discussionCount:21,completedBooks:18,clubsCount:5,sharedBooks:['데미안','어린 왕자'],online:false,avatarType:'moa',avatarId:4},
      {name:'고요한책장',role:'회원',intro:'조용히 읽고 천천히 말하는 오프라인 모임을 좋아합니다.',leaderCount:1,discussionCount:16,completedBooks:19,clubsCount:3,sharedBooks:['데미안','노인과 바다'],online:false,avatarType:'moa',avatarId:1}
    ];
  }

  function normalizeMessagesAndNotifications(){
    if(typeof state === 'undefined') return;
    const me=currentNickname();
    state.notifications=(state.notifications||[])
      .filter(n=>n && n.type!=='hello')
      .map(n=>({...n,type:n.type==='message'?'note':n.type}));
    state.directMessages=Array.isArray(state.directMessages)?state.directMessages:[];
    const demos=[
      {id:1801,partner:'문장수집가',sender:'문장수집가',recipient:me,text:'오늘 LIVE 전에 나누고 싶은 문장을 보냈어요. 마지막 장면에서 골라봤어요.',time:'18분 전',createdAt:'2026-07-21T21:42:00',read:false},
      {id:1802,partner:'문장수집가',sender:me,recipient:'문장수집가',text:'좋아요. 저도 인상 깊은 장면을 하나 준비해둘게요.',time:'어제',createdAt:'2026-07-20T20:10:00',read:true},
      {id:1803,partner:'사유올빼미',sender:'사유올빼미',recipient:me,text:'고전의 향기에서 나눈 데미안 이야기가 오래 남았어요.',time:'2시간 전',createdAt:'2026-07-21T20:00:00',read:false},
      {id:1804,partner:'책읽는기린',sender:me,recipient:'책읽는기린',text:'다음 우리의 문학 모임에서도 같이 이야기해요.',time:'3일 전',createdAt:'2026-07-18T17:00:00',read:true}
    ];
    demos.forEach(msg=>{ if(!state.directMessages.some(x=>Number(x.id)===Number(msg.id))) state.directMessages.push(msg); });
    const noteAlerts=[
      {id:90,type:'note',from:'문장수집가',avatarId:2,message:'오늘 LIVE 전에 나누고 싶은 문장을 보냈어요.',time:'18분 전',isRead:false},
      {id:92,type:'note',from:'사유올빼미',avatarId:2,message:'고전의 향기에서 나눈 데미안 이야기가 오래 남았어요.',time:'2시간 전',isRead:false}
    ];
    noteAlerts.forEach(n=>{ const found=state.notifications.find(x=>Number(x.id)===Number(n.id)); if(found) Object.assign(found,n); else state.notifications.push(n); });
    const gb=state.notifications.find(n=>Number(n.id)===91);
    if(gb) Object.assign(gb,{type:'guestbook',from:'책읽는기린',avatarId:3,message:'다음 책도 함께 읽고 싶어요. 방명록에 글을 남겼습니다.'});
    try{ localStorage.setItem(NOTE_DEMO_KEY,'1'); }catch(e){}
    save();
  }

  function messageCategory(n){
    if(['meeting','invite_rx','invite_tx'].includes(n?.type)) return 'gathering';
    if(['note','message'].includes(n?.type)) return 'note';
    if(['guestbook','lounge_visit'].includes(n?.type)) return 'lounge';
    return 'gathering';
  }
  function categoryLabel(category){ return category==='note'?'쪽지':category==='lounge'?'북라운지':'독서모임'; }
  function presentation(n){
    const type=n?.type||'note';
    const person=n?.from||n?.to||n?.leaderNickname||'북메이트';
    if(type==='meeting') return {type,person,headline:`오늘 ${n.timeLabel||n.time||'예정'} · ${n.gathering||n.title||'독서모임'}이 있어요.`,detail:n.detail||'',actionLabel:'모임 확인'};
    if(type==='note'||type==='message') return {type:'note',person,headline:`${person}님이 쪽지를 보냈어요.`,detail:n.message||'',actionLabel:'확인하고 답장'};
    if(type==='guestbook') return {type,person,headline:`${person}님이 북라운지 방명록을 남겼어요.`,detail:n.message||'',actionLabel:'방명록 보기'};
    if(type==='lounge_visit') return {type,person,headline:`${person}님이 북라운지를 방문했어요.`,detail:n.message||'',actionLabel:'북라운지 보기'};
    if(type==='invite_rx') return {type,person,headline:`${person}님이 ‘${n.gathering||'독서모임'}’에 초대했어요.`,detail:n.message||'',actionLabel:'초대 확인'};
    if(type==='invite_tx') return {type,person:n.to||person,headline:`${n.to||'북메이트'}님에게 모임 초대를 보냈어요.`,detail:n.gathering||n.status||'',actionLabel:'상태 보기'};
    return {type,person,headline:'새로운 알림이 있어요.',detail:n.message||n.detail||'',actionLabel:'알림 보기'};
  }
  window.getNotificationPresentation=presentation;

  function markRead(id){
    const item=(state.notifications||[]).find(n=>String(n.id)===String(id));
    if(item) item.isRead=true;
    save();
  }

  function notificationAction(n,view){
    if(n.type==='meeting') return `<button onclick="enterMeetingRoom(${JSON.stringify(n.book||'')},${JSON.stringify(n.groupId||null)})" class="notification-action-btn primary">모임 확인</button>`;
    if(n.type==='note'||n.type==='message') return `<button onclick="openDirectMessage('${esc(view.person)}',{notificationId:'${esc(n.id)}'})" class="notification-action-btn primary">확인하고 답장</button>`;
    if(n.type==='guestbook') return `<button onclick="markBookmateNotificationRead('${esc(n.id)}');document.getElementById('guestbook-modal').classList.remove('hidden')" class="notification-action-btn">방명록 보기</button>`;
    if(n.type==='lounge_visit') return `<button onclick="markBookmateNotificationRead('${esc(n.id)}');navigate('booklounge')" class="notification-action-btn">북라운지 보기</button>`;
    if(n.type==='invite_rx') return `<div class="notification-actions"><button onclick="handleNotiAction(${Number(n.id)},'accept')" class="notification-action-btn primary">수락</button><button onclick="handleNotiAction(${Number(n.id)},'decline')" class="notification-action-btn">거절</button></div>`;
    return '';
  }
  window.markBookmateNotificationRead=function(id){markRead(id); renderNotificationsView(); renderMyPageNotifications();};

  function buildMeetingNotifications(){
    if(typeof getTodayJoinedGatherings!=='function') return [];
    return getTodayJoinedGatherings().map((g,index)=>({id:`meeting-page-${g.id||index}`,type:'meeting',from:g.leaderNickname||'달빛독서가',gathering:g.title,timeLabel:typeof getGatheringScheduleTime==='function'?(getGatheringScheduleTime(g.schedule)||'예정'):'예정',detail:`『${g.book||'주제도서'}』 · ${g.method||'독서모임'} · 참여 예정 ${Number(g.membersCount||0)}명`,time:'오늘',groupId:g.id,book:g.book,isRead:false}));
  }

  function renderFilterBar(){
    const section=document.getElementById('view-notifications');
    const old=section?.querySelector('.lg\\:col-span-2 > .p-4.border-b') || section?.querySelector('.lg\\:col-span-2 .p-4.border-b');
    if(!old) return;
    old.className='notification-filter-bar';
    old.innerHTML=['all','gathering','note','lounge'].map(key=>`<button class="notification-filter-btn ${notificationFilter===key?'is-active':''}" onclick="setBookmateNotificationFilter('${key}')">${key==='all'?'전체':categoryLabel(key)}</button>`).join('')+`<button class="notification-inbox-btn" onclick="openDirectMessageInbox()">✉ 쪽지함</button>`;
  }
  window.setBookmateNotificationFilter=function(value){notificationFilter=value||'all';renderNotificationsView();};

  window.renderNotificationsView=function(){
    const section=document.getElementById('view-notifications');
    const list=section?.querySelector('.divide-y.divide-brand-ivoryDark');
    if(!list) return;
    renderFilterBar();
    if(isGuest()){
      list.innerHTML=`<div class="notification-empty"><b class="serif-title text-lg text-brand-navy">가입하면 나의 알림과 쪽지를 확인할 수 있어요.</b><p class="mt-2">독서모임·쪽지·북라운지 소식을 기능별로 모아볼 수 있습니다.</p><button onclick="openAuthPage('login')" class="mt-5 px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold">로그인 / 가입하기</button></div>`;
      return;
    }
    const items=buildMeetingNotifications().concat(state.notifications||[]).filter(n=>notificationFilter==='all'||messageCategory(n)===notificationFilter);
    if(!items.length){list.innerHTML=`<div class="notification-empty">이 분류에 표시할 알림이 없습니다.</div>`;return;}
    list.innerHTML=items.map(n=>{
      const view=presentation(n),cat=messageCategory(n);
      return `<article class="notification-page-item ${n.isRead?'is-read':''}"><div class="notification-page-avatar">${avatar(view.person,'w-12 h-12')}</div><div class="notification-page-copy"><span class="notification-category-label notification-category-${cat}">${categoryLabel(cat)}</span><div class="notification-page-head"><h3>${esc(view.headline)}</h3><time>${esc(n.time||'')}</time></div>${view.detail?`<p>${esc(view.detail)}</p>`:''}${notificationAction(n,view)}</div>${n.isRead?'':'<i class="notification-page-unread"></i>'}</article>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
  };

  window.renderMyPageNotifications=function(){
    const container=document.getElementById('mypage-notifications-list');
    if(!container) return;
    const items=(state.notifications||[]).slice(0,7);
    const unread=items.filter(n=>!n.isRead).length+(typeof getTodayJoinedGatherings==='function'?getTodayJoinedGatherings().length:0);
    const badge=document.getElementById('notification-badge-count'); if(badge){badge.textContent=unread;badge.style.display=unread?'flex':'none';}
    if(!items.length){container.innerHTML='<div class="text-xs text-gray-400 text-center py-4">새로운 알림이 없습니다.</div>';return;}
    container.innerHTML=items.map(n=>{
      const view=presentation(n),cat=messageCategory(n);
      let action='';
      if(cat==='note') action=`<button class="primary" onclick="openDirectMessage('${esc(view.person)}',{notificationId:'${esc(n.id)}'})">답장</button>`;
      else if(n.type==='guestbook') action=`<button onclick="markBookmateNotificationRead('${esc(n.id)}');document.getElementById('guestbook-modal').classList.remove('hidden')">방명록</button>`;
      else if(n.type==='invite_rx') action=`<button class="primary" onclick="handleNotiAction(${Number(n.id)},'accept')">수락</button><button onclick="handleNotiAction(${Number(n.id)},'decline')">거절</button>`;
      return `<article class="p-3 rounded-xl border border-brand-ivoryDark bg-brand-ivory/30 ${n.isRead?'opacity-60':''}"><div class="flex gap-3"><div class="relative shrink-0">${avatar(view.person,'w-9 h-9')}${n.isRead?'':'<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>'}</div><div class="flex-grow min-w-0"><span class="mypage-notification-label notification-category-${cat}">${categoryLabel(cat)}</span><div class="flex justify-between gap-2"><b class="text-[10px] text-brand-navy">${esc(view.headline)}</b><time class="text-[9px] text-gray-400 shrink-0">${esc(n.time||'')}</time></div>${view.detail?`<p class="text-[11px] text-gray-600 mt-1 leading-snug">${esc(view.detail)}</p>`:''}${action?`<div class="mypage-notification-actions">${action}</div>`:''}</div></div></article>`;
    }).join('');
  };

  window.handleNotiAction=function(id,actionType){
    const n=(state.notifications||[]).find(item=>Number(item.id)===Number(id)); if(n)n.isRead=true;
    if(actionType==='reply'&&n) openDirectMessage(n.from,{notificationId:id});
    else if(actionType==='accept') toast('독서모임 초대를 수락했습니다.');
    else if(actionType==='decline') toast('독서모임 초대를 거절했습니다.');
    save();renderMyPageNotifications();renderNotificationsView();
  };

  function ensureMessageModal(){
    if(document.getElementById('direct-message-modal')) return;
    document.body.insertAdjacentHTML('beforeend',`<div id="direct-message-modal" class="direct-message-modal hidden" onclick="if(event.target===this) closeDirectMessage()"><section id="direct-message-shell" class="direct-message-shell"><aside class="direct-message-sidebar"><div class="direct-message-sidebar-head"><b class="serif-title text-lg text-brand-navy">쪽지함</b><p>북메이트와 주고받은 짧은 메시지</p></div><div id="direct-message-thread-list" class="direct-message-thread-list"></div></aside><main class="direct-message-main"><header class="direct-message-head"><button class="direct-message-mobile-back" onclick="showDirectMessageThreadList()">←</button><div id="direct-message-head-avatar"></div><div class="copy"><b id="direct-message-head-name">쪽지를 보낼 북메이트를 선택하세요</b><small id="direct-message-head-context">독서모임과 토론방에서 바로 쪽지를 보낼 수 있어요.</small></div><button class="direct-message-close" onclick="closeDirectMessage()">✕</button></header><div id="direct-message-conversation" class="direct-message-conversation"></div><footer class="direct-message-composer"><textarea id="direct-message-input" maxlength="500" placeholder="부담 없이 짧은 쪽지를 남겨보세요."></textarea><div class="direct-message-composer-bottom"><small>500자 이내 · 상대방의 알림에 표시됩니다.</small><button id="direct-message-send-btn" class="direct-message-send" onclick="sendDirectMessage()">쪽지 보내기</button></div></footer></main></section></div>`);
    document.getElementById('direct-message-input')?.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();sendDirectMessage();}});
  }

  function getMessages(){ return (state.directMessages||[]).slice().sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))); }
  function partners(){
    const map=new Map();
    getMessages().forEach(m=>{const name=m.partner||(m.sender===currentNickname()?m.recipient:m.sender);if(name)map.set(name,true);});
    try{(typeof getActiveBookmates==='function'?getActiveBookmates():[]).forEach(m=>map.set(m.name,true));}catch(e){}
    return [...map.keys()].filter(name=>name&&name!==currentNickname());
  }
  function messagesWith(name){ return getMessages().filter(m=>(m.partner||(m.sender===currentNickname()?m.recipient:m.sender))===name); }
  function lastMessage(name){const list=messagesWith(name);return list[list.length-1]||null;}
  function unreadCount(name){return messagesWith(name).filter(m=>m.sender===name&&!m.read).length;}

  function renderMessageThreads(){
    const list=document.getElementById('direct-message-thread-list');if(!list)return;
    const names=partners();
    if(!names.length){list.innerHTML='<div class="direct-message-empty"><span>✉</span>아직 주고받은 쪽지가 없습니다.</div>';return;}
    names.sort((a,b)=>String(lastMessage(b)?.createdAt||'').localeCompare(String(lastMessage(a)?.createdAt||'')));
    list.innerHTML=names.map(name=>{const last=lastMessage(name),unread=unreadCount(name);return `<button class="direct-message-thread ${activeMessagePartner===name?'is-active':''}" onclick="selectDirectMessagePartner('${esc(name)}')">${avatar(name,'w-9 h-9')}<span class="direct-message-thread-copy"><b>${esc(name)}</b><span>${esc(last?.text||'새 쪽지를 보내보세요.')}</span></span>${unread?'<i class="direct-message-unread"></i>':`<time>${esc(last?.time||'')}</time>`}</button>`;}).join('');
  }
  function renderConversation(){
    const box=document.getElementById('direct-message-conversation');
    const nameEl=document.getElementById('direct-message-head-name');
    const ctx=document.getElementById('direct-message-head-context');
    const av=document.getElementById('direct-message-head-avatar');
    const input=document.getElementById('direct-message-input');
    const send=document.getElementById('direct-message-send-btn');
    if(!box)return;
    if(!activeMessagePartner){nameEl.textContent='쪽지를 보낼 북메이트를 선택하세요';ctx.textContent='독서모임과 토론방에서 바로 쪽지를 보낼 수 있어요.';av.innerHTML='';box.innerHTML='<div class="direct-message-empty"><span>✉</span>왼쪽 목록에서 북메이트를 선택하세요.</div>';if(send)send.disabled=true;return;}
    nameEl.textContent=activeMessagePartner;ctx.textContent='쪽지는 상대방의 알림에서 확인하고 답장할 수 있어요.';av.innerHTML=avatar(activeMessagePartner,'w-10 h-10');if(send)send.disabled=false;
    const items=messagesWith(activeMessagePartner);items.forEach(m=>{if(m.sender===activeMessagePartner)m.read=true;});
    box.innerHTML=items.length?items.map(m=>{const mine=m.sender===currentNickname();return `<div class="direct-message-bubble-row ${mine?'is-me':''}">${mine?'':avatar(activeMessagePartner,'w-7 h-7')}<div class="direct-message-bubble">${esc(m.text)}</div><time>${esc(m.time||'')}</time></div>`;}).join(''):'<div class="direct-message-empty"><span>✉</span>아직 주고받은 쪽지가 없습니다.<br>첫 쪽지를 보내보세요.</div>';
    if(input&&pendingMessageDraft){input.value=pendingMessageDraft;pendingMessageDraft='';}
    markNoteNotifications(activeMessagePartner);save();setTimeout(()=>{box.scrollTop=box.scrollHeight;},0);
  }
  function markNoteNotifications(name){(state.notifications||[]).forEach(n=>{if(['note','message'].includes(n.type)&&n.from===name)n.isRead=true;});}
  function renderMessageModal(){renderMessageThreads();renderConversation();renderMyPageNotifications();}

  window.openDirectMessage=function(name,options={}){
    if(isGuest()){if(typeof showGuestJoinPrompt==='function')showGuestJoinPrompt('social');else toast('로그인 후 쪽지를 보낼 수 있어요.');return;}
    ensureMessageModal();activeMessagePartner=name||activeMessagePartner||partners()[0]||'';pendingMessageDraft=options.prefill||pendingMessageDraft;
    if(options.notificationId)markRead(options.notificationId);
    const modal=document.getElementById('direct-message-modal');modal.classList.remove('hidden');
    document.getElementById('direct-message-shell')?.classList.remove('show-list');renderMessageModal();
    setTimeout(()=>document.getElementById('direct-message-input')?.focus(),80);
  };
  window.openDirectMessageInbox=function(){if(isGuest()){toast('로그인 후 쪽지함을 이용할 수 있어요.');return;}ensureMessageModal();activeMessagePartner=activeMessagePartner||partners()[0]||'';document.getElementById('direct-message-modal').classList.remove('hidden');document.getElementById('direct-message-shell')?.classList.add('show-list');renderMessageModal();};
  window.selectDirectMessagePartner=function(name){activeMessagePartner=name;document.getElementById('direct-message-shell')?.classList.remove('show-list');renderMessageModal();};
  window.showDirectMessageThreadList=function(){document.getElementById('direct-message-shell')?.classList.add('show-list');renderMessageThreads();};
  window.closeDirectMessage=function(){document.getElementById('direct-message-modal')?.classList.add('hidden');};
  window.sendDirectMessage=function(){
    const input=document.getElementById('direct-message-input');const text=(input?.value||'').trim();if(!activeMessagePartner)return toast('쪽지를 보낼 북메이트를 선택해주세요.');if(!text)return toast('쪽지 내용을 입력해주세요.');
    const now=new Date();state.directMessages=state.directMessages||[];state.directMessages.push({id:Date.now(),partner:activeMessagePartner,sender:currentNickname(),recipient:activeMessagePartner,text,time:'방금 전',createdAt:now.toISOString(),read:true});
    if(state.currentUser)state.currentUser.chatMessagesCount=Number(state.currentUser.chatMessagesCount||0)+1;if(input)input.value='';save();renderMessageModal();toast(`${activeMessagePartner}님에게 쪽지를 보냈어요.`);
  };

  window.shareAIConversationAsNote=function(){const text=document.getElementById('ai-share-modal-content')?.value||'';if(typeof closeAIShareModal==='function')closeAIShareModal();pendingMessageDraft=text;openDirectMessageInbox();};

  window.renderBookmates=function(){
    const list=document.getElementById('mypage-bookmates-list');const modalList=document.getElementById('bookmates-modal-list');
    const active=typeof getActiveBookmates==='function'?getActiveBookmates():[];
    const row=m=>`<article class="mypage-bookmate-row-v2">${typeof getAvatarHTML==='function'?getAvatarHTML(m,'w-10 h-10'):avatar(m.name,'w-10 h-10')}<span class="copy"><b>${esc(m.name)}</b><small>${esc(m.gathering||'BOOKMATE 독서모임')}</small></span><button class="bookmate-note-btn" onclick="openDirectMessage('${esc(m.name)}',{source:'mypage'})">✉ 쪽지</button></article>`;
    if(list)list.innerHTML=active.slice(0,3).map(row).join('')||'<p class="timeline-empty">아직 연결된 북메이트가 없습니다.</p>';
    if(modalList){const all=(typeof loungeBookmates!=='undefined'?loungeBookmates:[])||[];modalList.innerHTML=all.map((m,idx)=>`<article class="mypage-bookmate-row-v2">${typeof getAvatarHTML==='function'?getAvatarHTML(m,'w-10 h-10'):avatar(m.name,'w-10 h-10')}<span class="copy"><b>${esc(m.name)}</b><small>${m.status==='pending'?'초대 수락 대기':`${esc(m.since||'2026.06.01')}부터 북메이트 · ${esc(m.gathering||'BOOKMATE 독서모임')}`}</small></span><span class="flex gap-1">${m.status==='pending'?`<button class="bookmate-note-btn" onclick="acceptBookmate(${idx})">수락</button>`:`<button class="bookmate-note-btn" onclick="openDirectMessage('${esc(m.name)}',{source:'mypage'})">✉ 쪽지</button>`}<button class="bookmate-note-btn" onclick="removeBookmate(${idx})">삭제</button></span></article>`).join('');}
    if(window.lucide)lucide.createIcons();
  };


  function installLoginHook(){
    if(typeof window.applyLoggedInUser!=='function'||window.applyLoggedInUser.__rc18Wrapped)return;
    const original=window.applyLoggedInUser;
    const wrapped=function(){const result=original.apply(this,arguments);setTimeout(()=>{normalizeMessagesAndNotifications();renderBookmates();renderMyPageNotifications();try{if(typeof renderHomeConnectedData==='function')renderHomeConnectedData();}catch(e){}},30);return result;};
    wrapped.__rc18Wrapped=true;window.applyLoggedInUser=wrapped;
  }

  function removeGreetingCopy(){
    document.querySelectorAll('button,li,p,span').forEach(el=>{
      if(el.children.length===0&&el.textContent.trim()==='인사하기')el.textContent='쪽지 보내기';
    });
  }
  function boot(){
    patchCommunityPresets();installLoginHook();normalizeMessagesAndNotifications();ensureMessageModal();removeGreetingCopy();renderBookmates();renderMyPageNotifications();try{if(typeof renderHomeConnectedData==='function')renderHomeConnectedData();}catch(e){}
    if(state.currentView==='notifications')renderNotificationsView();
    if(window.lucide)lucide.createIcons();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
  window.addEventListener('load',()=>setTimeout(boot,100),{once:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDirectMessage();});
  window.syncBookmateRC18=boot;
})();
