// Mission Reward Book Lounge
const OFFICIAL_LOUNGE_ASSET_PATH = 'assets/images/lounge/';
const LOUNGE_PROGRESS_KEY = 'bookmate_lounge_progress_v1_9';
const LOUNGE_BOOKMATES_KEY = 'bookmate_lounge_bookmates_v1_9_2';

const OFFICIAL_LOUNGE_LABELS = {
  shelf: '책장',
  frame: '액자',
  plant: '화분',
  snack: '다과세트',
  clock: '벽시계'
};
const OFFICIAL_LOUNGE_CATS = {
  cat1: { name: '모아1', src: 'cat-white-trim.png', slot: '기본 모아' },
  cat2: { name: '모아2', src: 'cat-calico-trim.png', slot: '북메이트 보상' },
  cat3: { name: '모아3', src: 'cat-siam-trim.png', slot: '독서모임 보상' },
  cat4: { name: '모아4', src: 'cat-cheese-trim.png', slot: '실시간 참여 보상' }
};

const LOUNGE_MISSIONS = [
  { key: 'shelf', kind: 'sticker', title: '첫 완독', reward: '책장', metric: 'completedBooks', goal: 1 },
  { key: 'frame', kind: 'sticker', title: '소속도서관 인증', reward: '액자', metric: 'libraryVerified', goal: 1 },
  { key: 'clock', kind: 'sticker', title: 'AI 1:1토론 3회', reward: '시계', metric: 'aiDebates', goal: 3 },
  { key: 'plant', kind: 'sticker', title: '토론방 글 5회', reward: '화분', metric: 'discussionPosts', goal: 5 },
  { key: 'cat2', kind: 'cat', title: '북메이트 3명 달성', reward: '모아2', metric: 'bookmates', goal: 3 },
  { key: 'cat3', kind: 'cat', title: '독서모임 5개 가입', reward: '모아3', metric: 'joinedGatherings', goal: 5 },
  { key: 'snack', kind: 'sticker', title: '방명록 남기기 5회', reward: '다과세트', metric: 'guestbookWrites', goal: 5 },
  { key: 'cat4', kind: 'cat', title: '온라인 모임 실시간 10회 참여', reward: '모아4', metric: 'liveMeetings', goal: 10 }
];

const DEFAULT_BOOKMATES = [
  { name: '사유올빼미', status: 'active', since: '2026.05.13', gathering: '추리소설 읽기', avatarType: 'moa', avatarId: 2 },
  { name: '한줄수집가', status: 'active', since: '2026.05.21', gathering: '고전문학 살롱', avatarType: 'moa', avatarId: 4 },
  { name: '지혜의등대', status: 'active', since: '2026.06.01', gathering: '그림책 산책', avatarType: 'moa', avatarId: 3 },
  { name: '초록책갈피', status: 'active', since: '2026.06.09', gathering: '에세이 클럽', avatarType: 'moa', avatarId: 2 },
  { name: '문장산책자', status: 'active', since: '2026.06.14', gathering: 'SF 북토크', avatarType: 'moa', avatarId: 1 }
];
let loungeBookmates = (getManagedDataset() && Array.isArray(getManagedDataset().loungeBookmates)) ? JSON.parse(JSON.stringify(getManagedDataset().loungeBookmates)) : [];

