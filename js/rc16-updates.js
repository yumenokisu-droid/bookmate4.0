/* BOOKMATE RC16 — 내 서재·북라운지·회원정보 정리 */
(function () {
  'use strict';

  const PROFILE_OVERRIDES_KEY = 'bookmate_rc16_profile_overrides';
  const seedIdentity = {
    book01: { birth: '1992.05.14', phone: '010-4821-7303', identityVerified: true },
    book02: { birth: '1990.11.03', phone: '010-5930-2184', identityVerified: true },
    book03: { birth: '1995.02.21', phone: '010-3715-9062', identityVerified: true },
    book04: { birth: '1988.08.17', phone: '010-8240-1159', identityVerified: true }
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function readOverrides() {
    try { return JSON.parse(localStorage.getItem(PROFILE_OVERRIDES_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function getOverride(id) { return readOverrides()[id] || {}; }
  function saveOverride(id, patch) {
    if (!id || id === 'guest') return;
    const all = readOverrides();
    all[id] = { ...(all[id] || {}), ...patch };
    localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(all));
  }

  function defaultIdentity(user) {
    const preset = seedIdentity[user?.id] || {};
    const birth = user?.birth || preset.birth || '';
    const phone = user?.phone || preset.phone || '';
    return {
      birth,
      phone,
      identityVerified: user?.identityVerified !== undefined ? !!user.identityVerified : !!(birth && phone)
    };
  }

  function applyStoredOverride(user) {
    if (!user || user.isGuest) return user;
    const patch = { ...defaultIdentity(user), ...getOverride(user.id) };
    Object.assign(user, patch);
    return user;
  }

  // 로그인 목록에도 회원정보 변경값(비밀번호 포함)을 다시 적용합니다.
  if (typeof window.getAuthUsers === 'function') {
    const originalGetAuthUsers = window.getAuthUsers;
    window.getAuthUsers = function () {
      return originalGetAuthUsers().map(user => ({ ...user, ...getOverride(user.id) }));
    };
  }

  // 로그인 시 회원정보 변경값을 다시 적용합니다.
  if (typeof window.authUserToCurrentUser === 'function') {
    const originalAuthUserToCurrentUser = window.authUserToCurrentUser;
    window.authUserToCurrentUser = function (user) {
      const base = originalAuthUserToCurrentUser(user);
      return applyStoredOverride(base);
    };
  }
  if (typeof state !== 'undefined' && state.currentUser) applyStoredOverride(state.currentUser);

  /* ---------- Settings / member information ---------- */
  let activeSettingsPanel = 'profile';
  let memberLibraryVerifiedInModal = false;

  window.switchSettingsPanel = function (panel) {
    activeSettingsPanel = panel === 'account' ? 'account' : 'profile';
    document.getElementById('settings-profile-panel')?.classList.toggle('hidden', activeSettingsPanel !== 'profile');
    document.getElementById('settings-account-panel')?.classList.toggle('hidden', activeSettingsPanel !== 'account');
    document.getElementById('settings-profile-tab')?.classList.toggle('is-active', activeSettingsPanel === 'profile');
    document.getElementById('settings-account-tab')?.classList.toggle('is-active', activeSettingsPanel === 'account');
    if (window.lucide) lucide.createIcons();
  };

  function fillMemberSettings() {
    const user = applyStoredOverride(state.currentUser || {});
    const identity = defaultIdentity(user);
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ''; };
    set('member-id', user.id || '');
    set('member-name', user.name || '');
    set('member-birth', identity.birth || '');
    set('member-phone', identity.phone || '');
    set('member-gender', user.gender || '선택 안 함');
    set('settings-library', user.library || '소속도서관 없음');
    set('member-new-password', '');
    set('member-new-password-confirm', '');
    document.querySelectorAll('input[name="member-taste"]').forEach(input => {
      input.checked = Array.isArray(user.tastes) && user.tastes.includes(input.value);
    });
    const status = document.getElementById('member-identity-status');
    if (status) {
      status.classList.toggle('is-unverified', !identity.identityVerified);
      status.innerHTML = identity.identityVerified
        ? '<i data-lucide="badge-check"></i><div><b>휴대전화 본인인증 완료</b><p>이름·생년월일·휴대전화 번호는 안전을 위해 수정할 수 없습니다.</p></div>'
        : '<i data-lucide="shield-alert"></i><div><b>본인인증 정보 없음</b><p>기존 시연 계정은 데모 정보로 표시되며, 신규 회원은 가입 단계에서 인증합니다.</p></div>';
    }
    memberLibraryVerifiedInModal = !!user.libraryVerified;
  }

  window.openSettingsModal = function (panel) {
    if (!state.currentUser || state.currentUser.isGuest) {
      if (typeof openAuthPage === 'function') openAuthPage('login');
      return;
    }
    applyStoredOverride(state.currentUser);
    const nick = document.getElementById('settings-nickname');
    if (nick) nick.value = state.currentUser.nickname || '';
    const radioValue = state.currentUser.avatarType === 'upload' && state.currentUser.avatarImage ? 'upload' : `moa-${state.currentUser.avatarId || 1}`;
    const radio = document.querySelector(`input[name="settings-avatar-type"][value="${radioValue}"]`);
    if (radio) radio.checked = true;
    const fileName = document.getElementById('settings-avatar-file-name');
    if (fileName) fileName.textContent = state.currentUser.avatarType === 'upload' ? '첨부한 사진 사용 중' : '선택된 파일 없음';
    fillMemberSettings();
    if (typeof renderSettingsAvatarPreview === 'function') renderSettingsAvatarPreview();
    switchSettingsPanel(panel || 'profile');
    document.getElementById('settings-modal')?.classList.remove('hidden');
  };

  window.memberLibraryChanged = function () {
    const selected = document.getElementById('settings-library')?.value || '소속도서관 없음';
    memberLibraryVerifiedInModal = selected === (state.currentUser.library || '소속도서관 없음') ? !!state.currentUser.libraryVerified : false;
  };

  window.verifyMemberLibrary = function () {
    const selected = document.getElementById('settings-library')?.value || '소속도서관 없음';
    if (selected === '소속도서관 없음') {
      memberLibraryVerifiedInModal = false;
      if (typeof showToast === 'function') showToast('인증할 소속도서관을 선택해 주세요.', 'error');
      return;
    }
    memberLibraryVerifiedInModal = true;
    if (typeof showToast === 'function') showToast(`${selected} 인증이 완료되었습니다.`);
  };

  function persistCurrentUser(patch) {
    Object.assign(state.currentUser, patch);
    saveOverride(state.currentUser.id, patch);
    if (typeof saveAppState === 'function') saveAppState();
    if (typeof updateUIProfileData === 'function') updateUIProfileData();
  }

  window.saveProfileSettings = function () {
    const nick = document.getElementById('settings-nickname')?.value.trim() || '';
    if (!nick) { showToast('대화명을 입력해 주세요.', 'error'); return false; }
    if (nick.length > 6) { showToast('대화명은 최대 6자까지 가능합니다.', 'error'); return false; }
    const selected = document.querySelector('input[name="settings-avatar-type"]:checked')?.value || 'moa-1';
    const patch = { nickname: nick };
    if (selected.startsWith('moa-')) {
      patch.avatarType = 'moa';
      patch.avatarId = Number(selected.replace('moa-', '')) || 1;
      patch.avatarImage = '';
    } else if (state.currentUser.avatarImage) {
      patch.avatarType = 'upload';
    }
    persistCurrentUser(patch);
    if (typeof renderBookmates === 'function') renderBookmates();
    showToast('프로필 설정을 저장했습니다.');
    return true;
  };

  window.saveMemberInformation = function () {
    const newPassword = document.getElementById('member-new-password')?.value || '';
    const confirm = document.getElementById('member-new-password-confirm')?.value || '';
    if (newPassword && newPassword.length < 4) { showToast('새 비밀번호는 4자 이상 입력해 주세요.', 'error'); return false; }
    if (newPassword !== confirm) { showToast('새 비밀번호 확인이 일치하지 않습니다.', 'error'); return false; }
    const oldLibrary = state.currentUser.library || '소속도서관 없음';
    const library = document.getElementById('settings-library')?.value || oldLibrary;
    const tastes = Array.from(document.querySelectorAll('input[name="member-taste"]:checked')).map(el => el.value);
    if (!tastes.length) { showToast('독서취향을 1개 이상 선택해 주세요.', 'error'); return false; }
    const patch = {
      gender: document.getElementById('member-gender')?.value || '선택 안 함',
      library,
      libraryVerified: library === oldLibrary ? !!state.currentUser.libraryVerified : !!memberLibraryVerifiedInModal,
      tastes
    };
    if (newPassword) patch.password = newPassword;
    persistCurrentUser(patch);
    showToast('회원정보 변경사항을 저장했습니다.');
    return true;
  };

  window.saveSettingsCurrentPanel = function () {
    const ok = activeSettingsPanel === 'account' ? saveMemberInformation() : saveProfileSettings();
    if (ok !== false && typeof closeSettingsModal === 'function') closeSettingsModal();
  };

  /* ---------- Signup identity demo ---------- */
  function normalizeBirth(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length !== 8) return '';
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
  }
  function validBirth(value) {
    const normalized = normalizeBirth(value);
    if (!normalized) return false;
    const [y,m,d] = normalized.split('.').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && y >= 1900 && y <= new Date().getFullYear();
  }
  function calculateAge(birth) {
    const [y,m,d] = normalizeBirth(birth).split('.').map(Number);
    const today = new Date();
    let age = today.getFullYear() - y;
    if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
    return age;
  }
  function validPhone(value) { return /^01[016789]-?\d{3,4}-?\d{4}$/.test(String(value || '').trim()); }
  function formatPhone(value) {
    const d = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3, d.length-4)}-${d.slice(-4)}`;
  }

  window.sendSignupIdentityCode = function () {
    const name = document.getElementById('signup-name')?.value.trim();
    const birthInput = document.getElementById('signup-birth');
    const phoneInput = document.getElementById('signup-phone');
    if (!name) { showToast('이름을 입력해 주세요.', 'error'); return; }
    if (!validBirth(birthInput?.value)) { showToast('생년월일을 8자리로 정확히 입력해 주세요.', 'error'); return; }
    if (!validPhone(phoneInput?.value)) { showToast('휴대전화 번호를 정확히 입력해 주세요.', 'error'); return; }
    birthInput.value = normalizeBirth(birthInput.value);
    phoneInput.value = formatPhone(phoneInput.value);
    document.getElementById('signup-code-row')?.classList.remove('hidden');
    const badge = document.getElementById('signup-identity-badge');
    if (badge) { badge.textContent = '인증번호 발송'; badge.classList.add('is-pending'); }
    showToast('시연용 인증번호를 발송했습니다. 123456을 입력해 주세요.');
  };

  window.verifySignupIdentityCode = function () {
    const code = document.getElementById('signup-identity-code')?.value.trim();
    if (code !== '123456') { showToast('인증번호가 일치하지 않습니다.', 'error'); return; }
    document.getElementById('signup-identity-verified').value = 'true';
    ['signup-name','signup-birth','signup-phone'].forEach(id => { const el = document.getElementById(id); if (el) el.readOnly = true; });
    const badge = document.getElementById('signup-identity-badge');
    if (badge) { badge.textContent = '본인인증 완료'; badge.className = 'is-verified'; }
    document.getElementById('signup-code-row')?.classList.add('verified');
    showToast('휴대전화 본인인증이 완료되었습니다.');
  };

  window.handleSignupSubmit = function (event) {
    event.preventDefault();
    const users = typeof getAuthUsers === 'function' ? getAuthUsers() : [];
    const id = document.getElementById('signup-id')?.value.trim();
    const password = document.getElementById('signup-password')?.value || '';
    const confirm = document.getElementById('signup-password-confirm')?.value || '';
    const name = document.getElementById('signup-name')?.value.trim();
    const birth = normalizeBirth(document.getElementById('signup-birth')?.value || '');
    const phone = formatPhone(document.getElementById('signup-phone')?.value || '');
    const gender = document.getElementById('signup-gender')?.value;
    const nickname = document.getElementById('signup-nickname')?.value.trim();
    const library = document.getElementById('signup-library')?.value;
    const identityVerified = document.getElementById('signup-identity-verified')?.value === 'true';
    const libraryVerified = library === '소속도서관 없음' || document.getElementById('signup-library-verified')?.dataset.verified === 'true';
    const tastes = Array.from(document.querySelectorAll('input[name="signup-taste"]:checked')).map(el => el.value);
    const readingType = document.getElementById('signup-reading-type')?.value || '';
    const readingTypeIcon = document.getElementById('signup-reading-type-icon')?.value || '';

    if (!id || id.length < 4) { showToast('아이디는 4자 이상 입력해 주세요.', 'error'); return; }
    if (users.some(u => u.id === id)) { showToast('이미 사용 중인 아이디입니다.', 'error'); return; }
    if (password.length < 4) { showToast('비밀번호는 4자 이상 입력해 주세요.', 'error'); return; }
    if (password !== confirm) { showToast('비밀번호 확인이 일치하지 않습니다.', 'error'); return; }
    if (!name || !nickname || !gender || !validBirth(birth) || !validPhone(phone)) { showToast('회원정보를 모두 정확히 입력해 주세요.', 'error'); return; }
    if (!identityVerified) { showToast('휴대전화 본인인증을 먼저 완료해 주세요.', 'error'); return; }
    if (!libraryVerified) { showToast('소속도서관 인증을 먼저 완료해 주세요.', 'error'); return; }
    if (!tastes.length) { showToast('독서취향을 1개 이상 선택해 주세요.', 'error'); return; }
    if (users.some(u => String(u.phone || '').replace(/\D/g,'') === phone.replace(/\D/g,''))) { showToast('이미 인증된 휴대전화 번호입니다.', 'error'); return; }

    const user = {
      id, password, name, birth, phone, identityVerified: true, age: calculateAge(birth), gender, nickname,
      library, libraryVerified, tastes, readingType, readingTypeIcon,
      avatarType:'moa', avatarId:((users.length % 4) + 1), avatarImage:'',
      readBooksCount:0, gatheringCount:0, chatMessagesCount:0,
      missions: typeof createDefaultFirstMissions === 'function' ? createDefaultFirstMissions() : {}, achievements:[], loungeRewards:[]
    };
    users.push(user);
    if (typeof saveAuthUsers === 'function') saveAuthUsers(users);
    saveOverride(id, { birth, phone, identityVerified:true });
    document.getElementById('auth-signup-form')?.reset();
    document.getElementById('signup-identity-verified').value = 'false';
    ['signup-name','signup-birth','signup-phone'].forEach(field => { const el=document.getElementById(field); if(el) el.readOnly=false; });
    const badge = document.getElementById('signup-identity-badge');
    if (badge) { badge.textContent='인증 전'; badge.className=''; }
    document.getElementById('signup-code-row')?.classList.add('hidden');
    if (typeof resetSignupLibraryVerification === 'function') resetSignupLibraryVerification();
    if (typeof applyLoggedInUser === 'function') applyLoggedInUser(user);
  };

  /* ---------- Timeline ---------- */
  const timelineState = { expanded:false, filter:'all', query:'', openMonths:new Set() };
  const typeMeta = {
    book:{label:'책', icon:'book-check'}, gathering:{label:'모임',icon:'users'}, ai:{label:'AI',icon:'sparkles'},
    library:{label:'도서관',icon:'library'}, achievement:{label:'성취',icon:'award'}
  };

  function dateFromText(text, fallback) {
    const m = String(text || '').match(/(20\d{2})[.\-/년\s]+(\d{1,2})(?:[.\-/월\s]+(\d{1,2}))?/);
    if (!m) return fallback || '2026-01-01';
    return `${m[1]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[3] || 1)).padStart(2,'0')}`;
  }
  function formatKoreanDate(iso) {
    const [y,m,d] = iso.split('-').map(Number);
    return `${m}월 ${d}일`;
  }
  function monthKey(iso) {
    const [y,m] = iso.split('-');
    return `${y}년 ${Number(m)}월`;
  }

  function getTimelineEvents() {
    const events = [];
    (state.recentBooks || []).forEach((book, idx) => events.push({
      id:`book-${book.id || idx}`, type:'book', date:dateFromText(book.date,`2026-01-${String(idx+1).padStart(2,'0')}`),
      title:`『${book.title}』을 읽은 책으로 등록했어요.`, detail:`${book.author || '저자 미상'} · ${book.review ? '독서기록 있음' : '독서기록 없음'}`
    }));
    (state.recentArchives || []).forEach((item, idx) => {
      const isAI = String(item.role || item.title || '').includes('AI');
      events.push({ id:`archive-${item.id || idx}`, type:isAI?'ai':'gathering', date:dateFromText(item.date,`2026-02-${String(idx+1).padStart(2,'0')}`),
        title:isAI ? `${item.title} 대화를 저장했어요.` : `${item.title} 활동이 기록되었어요.`,
        detail:isAI ? '모아와 나눈 대화 기록' : `${item.role || '참여자'} · 기록 ${Number(item.comments || 0)}개` });
    });
    const demo = [
      {id:'demo-live',type:'gathering',date:'2026-07-18',title:'우리의 문학 LIVE 모임에 참여했어요.',detail:'『작별인사』 · 참여자 6명 · 온라인'},
      {id:'demo-ai',type:'ai',date:'2026-07-16',title:'『작별인사』의 한 장면을 모아와 이야기했어요.',detail:'인간다움과 선택에 관한 대화 저장'},
      {id:'demo-library',type:'library',date:'2026-07-12',title:'익산시립도서관 독서미션에 참여했어요.',detail:'지역을 읽는 시간 · 진행 중'},
      {id:'demo-achievement',type:'achievement',date:'2026-07-05',title:'독서모임 참여 10회를 기록했어요.',detail:'BOOKMATE 활동 기록'}
    ];
    const existingTitles = new Set(events.map(e => e.title));
    demo.forEach(e => { if (!existingTitles.has(e.title)) events.push(e); });
    return events.sort((a,b) => b.date.localeCompare(a.date));
  }

  function timelineFilteredEvents() {
    const q = timelineState.query.trim().toLowerCase();
    return getTimelineEvents().filter(e => (timelineState.filter === 'all' || e.type === timelineState.filter) && (!q || `${e.title} ${e.detail}`.toLowerCase().includes(q)));
  }
  function eventHTML(event, compact) {
    const meta = typeMeta[event.type] || typeMeta.book;
    return `<article class="timeline-event ${compact ? 'is-compact' : ''}"><span class="timeline-event-icon"><i data-lucide="${meta.icon}"></i></span><div><div class="timeline-event-top"><b>${esc(event.title)}</b><time>${formatKoreanDate(event.date)}</time></div>${compact ? '' : `<p>${esc(event.detail || '')}</p>`}<span class="timeline-type timeline-type-${event.type}">${meta.label}</span></div></article>`;
  }

  window.renderReadingTimeline = function () {
    const summary = document.getElementById('reading-timeline-summary');
    const full = document.getElementById('reading-timeline');
    if (!summary && !full) return;
    const all = timelineFilteredEvents();
    if (summary) summary.innerHTML = all.slice(0,3).map(e => eventHTML(e,true)).join('') || '<p class="timeline-empty">표시할 독서활동이 없습니다.</p>';
    if (full) {
      const groups = {};
      all.forEach(e => { const k=monthKey(e.date); (groups[k] ||= []).push(e); });
      const months = Object.keys(groups);
      if (!timelineState.openMonths.size && months.length) timelineState.openMonths.add(months[0]);
      full.innerHTML = months.map(month => {
        const open = timelineState.openMonths.has(month);
        return `<section class="timeline-month ${open?'is-open':''}"><button onclick="toggleTimelineMonth('${month}')"><b>${month}</b><span>${groups[month].length}개 <i data-lucide="chevron-down"></i></span></button><div class="timeline-month-events">${groups[month].map(e=>eventHTML(e,false)).join('')}</div></section>`;
      }).join('') || '<p class="timeline-empty">검색 조건에 맞는 활동이 없습니다.</p>';
    }
    document.getElementById('reading-timeline-summary')?.classList.toggle('hidden', timelineState.expanded);
    document.getElementById('reading-timeline-expanded')?.classList.toggle('hidden', !timelineState.expanded);
    const toggle = document.getElementById('timeline-panel-toggle');
    if (toggle) toggle.textContent = timelineState.expanded ? '접기' : '펼치기';
    if (window.lucide) lucide.createIcons();
  };
  window.toggleReadingTimelinePanel = function () { timelineState.expanded = !timelineState.expanded; renderReadingTimeline(); };
  window.handleTimelineSearch = function (value) { timelineState.query = value || ''; renderReadingTimeline(); };
  window.setTimelineFilter = function (value) { timelineState.filter = value || 'all'; timelineState.openMonths.clear(); renderReadingTimeline(); };
  window.toggleTimelineMonth = function (month) { timelineState.openMonths.has(month) ? timelineState.openMonths.delete(month) : timelineState.openMonths.add(month); renderReadingTimeline(); };

  /* ---------- Bookmates moved to My Page ---------- */
  window.renderBookmates = function () {
    const list = document.getElementById('mypage-bookmates-list');
    const modalList = document.getElementById('bookmates-modal-list');
    const active = typeof getActiveBookmates === 'function' ? getActiveBookmates() : [];
    if (list) {
      list.innerHTML = active.slice(0,3).map(m => `<button class="mypage-bookmate-row" onclick="openBookmatesModal()">${getAvatarHTML(m,'w-10 h-10')}<span><b>${esc(m.name)}</b><small>${esc(m.gathering || 'BOOKMATE 독서모임')}</small></span><i data-lucide="chevron-right"></i></button>`).join('') || '<p class="timeline-empty">아직 연결된 북메이트가 없습니다.</p>';
    }
    if (modalList) {
      modalList.innerHTML = ((typeof loungeBookmates !== 'undefined' ? loungeBookmates : []) || []).map((m, idx) => {
        const pending=m.status==='pending';
        return `<div class="flex items-center justify-between gap-3 p-3 rounded-2xl border border-brand-ivoryDark bg-brand-ivory/40"><div class="flex items-center gap-3 min-w-0">${getAvatarHTML(m,'w-10 h-10')}<div class="min-w-0"><div class="text-sm font-bold text-brand-navy truncate">${esc(m.name)}</div><div class="text-[10px] text-gray-500">${pending?'초대 수락 대기':`${esc(m.since || '2026.06.01')}부터 북메이트 · ${esc(m.gathering || 'BOOKMATE 독서모임')}`}</div></div></div><div class="flex gap-2 shrink-0">${pending?`<button onclick="acceptBookmate(${idx})" class="px-3 py-1.5 rounded-lg bg-brand-sage text-white text-[10px] font-bold">수락</button>`:''}<button onclick="removeBookmate(${idx})" class="px-3 py-1.5 rounded-lg bg-white border border-brand-ivoryDark text-gray-500 text-[10px] font-bold">삭제</button></div></div>`;
      }).join('');
    }
    if (window.lucide) lucide.createIcons();
  };

  /* Lounge renderer is supplied by js/lounge.js (restored from the known-good version). */

  function initializeRC16() {
    if (typeof state !== 'undefined' && state.currentUser) applyStoredOverride(state.currentUser);
    renderReadingTimeline();
    renderBookmates();
    renderOfficialLounge();
    const birth = document.getElementById('signup-birth');
    if (birth) birth.addEventListener('blur', () => { if (validBirth(birth.value)) birth.value=normalizeBirth(birth.value); });
    const phone = document.getElementById('signup-phone');
    if (phone) phone.addEventListener('input', () => { phone.value=formatPhone(phone.value); });
    if (window.lucide) lucide.createIcons();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeRC16);
  else initializeRC16();
  setTimeout(initializeRC16, 120);
})();