function getDefaultLoungeProgress() {
  if (window.bookmateVisitedLoungeAuthor && typeof findAccountByNickname === 'function') {
    const visited = findAccountByNickname(window.bookmateVisitedLoungeAuthor);
    const authorPostCount = (state.socialPosts || []).filter(p => p.author === window.bookmateVisitedLoungeAuthor).length;
    if (visited) {
      return {
        completedBooks: Number(visited.readBooksCount || 0),
        libraryVerified: visited.libraryVerified ? 1 : 0,
        aiDebates: Math.max(3, Math.floor(Number(visited.chatMessagesCount || 0) / 500)),
        discussionPosts: Math.max(authorPostCount, 5),
        bookmates: Math.max(7, Math.floor(Number(visited.readBooksCount || 0) / 5)),
        joinedGatherings: Number(visited.gatheringCount || 0),
        guestbookWrites: 5,
        liveMeetings: Number(visited.gatheringCount || 0) * 2
      };
    }
  }
  const accountData = (typeof getManagedAccountById === 'function' && state.currentUser && !state.currentUser.isGuest) ? getManagedAccountById(state.currentUser.id) : (typeof getGuestModeData === 'function' ? getGuestModeData() : null);
  const managedProgress = (typeof getAccountLoungeProgress === 'function') ? getAccountLoungeProgress(accountData) : null;
  if (managedProgress) {
    return {
      completedBooks: Number(managedProgress.completedBooks || 0),
      libraryVerified: Number(managedProgress.libraryVerified || 0),
      aiDebates: Number(managedProgress.aiDebates || 0),
      discussionPosts: Number(managedProgress.discussionPosts || 0),
      bookmates: Number(managedProgress.bookmates || getActiveBookmates().length || 0),
      joinedGatherings: Number(managedProgress.joinedGatherings || 0),
      guestbookWrites: Number(managedProgress.guestbookWrites || 0),
      liveMeetings: Number(managedProgress.liveMeetings || 0)
    };
  }
  if (state.currentUser && (state.currentUser.isGuest || !isSeedAccount(state.currentUser.id))) {
    return { completedBooks: 0, libraryVerified: 0, aiDebates: 0, discussionPosts: 0, bookmates: 0, joinedGatherings: 0, guestbookWrites: 0, liveMeetings: 0 };
  }
  // 처음에는 기본 배경 + 모아1만 컬러로 보이도록 0에서 시작합니다.
  // 실제 서비스에서는 각 활동 완료 시 아래 localStorage 값 또는 서버 값을 갱신하면 자동으로 해금됩니다.
  return {
    completedBooks: Number(localStorage.getItem('bookmate_lounge_completed_books') || 0),
    libraryVerified: Number(localStorage.getItem('bookmate_lounge_library_verified') || 1),
    aiDebates: Number(localStorage.getItem('bookmate_lounge_ai_debates') || 3),
    discussionPosts: Number(localStorage.getItem('bookmate_lounge_discussion_posts') || 0),
    bookmates: getActiveBookmates().length || 0,
    joinedGatherings: Number(localStorage.getItem('bookmate_lounge_joined_gatherings') || 0),
    guestbookWrites: Number(localStorage.getItem('bookmate_lounge_guestbook_writes') || 0),
    liveMeetings: Number(localStorage.getItem('bookmate_lounge_live_meetings') || 0)
  };
}

function loadLoungeBookmates() {
  if (window.bookmateVisitedLoungeAuthor) {
    loungeBookmates = DEFAULT_BOOKMATES.slice();
    return;
  }

  // v3.7: 북라운지 북메이트도 계정별 데이터에서 가져옵니다.
  if (typeof getManagedAccountById === 'function') {
    const data = state.currentUser && state.currentUser.isGuest
      ? (typeof getGuestModeData === 'function' ? getGuestModeData() : {})
      : getManagedAccountById(state.currentUser && state.currentUser.id);
    if (data && Array.isArray(data.loungeBookmates)) {
      loungeBookmates = JSON.parse(JSON.stringify(data.loungeBookmates));
      loungeBookmates.forEach((m, idx) => { if (!m.avatarId) m.avatarId = ((idx + 1) % 4) + 1; normalizeAvatarTarget(m); });
      return;
    }
  }

  if (state.currentUser && (state.currentUser.isGuest || !isSeedAccount(state.currentUser.id))) {
    loungeBookmates = [];
    return;
  }
  try {
    const saved = localStorage.getItem(LOUNGE_BOOKMATES_KEY);
    loungeBookmates = saved ? JSON.parse(saved) : DEFAULT_BOOKMATES.slice();
    loungeBookmates.forEach((m, idx) => { if (!m.avatarId) m.avatarId = ((idx + 1) % 4) + 1; normalizeAvatarTarget(m); });
  } catch (e) {
    loungeBookmates = DEFAULT_BOOKMATES.slice();
  }
}

function saveLoungeBookmates() {
  localStorage.setItem(LOUNGE_BOOKMATES_KEY, JSON.stringify(loungeBookmates));
}

function getActiveBookmates() {
  return (loungeBookmates || []).filter(m => m.status === 'active');
}

function getLoungeProgress() {
  const base = getDefaultLoungeProgress();
  if (state.currentUser && (state.currentUser.isGuest || !isSeedAccount(state.currentUser.id))) return base;
  try {
    const saved = JSON.parse(localStorage.getItem(LOUNGE_PROGRESS_KEY) || '{}');
    return { ...base, ...saved, libraryVerified: Math.max(Number(saved.libraryVerified || 0), base.libraryVerified), aiDebates: Math.max(Number(saved.aiDebates || 0), base.aiDebates), bookmates: getActiveBookmates().length };
  } catch (e) {
    return base;
  }
}

function isMissionAcquired(mission, progress) {
  return Number(progress[mission.metric] || 0) >= mission.goal;
}

function isLoungeLayerAcquired(layerKey, isCat) {
  if (layerKey === 'background' || layerKey === 'cat1') return true;
  const progress = getLoungeProgress();
  const mission = LOUNGE_MISSIONS.find(m => m.key === layerKey && (isCat ? m.kind === 'cat' : m.kind === 'sticker'));
  return mission ? isMissionAcquired(mission, progress) : false;
}

function getOfficialLoungeLayers() {
  return [
    { key: 'background', src: 'background.png', alt: '기본 배경', always: true },
    { key: 'plant', src: 'plant.png', alt: '화분' },
    { key: 'frame', src: 'frame.png', alt: '액자' },
    { key: 'clock', src: 'clock.png', alt: '벽시계' },
    { key: 'shelf', src: 'shelf.png', alt: '서가' },
    { key: 'snack', src: 'snack.png', alt: '다과 세트' },
    ...Object.entries(OFFICIAL_LOUNGE_CATS).map(([key, cat]) => ({
      key,
      src: cat.src,
      alt: `${cat.name} ${cat.slot}`,
      isCat: true
    }))
  ];
}

function buildOfficialLoungeHTML() {
  return getOfficialLoungeLayers().filter(layer => isLoungeLayerAcquired(layer.key, !!layer.isCat)).map(layer => {
    const catClass = layer.isCat ? ` official-lounge-layer--cat official-lounge-layer--${layer.key}` : '';
    return `<img class="official-lounge-layer official-lounge-layer--${layer.key}${catClass}" src="${OFFICIAL_LOUNGE_ASSET_PATH}${layer.src}" alt="${layer.alt}">`;
  }).join('');
}

function getMissionIconHTML(mission) {
  let src = '';
  if (mission.kind === 'cat') {
    src = OFFICIAL_LOUNGE_CATS[mission.key]?.src || '';
  } else {
    const fileMap = { shelf: 'shelf.png', frame: 'frame.png', clock: 'clock.png', plant: 'plant.png', snack: 'snack.png' };
    src = fileMap[mission.key] || '';
  }
  return src ? `<img src="${OFFICIAL_LOUNGE_ASSET_PATH}${src}" alt="${mission.reward}" class="lounge-mission-img">` : '';
}

function renderLoungeMissions() {
  const container = document.getElementById('lounge-mission-list');
  if (!container) return;
  const progress = getLoungeProgress();
  container.innerHTML = LOUNGE_MISSIONS.map((mission) => {
    const acquired = isMissionAcquired(mission, progress);
    return `<div class="lounge-mission-card ${acquired ? 'acquired' : ''}">
      <div class="lounge-mission-icon">${getMissionIconHTML(mission)}</div>
      <div class="lounge-mission-reward-name">${mission.reward}</div>
      <div class="lounge-mission-title">${mission.title}</div>
      <div class="lounge-mission-state">(${acquired ? '획득' : '미획득'})</div>
    </div>`;
  }).join('');
}

function renderBookmates() {
  const list = document.getElementById('lounge-bookmates-list');
  const modalList = document.getElementById('bookmates-modal-list');
  const active = getActiveBookmates();
  if (list) {
    list.innerHTML = active.map((m, idx) => `<div class="bookmate-card">
      ${getAvatarHTML(m, 'bookmate-avatar')}
      <div class="bookmate-name">${m.name}</div>
      <div class="bookmate-since">${m.since || '2026.06.01'}부터 북메이트</div>
      <div class="bookmate-gathering">함께하는 모임 : ${m.gathering || 'BOOKMATE 독서모임'}</div>
    </div>`).join('') || '<span class="text-xs text-gray-400">아직 등록된 북메이트가 없습니다.</span>';
  }
  if (modalList) {
    modalList.innerHTML = (loungeBookmates || []).map((m, idx) => {
      const pending = m.status === 'pending';
      return `<div class="flex items-center justify-between gap-3 p-3 rounded-2xl border border-brand-ivoryDark bg-brand-ivory/40">
        <div class="flex items-center gap-3 min-w-0">
          ${getAvatarHTML(m, 'w-9 h-9')}
          <div class="min-w-0">
            <div class="text-sm font-bold text-brand-navy truncate">${m.name}</div>
            <div class="text-[10px] text-gray-500">${pending ? '초대 수락 대기' : `${m.since || '2026.06.01'}부터 북메이트 · ${m.gathering || 'BOOKMATE 독서모임'}`}</div>
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          ${pending ? `<button onclick="acceptBookmate(${idx})" class="px-3 py-1.5 rounded-lg bg-brand-sage text-white text-[10px] font-bold">수락</button>` : ''}
          <button onclick="removeBookmate(${idx})" class="px-3 py-1.5 rounded-lg bg-white border border-brand-ivoryDark text-gray-500 text-[10px] font-bold">삭제</button>
        </div>
      </div>`;
    }).join('');
  }
}

function renderOfficialLounge() {
  const html = buildOfficialLoungeHTML();
  document.querySelectorAll('#official-lounge-main, #mypage-lounge-preview').forEach(container => {
    if (container) container.innerHTML = html;
  });

  renderLoungeMissions();
  renderBookmates();

  const progress = getLoungeProgress();
  const acquiredMissions = LOUNGE_MISSIONS.filter(m => isMissionAcquired(m, progress));
  const visitingAuthor = window.bookmateVisitedLoungeAuthor || '';
  const titleEl = document.querySelector('#view-booklounge h1');
  if (titleEl) titleEl.textContent = visitingAuthor ? `${visitingAuthor}님의 북라운지` : '나의 북라운지';
  const stageText = document.getElementById('official-lounge-stage-text');
  if (stageText) stageText.textContent = visitingAuthor ? `${visitingAuthor}님의 활동으로 채워진 북라운지입니다.` : '나의 활동으로 채워지는 북라운지, 독서 인연을 늘려보세요.';

  const badge = document.getElementById('official-lounge-complete-badge');
  if (badge) badge.textContent = `북라운지 완성도 ${Math.round((acquiredMissions.length / LOUNGE_MISSIONS.length) * 100)}% · ${acquiredMissions.length}/${LOUNGE_MISSIONS.length} 아이템 획득`;

  const progressText = document.getElementById('lounge-progress-text');
  if (progressText) progressText.textContent = `북라운지 완성도 ${Math.round((acquiredMissions.length / LOUNGE_MISSIONS.length) * 100)}% · ${acquiredMissions.length}/${LOUNGE_MISSIONS.length} 아이템 획득`;

  const tags = document.getElementById('mypage-lounge-tags');
  if (tags) {
    const rewardNames = ['기본 배경', '모아1', ...acquiredMissions.map(m => m.reward)];
    tags.innerHTML = rewardNames.map(name =>
      `<span class="px-3 py-1.5 rounded-full bg-brand-ivory border border-brand-ivoryDark text-[10px] font-bold text-brand-navy">${name}</span>`
    ).join('');
  }
}

window.openBookmatesModal = function() {
  if (typeof isGuestUser === 'function' && isGuestUser()) {
    if (typeof renderGuestGate === 'function') renderGuestGate({icon:'🤝', title:'같은 책을 좋아하는 사람들과 만나보세요.', desc:'BOOKMATE가 되어 독서 친구를 만들고\n책으로 연결되어 보세요.'});
    if (typeof navigate === 'function') navigate('guest-gate');
    return;
  }
  renderBookmates();
  const modal = document.getElementById('bookmates-modal');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
};

window.closeBookmatesModal = function() {
  const modal = document.getElementById('bookmates-modal');
  if (modal) modal.classList.add('hidden');
};

window.acceptBookmate = function(index) {
  if (!loungeBookmates[index]) return;
  loungeBookmates[index].status = 'active';
  saveLoungeBookmates();
  renderOfficialLounge();
  if (typeof showToast === 'function') showToast('북메이트 초대를 수락했습니다.');
};

window.removeBookmate = function(index) {
  if (!loungeBookmates[index]) return;
  loungeBookmates.splice(index, 1);
  saveLoungeBookmates();
  renderOfficialLounge();
  if (typeof showToast === 'function') showToast('북메이트를 삭제했습니다.');
};

window.toggleOfficialSticker = function() {
  if (typeof showToast === 'function') showToast('북라운지 아이템은 활동 달성 시 자동으로 배치됩니다.');
};
window.setOfficialCat = window.toggleOfficialSticker;
window.resetOfficialLounge = function() {
  localStorage.removeItem(LOUNGE_PROGRESS_KEY);
  loungeBookmates = DEFAULT_BOOKMATES.slice();
  saveLoungeBookmates();
  renderOfficialLounge();
  if (typeof showToast === 'function') showToast('북라운지 달성 현황을 데모 기본값으로 되돌렸습니다.');
};

// 북라운지는 로그인/게스트 상태가 정해진 뒤 렌더링합니다.
setTimeout(() => { loadLoungeBookmates(); renderOfficialLounge(); }, 0);
