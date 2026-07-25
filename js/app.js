
        const MOA_AVATARS = {
            1: 'moa-1.png',
            2: 'moa-2.png',
            3: 'moa-3.png',
            4: 'moa-4.png'
        };

        const AI_AVATAR_SRC = 'assets/characters/ai-moa.png';
        const AI_ROLE_AVATARS = {
            moa: AI_AVATAR_SRC,
            debate: AI_AVATAR_SRC,
            organize: AI_AVATAR_SRC,
            coaching: AI_AVATAR_SRC,
            curator: AI_AVATAR_SRC
        };

        function getAIAvatarSrc(modeKey) {
            return AI_AVATAR_SRC;
        }

        function getAIAvatarHTML(sizeClass = 'w-7 h-7', extraClass = '', modeKey) {
            const src = getAIAvatarSrc(modeKey);
            return `<div class="${sizeClass} rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-brand-ivory border border-brand-ivoryDark ${extraClass}"><img src="${src}" alt="AI 모아 프로필" class="w-full h-full object-cover transition-opacity duration-300"></div>`;
        }

        function updateAIHeaderAvatar() {
            const img = document.getElementById('ai-header-avatar-img');
            const wrap = document.getElementById('ai-header-avatar-wrap');
            if (!img) return;
            const nextSrc = getAIAvatarSrc();
            if (img.getAttribute('src') === nextSrc) return;
            img.classList.add('opacity-0');
            if (wrap) wrap.classList.add('scale-95');
            setTimeout(() => {
                img.setAttribute('src', nextSrc);
                img.classList.remove('opacity-0');
                if (wrap) wrap.classList.remove('scale-95');
            }, 160);
        }

        function normalizeAvatarTarget(target) {
            if (!target) return { avatarType: 'moa', avatarId: 1, avatarImage: '' };
            if (!target.avatarType) target.avatarType = 'moa';
            if (!target.avatarId) target.avatarId = 1;
            if (!target.avatarImage) target.avatarImage = '';
            return target;
        }

        function getAvatarHTML(target, sizeClass = 'w-10 h-10', extraClass = '') {
            const avatar = normalizeAvatarTarget(target);
            const name = avatar.nickname || avatar.name || '나';
            const initial = name.charAt(0);
            const base = `${sizeClass} rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-brand-ivory border border-brand-ivoryDark ${extraClass}`;
            if (avatar.avatarType === 'upload' && avatar.avatarImage) {
                return `<div class="${base}"><img src="${avatar.avatarImage}" alt="${name} 프로필" class="w-full h-full object-cover"></div>`;
            }
            const src = MOA_AVATARS[Number(avatar.avatarId || 1)] || MOA_AVATARS[1];
            return `<div class="${base} avatar-moa"><img src="assets/characters/${src}" alt="모아${avatar.avatarId || 1}" class="w-full h-full object-contain p-0.5"></div>`;
        }


        function getAvatarByName(name, sizeClass = 'w-8 h-8') {
            if (state && state.currentUser && name === state.currentUser.nickname) return getAvatarHTML(state.currentUser, sizeClass);
            const accountPool = (typeof getAuthUsers === 'function') ? getAuthUsers() : (typeof DEFAULT_AUTH_USERS !== 'undefined' ? DEFAULT_AUTH_USERS : []);
            const accountMatch = accountPool.find(u => u.nickname === name || u.id === name);
            if (accountMatch) return getAvatarHTML(accountMatch, sizeClass);
            const pool = (typeof loungeBookmates !== 'undefined' && loungeBookmates.length) ? loungeBookmates : (typeof DEFAULT_BOOKMATES !== 'undefined' ? DEFAULT_BOOKMATES : []);
            const matched = pool.find(m => m.name === name || m.nickname === name);
            if (matched) return getAvatarHTML(matched, sizeClass);
            const fallbackId = ((String(name || '모아').charCodeAt(0) || 0) % 4) + 1;
            return getAvatarHTML({ name, avatarType: 'moa', avatarId: fallbackId }, sizeClass);
        }

        function updateAvatarPreview(targetId, target) {
            const el = document.getElementById(targetId);
            if (el) el.outerHTML = getAvatarHTML(target, el.className || 'w-10 h-10', 'shadow-inner relative z-10 border-4 border-white');
        }

        function safeSetText(id, text) {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        }



        function getKoreanWeekday(date = new Date()) {
            return ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][date.getDay()];
        }

        function isGatheringScheduledToday(g, date = new Date()) {
            if (!g || !g.joined) return false;
            const schedule = String(g.schedule || '').trim();
            if (!schedule || schedule === '협의' || schedule.includes('협의')) return false;
            if (schedule.includes('매일')) return true;

            const weekday = getKoreanWeekday(date);
            if (schedule.includes(weekday)) return true;

            const monthDayMatch = schedule.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
            if (monthDayMatch) {
                return Number(monthDayMatch[1]) === (date.getMonth() + 1) && Number(monthDayMatch[2]) === date.getDate();
            }

            return false;
        }

        function getTodayJoinedGatherings() {
            if (typeof isGuestUser === 'function' && isGuestUser()) return [];
            return (state.gatherings || []).filter(g => isGatheringScheduledToday(g));
        }

        function getGatheringScheduleTime(schedule) {
            const text = String(schedule || '');
            const hhmm = text.match(/(\d{1,2})\s*[:시]\s*(\d{1,2})?/);
            if (!hhmm) return '';
            const hour = String(hhmm[1]).padStart(2, '0');
            const minute = String(hhmm[2] || '00').padStart(2, '0');
            return `${hour}:${minute}`;
        }

        const HOME_BOOK_CATALOG = window.BOOKMATE_BOOKS_BY_TITLE || {};

        const HOME_BOOK_COVERS = {
            '작별인사': 'assets/images/books/farewell.jpg',
            '1984': 'assets/images/books/1984-minumsa.jpg',
            '데미안': 'assets/images/books/demian.jpg',
            '아몬드': 'assets/images/books/almond.jpg',
            '소년이온다': 'assets/images/books/human-acts.jpg',
            '달러구트꿈백화점': 'assets/images/books/dallergut-purple.jpg',
            '불편한편의점': 'assets/images/books/uncomfortable-store.jpg',
            '노인과바다': 'assets/images/books/old-man-and-the-sea.png',
            '사피엔스': 'assets/images/books/sapiens.jpg',
            '도둑맞은집중력': 'assets/images/books/stolen-focus.jpg',
            '채식주의자': 'assets/images/books/vegetarian.jpg',
            '82년생김지영': 'assets/images/books/82-kim-jiyoung.jpg'
        };
        const HOME_POPULAR_BOOKS = [
            { title:'작별인사', count:12 },
            { title:'1984', count:9 },
            { title:'데미안', count:7 },
            { title:'아몬드', count:5 },
            { title:'소년이 온다', count:4 },
            { title:'불편한 편의점', count:11 },
            { title:'달러구트 꿈 백화점', count:10 },
            { title:'노인과 바다', count:6 }
        ];
                const HOME_DISCUSSIONS = [
            { title:'작별인사', count:12, teaser:'인간다움과 관계에 대한 서로 다른 해석이 이어지고 있어요.', activity:'방금 전에도 새로운 감상이 올라왔어요.' },
            { title:'1984', count:8, teaser:'감시와 자유를 바라보는 독자들의 의견이 엇갈리고 있어요.', activity:'같은 장면을 전혀 다르게 읽은 이야기가 있어요.' },
            { title:'데미안', count:6, teaser:'성장과 자기 발견을 자신의 경험과 연결해 이야기하고 있어요.', activity:'오래 남은 문장을 함께 나누고 있어요.' },
            { title:'불편한 편의점', count:11, teaser:'작은 친절과 공동체의 온기를 발견한 독자들의 이야기가 모였어요.', activity:'편의점에서 가장 기억에 남은 인물은 누구였을까요?' },
            { title:'아몬드', count:9, teaser:'공감은 타고나는지 배워가는지 다양한 의견이 오가고 있어요.', activity:'윤재와 곤을 바라보는 시선이 서로 달라요.' }
        ];

        function getHomeBookCover(title) {
            const key = normalizeHomeBookTitle(title);
            const local = HOME_BOOK_COVERS[key];
            if (local) return local;
            const meta = getHomeBookMeta(title);
            return meta.cover || '';
        }

        function getHomeCoverMarkup(title, extraClass = '') {
            const safeTitle = escapeHTML(title || '주제도서');
            const src = getHomeBookCover(title);
            const image = src ? `<img src="${escapeHTML(src)}" alt="${safeTitle} 표지" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : '';
            const hidden = src ? ' style="display:none"' : '';
            return `<div class="home-cover-shell ${extraClass}">${image}<span class="home-cover-fallback"${hidden}>${safeTitle}</span></div>`;
        }

function syncHomeDemoData() {
    const main = (state.gatherings || []).find(g => Number(g.id) === 1) || (state.gatherings || []).find(g => g.joined);
    if (main) Object.assign(main, {
        title:'우리의 문학', book:'작별인사', author:'김영하', membersCount:6,
        scope:'공개', type:'정기모임', method:'온라인', schedule:'매일 20:00', joined:true, isLeader:true,
        leaderNickname:'달빛독서가'
    });
    const demoNotifications = [
        { id:90, type:'message', from:'문장수집가', avatarId:2, message:'오늘 LIVE 전에 나누고 싶은 문장을 채팅으로 보냈어요.', time:'18분 전', isRead:false },
        { id:91, type:'guestbook', from:'책읽는기린', avatarId:3, message:'“달빛 아래 책장이 정말 포근해 보여요.”라고 방명록을 남겼어요.', time:'42분 전', isRead:false },
        { id:92, type:'invite_rx', from:'지혜의등대', avatarId:4, gathering:'1984 자유와 감시 읽기', message:'『1984』를 함께 읽는 새 모임에 초대했어요.', time:'1시간 전', isRead:false },
        { id:93, type:'hello', from:'사유올빼미', avatarId:2, message:'지난 데미안 모임에서 나눈 이야기가 오래 남았다고 인사를 건넸어요.', time:'2시간 전', isRead:true }
    ];
    if (!Array.isArray(state.notifications)) state.notifications = [];
    demoNotifications.forEach(item => {
        const existing = state.notifications.find(n => Number(n.id) === item.id);
        if (existing) Object.assign(existing, item);
        else state.notifications.push(item);
    });
}

        function normalizeHomeBookTitle(title) {
            return String(title || '').replace(/[『』「」\s:：·]/g, '').toLowerCase();
        }

        function getHomeBookMeta(title) {
            const key = Object.keys(HOME_BOOK_CATALOG).find(k => normalizeHomeBookTitle(k) === normalizeHomeBookTitle(title));
            return key ? HOME_BOOK_CATALOG[key] : {
                title: title || '책 제목 없음', author: '저자 정보 없음', publisher: '출판사 정보 없음', publicationYear: '확인 중',
                category: ['도서'], cover: '', themes: ['독서', '이야기'], recommendations: [],
                description: '책의 기본 정보와 관련 토론을 확인할 수 있습니다. 상세 데이터는 도서 데이터베이스에 순차적으로 연결됩니다.',
                scene: '가장 기억에 남은 장면', question: '이 장면이 오래 남은 이유는 무엇인가요?'
            };
        }

        function getHomeBookReadingStatus(title) {
            if (typeof isGuestUser === 'function' && isGuestUser()) return { label: '', className: 'guest', hidden: true };
            const key = normalizeHomeBookTitle(title);
            const recent = (state.recentBooks || []).some(b => normalizeHomeBookTitle(b.title) === key);
            const archive = (state.recentArchives || []).some(a => normalizeHomeBookTitle(a.title || '').includes(key));
            return (recent || archive)
                ? { label: '읽은 책', className: 'read', hidden: false }
                : { label: '읽지 않은 책', className: 'unread', hidden: false };
        }

        function getHomeLibraryProvider() {
            if (!state.currentUser || !state.currentUser.libraryVerified) return null;
            return typeof findBookmateLibrary === 'function' ? findBookmateLibrary(state.currentUser.library) : null;
        }

        function openHomeLibrarySearch(title) {
            const provider = getHomeLibraryProvider();
            if (!provider) {
                closeHomeBookInfo();
                if (typeof isGuestUser === 'function' && isGuestUser()) openAuthPage('login');
                else openSettingsModal();
                showToast('소속도서관을 인증하면 해당 도서관에서 바로 검색할 수 있어요.');
                return;
            }
            const url = provider.buildSearchUrl(title);
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        function openHomeBookInfo(title) {
            const meta = getHomeBookMeta(title);
            const modal = document.getElementById('home-book-info-modal');
            if (!modal) return;
            safeSetText('home-book-modal-title', meta.title);
            safeSetText('home-book-modal-author', meta.author);
            safeSetText('home-book-modal-publisher', meta.publisher || '출판사 정보 없음');
            safeSetText('home-book-modal-year', meta.publicationYear || '확인 중');
            safeSetText('home-book-modal-category', (meta.category || ['도서']).join(' / '));
            safeSetText('home-book-modal-description', meta.description);
            const status = getHomeBookReadingStatus(meta.title);
            const statusEl = document.getElementById('home-book-modal-status');
            if (statusEl) {
                statusEl.textContent = status.label;
                statusEl.className = `home-book-status ${status.className}`;
                statusEl.classList.toggle('hidden', !!status.hidden);
            }
            const themes = document.getElementById('home-book-modal-themes');
            if (themes) themes.innerHTML = (meta.themes || []).map(t => `<span>#${escapeHTML(t)}</span>`).join('');
            const recommendations = document.getElementById('home-book-modal-recommendations');
            if (recommendations) {
                recommendations.innerHTML = (meta.recommendations || []).length
                    ? meta.recommendations.map(t => `<button onclick="openHomeBookInfo(${JSON.stringify(t).replace(/"/g,'&quot;')})"><i data-lucide="book-open"></i>${escapeHTML(t)}</button>`).join('')
                    : '<span class="home-book-no-recommendation">연관 추천도서를 준비 중이에요.</span>';
            }
            const discussionBtn = document.getElementById('home-book-discussion-btn');
            if (discussionBtn) discussionBtn.onclick = () => openBookDiscussionFromHome(meta.title);
            const aiBtn = document.getElementById('home-book-ai-btn');
            if (aiBtn) aiBtn.onclick = () => openHomeAIQuestion(meta.title, meta.scene, meta.question);
            const provider = getHomeLibraryProvider();
            const libraryCaption = document.getElementById('home-book-library-caption');
            const libraryBtn = document.getElementById('home-book-library-btn');
            if (provider) {
                safeSetText('home-book-library-caption', `${provider.name}의 소장자료 검색결과로 이동합니다.`);
                if (libraryBtn) {
                    libraryBtn.innerHTML = `<i data-lucide="library"></i><span>${escapeHTML(provider.name)}에서 검색하기</span>`;
                    libraryBtn.onclick = () => openHomeLibrarySearch(meta.title);
                }
            } else {
                safeSetText('home-book-library-caption', '소속도서관을 인증하면 도서관 소장자료를 바로 확인할 수 있어요.');
                if (libraryBtn) {
                    libraryBtn.innerHTML = '<i data-lucide="badge-check"></i><span>소속도서관 인증하기</span>';
                    libraryBtn.onclick = () => openHomeLibrarySearch(meta.title);
                }
            }
            modal.classList.remove('hidden');
            requestAnimationFrame(() => modal.classList.add('is-open'));
            document.body.classList.add('home-modal-open');
            try { lucide.createIcons(); } catch(e) {}
        }

        function closeHomeBookInfo() {
            const modal = document.getElementById('home-book-info-modal');
            if (!modal) return;
            modal.classList.remove('is-open');
            setTimeout(() => modal.classList.add('hidden'), 160);
            document.body.classList.remove('home-modal-open');
        }

        function openBookDiscussionFromHome(title) {
            closeHomeBookInfo();
            navigate('realtime-room');
            setTimeout(() => {
                if (typeof openBookDiscussion === 'function') openBookDiscussion(title);
            }, 30);
        }

        function openAllDiscussionsFromHome() {
            navigate('realtime-room');
            setTimeout(() => {
                if (typeof clearBookDiscussionFilter === 'function') clearBookDiscussionFilter();
            }, 30);
        }

        function openHomeAIQuestion(bookTitle, scene, question) {
            closeHomeBookInfo();
            navigate('ai-chat');
            setTimeout(() => {
                if (typeof resetAIChat === 'function') resetAIChat(bookTitle, 'debate');
                if (typeof setAIBookTitle === 'function') setAIBookTitle(bookTitle, true);
                const opener = `『${bookTitle}』의 ${scene}에 대해 이야기해볼까요?\n\n${question}`;
                state.currentAIBook = bookTitle;
                state.currentAIMode = 'debate';
                state.aiSetupStage = 'chat';
                state.aiChatHistory = [
                    { role: 'user', parts: [{ text: `메인에서 『${bookTitle}』의 장면 질문을 선택했습니다.` }] },
                    { role: 'model', parts: [{ text: opener }] }
                ];
                const scroller = document.getElementById('ai-chat-scroller');
                if (scroller) {
                    scroller.innerHTML = '';
                    if (typeof appendAIMessageToScroller === 'function') appendAIMessageToScroller('model', opener);
                    scroller.scrollTop = scroller.scrollHeight;
                }
                safeSetText('ai-chat-header-book', `『${bookTitle}』`);
                if (typeof renderAIBookAnalysisCard === 'function') renderAIBookAnalysisCard(bookTitle);
                if (typeof renderAIRightSidebar === 'function') renderAIRightSidebar();
            }, 40);
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeHomeBookInfo();
            if ((e.key === 'Enter' || e.key === ' ') && e.target?.classList?.contains('bookfeed-talk')) e.target.click();
        });


        function renderHomePopularBooks() {
            const container = document.getElementById('home-popular-books');
            if (!container) return;
            container.innerHTML = HOME_POPULAR_BOOKS.map((book, index) => `
                <button class="bookfeed-book" onclick="openHomeBookInfo(${JSON.stringify(book.title).replace(/"/g,'&quot;')})">
                    <span class="bookfeed-rank">${index + 1}</span>
                    ${getHomeCoverMarkup(book.title, 'bookfeed-book-cover')}
                    <b>${escapeHTML(book.title)}</b>
                    <small>${Number(book.count)}명 토론 중</small>
                </button>`).join('');
        }

        function renderHomeDiscussions() {
            const container = document.getElementById('home-discussion-rail');
            if (!container) return;
            container.innerHTML = HOME_DISCUSSIONS.map(item => `
                <article class="bookfeed-talk" onclick="openBookDiscussionFromHome(${JSON.stringify(item.title).replace(/"/g,'&quot;')})" role="button" tabindex="0">
                    ${getHomeCoverMarkup(item.title, 'bookfeed-talk-cover')}
                    <div>
                        <div class="bookfeed-talk-title"><b>${escapeHTML(item.title)}</b><span>${Number(item.count)}명 참여</span></div>
                        <p class="bookfeed-talk-teaser">${escapeHTML(item.teaser)}</p>
                        <div class="bookfeed-talk-bottom"><small>${escapeHTML(item.activity)}</small><button onclick="event.stopPropagation();openBookDiscussionFromHome(${JSON.stringify(item.title).replace(/"/g,'&quot;')})">참여하기</button></div>
                    </div>
                </article>`).join('');
        }

        function getHomeGroupScopeLabel(group) {
            if (group.scope === '비공개') return '비공개';
            if (group.libraryOnly || group.library || group.scope === '도서관 전용') return '도서관 전용';
            return '공개';
        }

        function renderHomeMemberGroups() {
            const container = document.getElementById('home-my-groups');
            if (!container) return;
            const joined = (state.gatherings || []).filter(g => g.joined);
            if (!joined.length) {
                container.innerHTML = `<button class="bookfeed-empty-card" onclick="navigate('search-results')">참여 중인 모임이 없어요.<br><b>새 모임 찾아보기</b></button>`;
                return;
            }
            container.innerHTML = joined.map(g => `
                <button class="bookfeed-club bookfeed-club-detail" onclick="enterMeetingRoomById(${Number(g.id)})">
                    ${getHomeCoverMarkup(g.book || '주제도서', 'bookfeed-group-cover')}
                    <div class="bookfeed-club-copy">
                        <div class="bookfeed-card-badges">
                            <span>${escapeHTML(getHomeGroupScopeLabel(g))}</span>
                            <span>${escapeHTML(g.method || '모임')}</span>
                            ${g.isLeader ? '<span class="leader">모임장</span>' : ''}
                        </div>
                        <b>${escapeHTML(g.title)}</b>
                        <small>${escapeHTML(g.schedule || '일정 협의')}</small>
                        <em>『${escapeHTML(g.book || '주제도서 미정')}』</em>
                    </div>
                </button>`).join('');
        }


        function getNotificationAvatarHTML(n, person, sizeClass = 'w-10 h-10') {
            if (n && n.avatarId) return getAvatarHTML({ name:person, nickname:person, avatarType:'moa', avatarId:Number(n.avatarId) || 1 }, sizeClass);
            return getAvatarByName(person, sizeClass);
        }

        function getNotificationPresentation(n) {
            const type = n?.type || 'message';
            const person = n?.from || n?.to || n?.leaderNickname || '북메이트';
            const meetingTitle = n?.gathering || n?.title || '';
            const common = { type, person, headline:'새로운 알림이 있어요.', detail:n?.message || n?.detail || '', actionLabel:'알림 보기' };
            if (type === 'meeting') return { ...common, headline:`오늘 ${n.timeLabel || n.time || '예정'} · ${meetingTitle} 모임이 있어요.`, detail:n.detail || '', actionLabel:'일정 보기' };
            if (type === 'message') return { ...common, headline:`${person}님이 채팅 메시지를 보냈어요.`, detail:n.message || '', actionLabel:'메시지 보기' };
            if (type === 'guestbook') return { ...common, headline:`${person}님이 북라운지 방명록을 남겼어요.`, detail:n.message || '', actionLabel:'방명록 보기' };
            if (type === 'hello') return { ...common, headline:`${person}님이 인사를 건넸어요.`, detail:n.message || '', actionLabel:'인사 답하기' };
            if (type === 'invite_rx') return { ...common, headline:`${person}님이 독서모임에 초대했어요.`, detail:n.message || meetingTitle, actionLabel:'초대 확인' };
            if (type === 'invite_tx') return { ...common, person:n.to || person, headline:`${n.to || '북메이트'}님에게 초대장을 보냈어요.`, detail:meetingTitle || n.status || '', actionLabel:'상태 보기' };
            if (type === 'lounge_visit') return { ...common, headline:`${person}님이 북라운지를 방문했어요.`, detail:n.message || '', actionLabel:'북라운지 보기' };
            return common;
        }

function renderHomeNotifications() {
    const container = document.getElementById('home-notification-rail');
    if (!container) return;
    const meetingItems = getTodayJoinedGatherings().map((g, index) => ({
        id:`meeting-${g.id || index}`, type:'meeting', from:g.leaderNickname || '달빛독서가', avatarId:g.isLeader ? state.currentUser?.avatarId : undefined,
        gathering:g.title, timeLabel:getGatheringScheduleTime(g.schedule) || '예정',
        detail:`『${g.book || '주제도서'}』 · ${g.method || '모임 방식 확인'} · 참여 예정 ${Number(g.membersCount || 0)}명`, time:'오늘', isRead:false
    }));
    const notifications = meetingItems.concat((state.notifications || []).slice().sort((a,b)=>Number(a.isRead)-Number(b.isRead)).slice(0, 6)).slice(0, 7);
    if (!notifications.length) {
        container.innerHTML = `<button class="bookfeed-empty-card" onclick="navigate('notifications')">새로운 알림이 없습니다.</button>`;
        return;
    }
    container.innerHTML = notifications.map(n => {
        const view = getNotificationPresentation(n);
        return `<button class="bookfeed-notification ${escapeHTML(view.type)}" onclick="navigate('notifications')">
            <span class="bookfeed-notification-profile">${getNotificationAvatarHTML(n, view.person, 'w-10 h-10')}</span>
            <div><b>${escapeHTML(view.headline)}</b>${view.detail ? `<p>${escapeHTML(view.detail)}</p>` : ''}<small>${escapeHTML(n.time || '')}</small></div>
            ${n.isRead ? '' : '<i class="bookfeed-unread-dot"></i>'}
        </button>`;
    }).join('');
}

        function getHomeGroupScope(group) {
            if (group.libraryOnly || group.library || group.scope === '도서관 전용') return `🏛 ${group.library || '도서관'} 전용`;
            if (group.scope === '비공개') return '🔒 초대 전용';
            return '전체 공개';
        }

        function openHomeGathering(id) {
            const group = (state.gatherings || []).find(g => Number(g.id) === Number(id));
            if (!group) return;
            if (group.joined) { enterMeetingRoomById(group.id); return; }
            navigate('search-results');
            setTimeout(() => {
                if (typeof renderGatheringsGrid === 'function') renderGatheringsGrid([group]);
            }, 40);
        }

        function renderHomeNewGroups() {
            const container = document.getElementById('home-new-groups');
            if (!container) return;
            const groups = (state.gatherings || [])
                .filter(g => !g.joined && g.scope !== '비공개')
                .sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || Number(b.id || 0) - Number(a.id || 0))
                .slice(0, 6);
            if (!groups.length) {
                container.innerHTML = `<button class="bookfeed-empty-card" onclick="navigate('search-results')">현재 모집 중인 새 모임을 확인해보세요.</button>`;
                return;
            }
            container.innerHTML = groups.map(g => `
                <article class="bookfeed-new bookfeed-new-connected" onclick="openHomeGathering(${Number(g.id)})" tabindex="0" role="button">
                    ${getHomeCoverMarkup(g.book || '주제도서', 'bookfeed-new-cover')}
                    <div class="bookfeed-new-copy">
                        <div class="bookfeed-card-badges">
                            <span>${escapeHTML(getHomeGroupScopeLabel(g))}</span>
                            <span>${escapeHTML(g.type || '모임')}</span>
                            ${g.library ? `<span class="library">${escapeHTML(g.library)}</span>` : ''}
                        </div>
                        <b>${escapeHTML(g.title)}</b>
                        <small>『${escapeHTML(g.book || '주제도서 미정')}』</small>
                        <p>${escapeHTML(g.schedule || '일정 협의')} · ${escapeHTML(g.method || '방식 확인')}</p>
                        <em>${Number(g.membersCount || 0)}/${Number(g.maxMembers || 0)}명 참여</em>
                    </div>
                </article>`).join('');
        }

        function renderHomeSharedContent() {
            renderHomePopularBooks();
            renderHomeDiscussions();
            renderHomeNewGroups();
        }

        function renderHomeConnectedData() {
            syncHomeDemoData();
            renderHomeSharedContent();
            renderHomeMemberGroups();
            renderHomeNotifications();
            try { lucide.createIcons(); } catch(e) {}
        }

function updateHomeReadingSchedule() {
    const card = document.getElementById('home-reading-schedule-card');
    if (!card) return;
    syncHomeDemoData();
    const todays = getTodayJoinedGatherings();
    const g = todays[0] || (state.gatherings || []).find(item => item.joined);
    const titleEl = document.getElementById('home-hero-book-title');
    const authorEl = document.getElementById('home-hero-author');
    const coverSlot = document.getElementById('home-hero-cover-slot');
    const titleButton = card.querySelector('.bookfeed-hero-book-title');
    const liveButton = card.querySelector('.bookfeed-dark-btn');
    const communityButton = card.querySelector('.bookfeed-light-btn');
    if (g) {
        const time = getGatheringScheduleTime(g.schedule) || (todays.length ? '오늘' : g.schedule || '일정 확인');
        const bookTitle = g.book || '오늘의 독서';
        if (titleEl) titleEl.innerText = bookTitle;
        if (authorEl) authorEl.innerText = g.author || getHomeBookMeta(bookTitle).author || '저자 정보 확인';
        if (coverSlot) coverSlot.innerHTML = getHomeCoverMarkup(bookTitle, 'bookfeed-hero-cover');
        safeSetText('home-hero-time', todays.length ? `오늘 ${time}` : time);
        safeSetText('home-hero-method', g.method || g.platform || '독서모임');
        safeSetText('home-hero-members', `참여 예정 ${Number(g.membersCount || 0)}명`);
        safeSetText('home-hero-group-name', g.title || '독서모임');
        if (titleButton) titleButton.setAttribute('onclick', `openHomeBookInfo(${JSON.stringify(bookTitle)})`);
        if (liveButton) liveButton.setAttribute('onclick', 'openEmbeddedLiveRoom()');
        if (communityButton) communityButton.setAttribute('onclick', `enterMeetingRoom(${JSON.stringify(bookTitle)}, ${JSON.stringify(g.id || null)})`);
    }
    card.classList.remove('hidden');
}

        function updateHomeBrief() {
            const memberHome = document.getElementById('member-home-content');
            const guestHome = document.getElementById('guest-home-content');
            const guest = typeof isGuestUser === 'function' && isGuestUser();
            if (memberHome) memberHome.classList.toggle('hidden', guest);
            if (guestHome) guestHome.classList.toggle('hidden', !guest);
            const memberSecondary = document.getElementById('member-home-secondary');
            if (memberSecondary) memberSecondary.classList.toggle('hidden', guest);
            if (guest) { renderHomeSharedContent(); return; }
            safeSetText('home-brief-eyebrow', `안녕하세요, ${state.currentUser.nickname}님 ☀️`);
            safeSetText('home-brief-title', '오늘도 함께 읽어볼까요?');
            const todayCount = getTodayJoinedGatherings().length;
            safeSetText('home-brief-subtitle', todayCount > 0 ? `오늘 예정된 독서모임 ${todayCount}개가 있어요. 책과 새로운 질문이 기다리고 있습니다.` : '책과 사람, 그리고 새로운 질문이 기다리고 있어요.');
            updateHomeReadingSchedule();
            renderHomeConnectedData();
        }

        function openProfileCard() {
            normalizeAvatarTarget(state.currentUser);
            const modal = document.getElementById('profile-card-modal');
            const avatar = document.getElementById('profile-card-avatar');
            if (avatar) avatar.innerHTML = getAvatarHTML(state.currentUser, 'w-24 h-24', 'border-4 border-white shadow-md');
            safeSetText('profile-card-name', state.currentUser.nickname);
            safeSetText('profile-card-library', state.currentUser.library);
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        function closeProfileCard() {
            const modal = document.getElementById('profile-card-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function toggleArchiveDetail(idNum) {
            const detailEl = document.getElementById(`archive-detail-${idNum}`);
            const iconEl = document.getElementById(`archive-icon-${idNum}`);
            if (detailEl) {
                if (detailEl.classList.contains('hidden')) {
                    detailEl.classList.remove('hidden');
                    detailEl.classList.add('animate-fadeIn');
                    if(iconEl) iconEl.style.transform = 'rotate(180deg)';
                } else {
                    detailEl.classList.add('hidden');
                    detailEl.classList.remove('animate-fadeIn');
                    if(iconEl) iconEl.style.transform = 'rotate(0deg)';
                }
            }
        }

        function updateUIProfileData() {
            normalizeAvatarTarget(state.currentUser);
            const nickname = state.currentUser.nickname;
            const library = state.currentUser.library;

            safeSetText('header-nickname', nickname);
            const headerAvatar = document.getElementById('header-avatar-initial');
            if (headerAvatar) headerAvatar.outerHTML = getAvatarHTML(state.currentUser, 'w-6 h-6', 'header-avatar').replace('<div class="', '<div id="header-avatar-initial" class="');
            const profileAvatar = document.getElementById('profile-avatar-initial');
            if (profileAvatar) profileAvatar.outerHTML = getAvatarHTML(state.currentUser, 'w-20 h-20', 'shadow-inner relative z-10 border-4 border-white').replace('<div class="', '<div id="profile-avatar-initial" class="');
            safeSetText('profile-nickname', nickname);
            safeSetText('mypage-library-name', library);
            const libraryVerifiedBadge = document.getElementById('mypage-library-verified-badge');
            if (libraryVerifiedBadge) {
                libraryVerifiedBadge.classList.toggle('hidden', !state.currentUser.libraryVerified);
                libraryVerifiedBadge.textContent = state.currentUser.libraryVerified ? '인증회원' : '미인증';
            }
            safeSetText('mypage-info-nickname-span', nickname);
            safeSetText('my-read-count-val', state.currentUser.readBooksCount || 0);
            safeSetText('my-chat-count-val', (state.currentUser.chatMessagesCount || 0).toLocaleString());
            const readingBadge = document.getElementById('mypage-reading-type-badge');
            if (readingBadge) {
                const label = state.currentUser.readingType ? `${state.currentUser.readingTypeIcon || '📖'} ${state.currentUser.readingType}` : '';
                readingBadge.innerText = label;
                readingBadge.classList.toggle('hidden', !label);
            }

            document.querySelectorAll('.archive-my-nick').forEach(el => el.innerText = nickname);
            document.querySelectorAll('.archive-my-nick-label').forEach(el => el.innerText = `${nickname} (나)`);

            safeSetText('meeting-user-card-name', `${nickname} (나)`);
            safeSetText('meeting-leader-name-span', nickname);
            safeSetText('my-gathering-count-val', state.gatherings.filter(g=>g.joined).length);

            updateHomeBrief();
            renderMyPageNotifications();
            renderMyPageRecentBooks();
            renderReadingTimeline();
            renderMyPageRecentArchives();
            if (typeof renderHomeLibraryMissionPreview === 'function') renderHomeLibraryMissionPreview();
            if (state.currentView === 'library' && typeof renderMyLibraryHub === 'function') renderMyLibraryHub();
        }

function renderMyPageNotifications() {
    const container = document.getElementById('mypage-notifications-list');
    if (!container) return;
    renderSocialComposerState();
    container.innerHTML = '';
    const unreadCount = state.notifications.filter(n => !n.isRead).length + (typeof getTodayJoinedGatherings === 'function' ? getTodayJoinedGatherings().length : 0);
    const badge = document.getElementById('notification-badge-count');
    if (badge) { badge.innerText = unreadCount; badge.style.display = unreadCount > 0 ? 'flex' : 'none'; }
    if (state.notifications.length === 0) {
        container.innerHTML = `<div class="text-xs text-gray-400 text-center py-4">새로운 알림이 없습니다.</div>`;
        return;
    }
    state.notifications.forEach(n => {
        const view = getNotificationPresentation(n);
        const isReadClass = n.isRead ? 'opacity-60' : '';
        const dotClass = n.isRead ? '' : '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>';
        let actions = '';
        if (n.type === 'hello') actions = `<button onclick="handleNotiAction(${n.id}, 'reply')" class="mt-2 px-3 py-1.5 bg-brand-sageLight text-brand-sageDark rounded-lg text-[10px] font-bold">인사 답하기</button>`;
        else if (n.type === 'invite_rx') actions = `<div class="flex gap-2 mt-2"><button onclick="handleNotiAction(${n.id}, 'accept')" class="px-3 py-1.5 bg-brand-navy text-white rounded-lg text-[10px] font-bold">수락</button><button onclick="handleNotiAction(${n.id}, 'decline')" class="px-3 py-1.5 bg-brand-ivory text-brand-navy border border-brand-ivoryDark rounded-lg text-[10px] font-bold">거절</button></div>`;
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl border border-brand-ivoryDark bg-brand-ivory/30 ${isReadClass}`;
        div.innerHTML = `<div class="flex gap-3"><div class="relative shrink-0">${getNotificationAvatarHTML(n, view.person, 'w-9 h-9')}${dotClass}</div><div class="flex-grow min-w-0"><div class="flex justify-between items-start gap-2"><span class="text-[10px] font-bold text-brand-navy block">${escapeHTML(view.headline)}</span><span class="text-[9px] text-gray-400 shrink-0">${escapeHTML(n.time || '')}</span></div>${view.detail ? `<p class="text-[11px] text-gray-600 mt-1 leading-snug">${escapeHTML(view.detail)}</p>` : ''}${actions}</div></div>`;
        container.appendChild(div);
    });
}

        function handleNotiAction(id, actionType) {
            const noti = state.notifications.find(n => n.id === id);
            if(noti) noti.isRead = true;
            
            if (actionType === 'reply') showToast("인사에 따뜻하게 답했습니다!");
            else if (actionType === 'accept') showToast(`모임 초대를 수락했습니다!`);
            else if (actionType === 'decline') showToast("초대를 정중히 거절했습니다.");
            
            renderMyPageNotifications();
        }

        let currentReviewBookId = null;

        function openReviewModal(bookId) {
            const book = state.recentBooks.find(b => b.id === bookId);
            if (!book) return;
            currentReviewBookId = bookId;
            
            safeSetText('review-modal-title', book.title);
            safeSetText('review-modal-author', `${book.author} 저`);
            safeSetText('review-modal-date', book.date);
            document.getElementById('review-modal-content').value = book.review || '';
            
            const coverContainer = document.getElementById('review-modal-cover');
            coverContainer.className = `w-16 h-24 ${book.color} rounded-lg shadow-sm flex items-center justify-center text-white text-[10px] font-bold text-center overflow-hidden shrink-0 relative`;
            coverContainer.innerHTML = `<span class="px-1 break-keep relative z-10">${book.title}</span><div id="review-modal-cover-img" class="absolute inset-0 w-full h-full z-0"></div>`;

            loadReviewModalCover(book.title, 'review-modal-cover-img');

            document.getElementById('review-modal').classList.remove('hidden');
        }

        async function loadReviewModalCover(bookTitle, containerId) {
            const trimmedTitle = (bookTitle || '').trim();
            try {
                const imageUrl = await getBookCoverUrl(trimmedTitle);
                if (imageUrl) {
                    const img = new Image();
                    img.src = imageUrl;
                    img.referrerPolicy = 'no-referrer';
                    img.onload = () => {
                        const container = document.getElementById(containerId);
                        if (container) {
                            container.innerHTML = `<img src="${imageUrl}" class="w-full h-full object-cover" referrerpolicy="no-referrer">`;
                            if (container.previousElementSibling) {
                                container.previousElementSibling.classList.add('hidden');
                            }
                        }
                    };
                    img.onerror = () => console.info('[BOOKMATE Cover] 리뷰 모달 표지 실패:', trimmedTitle, imageUrl);
                }
            } catch (e) {
                console.info('[BOOKMATE Cover] 리뷰 모달 표지 로딩 예외:', trimmedTitle, e);
            }
        }

        function closeReviewModal() {
            document.getElementById('review-modal').classList.add('hidden');
            currentReviewBookId = null;
        }

        function saveReview() {
            if (!currentReviewBookId) return;
            const book = state.recentBooks.find(b => b.id === currentReviewBookId);
            if (book) {
                book.review = document.getElementById('review-modal-content').value.trim();
                showToast("서평이 저장되었습니다.");
                saveAppState();
            }
            closeReviewModal();
        }

        function openAddBookModal() {
            const titleEl = document.getElementById('add-book-title');
            titleEl.value = '';
            titleEl.dataset.bookCover = '';
            titleEl.dataset.bookAuthor = '';
            titleEl.dataset.bookPublisher = '';
            titleEl.dataset.bookPublishedDate = '';
            titleEl.dataset.bookIsbn = '';
            document.getElementById('add-book-author').value = '';
            document.getElementById('add-book-review').value = '';
            document.getElementById('add-book-modal').classList.remove('hidden');
        }

        function closeAddBookModal() {
            document.getElementById('add-book-modal').classList.add('hidden');
        }

        function addNewBook() {
            const title = document.getElementById('add-book-title').value.trim();
            const author = document.getElementById('add-book-author').value.trim() || '미상';
            const review = document.getElementById('add-book-review').value.trim();
            const bookMeta = getSelectedBookMeta('add-book-title');
            
            if (!title) { showToast("책 제목을 입력해주세요.", "error"); return; }

            const colors = ['bg-[#2A4365]', 'bg-[#374151]', 'bg-[#701A24]', 'bg-[#285E61]', 'bg-[#5F8575]', 'bg-[#854D0E]'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            const today = new Date();
            const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} 완독`;

            const newBook = {
                id: Date.now(),
                title: title,
                author: author,
                date: dateStr,
                review: review,
                color: randomColor,
                coverUrl: bookMeta.coverUrl || '',
                publisher: bookMeta.publisher || '',
                publishedDate: bookMeta.publishedDate || '',
                isbn: bookMeta.isbn || ''
            };

            state.recentBooks.unshift(newBook);
            state.currentUser.readBooksCount++;
            
            renderMyPageRecentBooks();
            renderReadingTimeline();
            safeSetText('my-read-count-val', state.currentUser.readBooksCount);
            saveAppState();
            
            closeAddBookModal();
            showToast("완독한 책이 추가되었습니다!");
        }

        function renderMyPageRecentBooks() {
            const container = document.getElementById('mypage-recent-books');
            if (!container) return;
            container.innerHTML = '';
            
            state.recentBooks.forEach(b => {
                const coverId = `recent-book-cover-${b.id}`;
                const div = document.createElement('div');
                div.className = "shrink-0 w-32 snap-start flex flex-col gap-2 relative group";
                div.innerHTML = `
                    <div class="w-full h-44 ${b.color} rounded-xl shadow-sm border border-brand-ivoryDark flex items-center justify-center p-3 text-center relative overflow-hidden cursor-pointer hover:shadow-md transition-all hover:-translate-y-1" onclick="openReviewModal(${b.id})">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div id="${coverId}" class="absolute inset-0 w-full h-full z-0 opacity-40 mix-blend-overlay"></div>
                        <span class="relative z-10 text-white font-serif font-bold text-sm leading-tight drop-shadow-md break-keep">${b.title}</span>
                        
                        <div class="absolute bottom-2 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <span class="bg-black/50 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-md font-medium flex items-center gap-1 shadow-sm">
                                <i data-lucide="edit-3" class="w-3 h-3"></i> 서평 쓰기
                            </span>
                        </div>
                    </div>
                    <div>
                        <span class="block text-[11px] font-bold text-brand-navy truncate" title="${b.title}">${b.title}</span>
                        <span class="block text-[9px] text-gray-500 truncate">${b.date}</span>
                    </div>
                `;
                container.appendChild(div);

                loadMyPageRecentBookCover(b.title, coverId, b.coverUrl, b);
            });
            lucide.createIcons();
        }

        function parseBookDateToMonth(dateText) {
            const match = String(dateText || '').match(/(20\d{2})[.\-/년\s]+(\d{1,2})/);
            if (!match) return null;
            return `${match[1]}년 ${String(parseInt(match[2], 10))}월`;
        }

        function renderReadingTimeline() {
            const container = document.getElementById('reading-timeline');
            if (!container) return;
            const groups = {};
            state.recentBooks.forEach(book => {
                const key = parseBookDateToMonth(book.date);
                if (!key) return;
                if (!groups[key]) groups[key] = [];
                groups[key].push(book);
            });
            const keys = Object.keys(groups);
            if (keys.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400 text-center py-4">완독일이 있는 책을 추가하면 타임라인이 생성됩니다.</div>`;
                return;
            }
            container.innerHTML = keys.map(month => `
                <div class="relative pl-5 border-l-2 border-brand-sageLight">
                    <div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-brand-sage"></div>
                    <h4 class="font-serif font-bold text-brand-navy text-sm mb-2">${month}</h4>
                    <div class="space-y-2">
                        ${groups[month].map(book => `
                            <div class="bg-brand-ivory/50 border border-brand-ivoryDark rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                                <div class="min-w-0">
                                    <span class="block text-xs font-bold text-brand-navy truncate">${book.title}</span>
                                    <span class="block text-[10px] text-gray-500 truncate">${book.author || '미상'} · ${book.date || ''}</span>
                                </div>
                                <span class="text-[9px] bg-white text-brand-sageDark border border-brand-sageLight px-2 py-0.5 rounded-full font-bold shrink-0">완독</span>
                            </div>`).join('')}
                    </div>
                </div>
            `).join('');
        }

        async function loadMyPageRecentBookCover(bookTitle, coverId, coverUrl = null, bookData = {}) {
            const trimmedTitle = (bookTitle || '').trim();
            const coverEl = document.getElementById(coverId);
            try {
                const imageUrl = await getBookCover({ title: trimmedTitle, author: bookData.author || '', isbn: bookData.isbn || '', coverUrl });
                if (imageUrl) {
                    const img = new Image();
                    img.src = imageUrl;
                    img.referrerPolicy = 'no-referrer';
                    img.onload = () => {
                        const target = document.getElementById(coverId);
                        if (target) {
                            target.innerHTML = `<img src="${imageUrl}" class="w-full h-full object-cover" referrerpolicy="no-referrer">`;
                            target.classList.remove('opacity-40', 'mix-blend-overlay');
                            target.classList.add('opacity-100');
                            const titleSpan = target.nextElementSibling;
                            if (titleSpan) titleSpan.classList.add('hidden');
                        }
                    };
                    img.onerror = () => { if (coverEl) generateTypographyCover(trimmedTitle || 'BOOKMATE', coverEl); };
                    return;
                }
            } catch (e) {
                console.info('[BOOKMATE Cover] 최근 완독 표지 로딩 예외:', trimmedTitle, e);
            }
            if (coverEl) generateTypographyCover(trimmedTitle || 'BOOKMATE', coverEl);
        }

        function renderMyPageRecentArchives() {
            const container = document.getElementById('mypage-recent-archives');
            if (!container) return;
            container.innerHTML = '';

            state.recentArchives.forEach(a => {
                const div = document.createElement('div');
                div.className = "p-4 bg-brand-ivory/50 border border-brand-ivoryDark rounded-xl cursor-pointer hover:bg-white hover:border-brand-sage transition-all shadow-sm flex flex-col justify-between";
                div.setAttribute('onclick', "navigate('archive')");
                div.innerHTML = `
                    <div>
                        <span class="inline-block px-2 py-0.5 bg-brand-navy text-white text-[9px] font-bold rounded mb-2">${a.role}</span>
                        <h4 class="font-bold text-sm text-brand-navy truncate">${a.title}</h4>
                        <span class="block text-[10px] text-gray-500 mt-1">${a.date}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[10px] text-brand-sage font-bold mt-3 border-t border-brand-ivory pt-2">
                        <i data-lucide="message-square-quote" class="w-3.5 h-3.5"></i> ${a.comments}개의 기록된 사유
                    </div>
                `;
                container.appendChild(div);
            });
            lucide.createIcons();
        }

        function saveProfileSettings() {
            const nickEl = document.getElementById('settings-nickname');
            const nick = nickEl ? nickEl.value.trim() : '';
            if (nick.length === 0) { showToast("대화명을 입력해 주세요.", "error"); return; }
            if (nick.length > 6) { showToast("대화명은 최대 6자까지 가능합니다.", "error"); return; }

            state.currentUser.nickname = nick;
            const nextLibrary = document.getElementById('settings-library')?.value || state.currentUser.library;
            const prevLibrary = state.currentUser.library;
            state.currentUser.library = nextLibrary;
            if (prevLibrary && nextLibrary !== prevLibrary) state.currentUser.libraryVerified = false;
            const selected = document.querySelector('input[name="settings-avatar-type"]:checked')?.value || 'moa-1';
            if (selected.startsWith('moa-')) {
                state.currentUser.avatarType = 'moa';
                state.currentUser.avatarId = Number(selected.replace('moa-', '')) || 1;
                state.currentUser.avatarImage = '';
            } else {
                state.currentUser.avatarType = state.currentUser.avatarImage ? 'upload' : 'moa';
                if (!state.currentUser.avatarImage) state.currentUser.avatarId = 1;
            }
            saveAppState();
            updateUIProfileData();
            renderBookmates();
            closeSettingsModal();
            showToast("프로필 설정이 성공적으로 반영되었습니다!");
        }

        function navigate(viewName) {
            if (viewName !== 'booklounge') window.bookmateVisitedLoungeAuthor = '';
            if (typeof isGuestUser === 'function' && isGuestUser()) {
                const gates = {
                    mypage: { icon:'📚', title:'BOOKMATE가 되어, 나만의 서재를 만들어보세요.', desc:'읽은 책과 읽고 싶은 책을 기록하며\n나만의 독서 공간을 채울 수 있습니다.' },
                    archive: { icon:'📖', title:'읽은 책과 생각을 차곡차곡 기록해 보세요.', desc:'BOOKMATE가 되어 독서기록, AI 대화, 감상, 필사를\n나만의 아카이브에 남겨보세요.' },
                    booklounge: { icon:'🏡', title:'독서 활동으로 나만의 공간을 꾸며보세요.', desc:'BOOKMATE가 되어 아이템을 모으고\n나만의 북라운지를 채워보세요.' },
                    bookmates: { icon:'🤝', title:'같은 책을 좋아하는 사람들과 만나보세요.', desc:'BOOKMATE가 되어 독서 친구를 만들고\n책으로 연결되어 보세요.' }
                };
                if (gates[viewName]) {
                    window.bookmateGuestReturnView = (state.currentView && state.currentView !== 'guest-gate') ? state.currentView : 'home';
                    window.bookmateGuestBlurView = viewName;
                    renderGuestGate(gates[viewName]);
                    viewName = 'guest-gate';
                }
            }
            state.currentView = viewName;
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('guest-blur-base');
            });
            const gateView = document.getElementById('view-guest-gate');
            if (gateView) gateView.classList.remove('guest-gate-overlay');
            if (viewName === 'guest-gate' && window.bookmateGuestBlurView) {
                const baseView = document.getElementById(`view-${window.bookmateGuestBlurView}`);
                if (baseView) {
                    baseView.classList.remove('hidden');
                    baseView.classList.add('guest-blur-base');
                }
            }
            const activeView = document.getElementById(`view-${viewName}`);
            if (activeView) {
                activeView.classList.remove('hidden');
                if (viewName === 'guest-gate') activeView.classList.add('guest-gate-overlay');
            }
            updateGuestHomeVisibility();
            if (viewName === 'ai-chat') renderAIRightSidebar();
            if (viewName === 'archive') renderSavedAIArchives();
            if (viewName === 'notifications') renderNotificationsView();
            if (viewName === 'library' && typeof renderMyLibraryHub === 'function') renderMyLibraryHub();
            if (viewName === 'home') {
                renderHomeConnectedData();
                if (typeof renderHomeLibraryMissionPreview === 'function') renderHomeLibraryMissionPreview();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            lucide.createIcons();
        }



function renderNotificationsView() {
    const section = document.getElementById('view-notifications');
    const list = section ? section.querySelector('.divide-y.divide-brand-ivoryDark') : null;
    if (!list) return;
    if (typeof isGuestUser === 'function' && isGuestUser()) {
        list.innerHTML = `
            <div class="p-8 text-center bg-brand-ivory/40">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-white border border-brand-ivoryDark flex items-center justify-center text-2xl mb-4">🔔</div>
                <h3 class="serif-title text-lg font-bold text-brand-navy">가입하면 나의 모임 알림을 받을 수 있어요.</h3>
                <p class="text-xs text-gray-500 leading-relaxed mt-2">독서모임 일정, 채팅 메시지, 방명록, 초대 알림을 한곳에서 확인할 수 있습니다.</p>
                <button onclick="openAuthPage('login')" class="mt-5 px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold shadow">로그인 / 가입하기</button>
            </div>`;
        return;
    }
    const meetingItems = getTodayJoinedGatherings().map((g,index) => ({
        id:`meeting-page-${g.id || index}`, type:'meeting', from:g.leaderNickname || '달빛독서가', gathering:g.title,
        timeLabel:getGatheringScheduleTime(g.schedule) || '예정', detail:`『${g.book || '주제도서'}』 · ${g.method || '독서모임'} · 참여 예정 ${Number(g.membersCount || 0)}명`, time:'오늘', groupId:g.id, book:g.book, isRead:false
    }));
    const items = meetingItems.concat(state.notifications || []);
    if (!items.length) {
        list.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">오늘 확인할 알림이 없습니다.</div>`;
        return;
    }
    list.innerHTML = items.map(n => {
        const view = getNotificationPresentation(n);
        const action = n.type === 'meeting'
            ? `<button onclick="enterMeetingRoom(${JSON.stringify(n.book || '')}, ${JSON.stringify(n.groupId || null)})" class="notification-action-btn primary">모임 확인</button>`
            : n.type === 'invite_rx'
                ? `<div class="notification-actions"><button onclick="handleNotiAction(${Number(n.id)}, 'accept')" class="notification-action-btn primary">수락</button><button onclick="handleNotiAction(${Number(n.id)}, 'decline')" class="notification-action-btn">거절</button></div>`
                : n.type === 'hello'
                    ? `<button onclick="handleNotiAction(${Number(n.id)}, 'reply')" class="notification-action-btn">인사 답하기</button>`
                    : '';
        return `<div class="notification-page-item ${n.isRead ? 'is-read' : ''}">
            <div class="notification-page-avatar">${getNotificationAvatarHTML(n, view.person, 'w-12 h-12')}</div>
            <div class="notification-page-copy"><div class="notification-page-head"><h3>${escapeHTML(view.headline)}</h3><time>${escapeHTML(n.time || '')}</time></div>${view.detail ? `<p>${escapeHTML(view.detail)}</p>` : ''}${action}</div>
            ${n.isRead ? '' : '<i class="notification-page-unread"></i>'}
        </div>`;
    }).join('');
    lucide.createIcons();
}

        function openSettingsModal() {
            normalizeAvatarTarget(state.currentUser);
            document.getElementById('settings-nickname').value = state.currentUser.nickname;
            const libraryEl = document.getElementById('settings-library');
            if (libraryEl) libraryEl.value = state.currentUser.library;
            const radioValue = state.currentUser.avatarType === 'upload' && state.currentUser.avatarImage ? 'upload' : `moa-${state.currentUser.avatarId || 1}`;
            const radio = document.querySelector(`input[name="settings-avatar-type"][value="${radioValue}"]`);
            if (radio) radio.checked = true;
            renderSettingsAvatarPreview();
            document.getElementById('settings-modal').classList.remove('hidden');
        }

        function renderSettingsAvatarPreview() {
            const preview = document.getElementById('settings-avatar-preview');
            if (!preview) return;
            const selected = document.querySelector('input[name="settings-avatar-type"]:checked')?.value || 'moa-1';
            let target = { ...state.currentUser };
            if (selected.startsWith('moa-')) {
                target.avatarType = 'moa';
                target.avatarId = Number(selected.replace('moa-', '')) || 1;
                target.avatarImage = '';
            }
            preview.innerHTML = getAvatarHTML(target, 'w-16 h-16', 'border-4 border-white shadow-sm');
        }

        function triggerAvatarFileInput() {
            const fileInput = document.getElementById('settings-avatar-file');
            if (fileInput) fileInput.click();
        }

        function handleAvatarUpload(input) {
            const file = input.files && input.files[0];
            if (!file) return;
            if (!file.type || !file.type.startsWith('image/')) { showToast('이미지 파일만 첨부할 수 있습니다.', 'error'); input.value = ''; return; }
            if (file.size > 10 * 1024 * 1024) { showToast('10MB 이하의 이미지를 첨부해 주세요.', 'error'); input.value = ''; return; }

            const reader = new FileReader();
            reader.onload = () => {
                const finish = (dataUrl) => {
                    state.currentUser.avatarType = 'upload';
                    state.currentUser.avatarImage = dataUrl;
                    const uploadRadio = document.querySelector('input[name="settings-avatar-type"][value="upload"]');
                    if (uploadRadio) uploadRadio.checked = true;
                    const fileName = document.getElementById('settings-avatar-file-name');
                    if (fileName) fileName.innerText = file.name;
                    renderSettingsAvatarPreview();
                    showToast('첨부한 사진이 미리보기에 반영되었습니다. 설정 저장을 눌러 완료해 주세요.');
                };

                const img = new Image();
                img.onload = () => {
                    const maxSize = 512;
                    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    finish(canvas.toDataURL('image/jpeg', 0.9));
                };
                img.onerror = () => finish(reader.result);
                img.src = reader.result;
            };
            reader.onerror = () => showToast('사진을 불러오지 못했습니다.', 'error');
            reader.readAsDataURL(file);
        }

        function closeSettingsModal() {
            document.getElementById('settings-modal').classList.add('hidden');
        }

        window.renderSettingsAvatarPreview = renderSettingsAvatarPreview;
        window.handleAvatarUpload = handleAvatarUpload;
        window.triggerAvatarFileInput = triggerAvatarFileInput;
        window.saveProfileSettings = saveProfileSettings;
        window.openSettingsModal = openSettingsModal;
        window.closeSettingsModal = closeSettingsModal;

        function showToast(message, type = "success") {
            const container = document.getElementById('toast-container');
            if (!container) return;

            // 팝업과 <dialog>가 열린 상태에서도 토스트가 가려지지 않도록
            // Popover Top Layer를 사용합니다. 지원하지 않는 브라우저에서는
            // 최상위 z-index의 고정 레이어로 자동 대체됩니다.
            const supportsPopover = typeof container.showPopover === 'function';
            if (supportsPopover) {
                try {
                    if (!container.matches(':popover-open')) container.showPopover();
                } catch (error) {
                    container.classList.add('toast-fallback-open');
                }
            } else {
                container.classList.add('toast-fallback-open');
            }

            const toast = document.createElement('div');
            toast.className = `bookmate-toast ${type === 'error' ? 'is-error' : 'is-success'} toast-enter`;
            toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
            icon.className = 'bookmate-toast-icon';

            const copy = document.createElement('span');
            copy.textContent = String(message || '');

            toast.append(icon, copy);
            container.appendChild(toast);
            if (window.lucide?.createIcons) window.lucide.createIcons();

            const dismiss = () => {
                toast.classList.add('is-leaving');
                setTimeout(() => {
                    toast.remove();
                    if (container.childElementCount === 0) {
                        if (supportsPopover) {
                            try {
                                if (container.matches(':popover-open')) container.hidePopover();
                            } catch (error) {
                                container.classList.remove('toast-fallback-open');
                            }
                        } else {
                            container.classList.remove('toast-fallback-open');
                        }
                    }
                }, 240);
            };

            setTimeout(dismiss, type === 'error' ? 3800 : 3000);
        }

        async function loadBookCover(bookTitle, containerId, extraClass = "w-full h-full object-cover rounded-lg", coverUrl = null, bookData = {}) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const title = (bookTitle || bookData.title || bookData.book || '').trim();
            // spinner가 오래 남지 않도록 기본 표지를 먼저 표시하고, 실제 표지가 확인되면 교체합니다.
            generateTypographyCover(title || 'BOOKMATE', container);

            try {
                const imageUrl = await getBookCover({
                    title,
                    author: bookData.author || '',
                    isbn: bookData.isbn || '',
                    coverUrl: coverUrl || bookData.coverUrl || ''
                });

                if (imageUrl) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = title || '책 표지';
                    img.className = extraClass.includes('book-cover-plain') ? extraClass.replace('book-cover-plain', '').trim() : `${extraClass} shadow-md hover:scale-105 transition-transform duration-300`;
                    img.referrerPolicy = 'no-referrer';
                    img.onerror = () => handleImgError(title || 'BOOKMATE', containerId);
                    container.innerHTML = '';
                    container.appendChild(img);
                    return;
                }
            } catch (e) {
                console.info('[BOOKMATE Cover] 표지 로딩 예외, 기본 표지로 대체:', title, e);
            }
            generateTypographyCover(title || 'BOOKMATE', container);
        }

        function handleImgError(bookTitle, containerId) {
            const container = document.getElementById(containerId);
            if (container) generateTypographyCover(bookTitle, container);
        }

        function generateTypographyCover(bookTitle, container) {
            container.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-brand-navy to-brand-navyLight text-white rounded flex flex-col justify-between p-3 text-center shadow-sm relative overflow-hidden">
                    <span class="text-[8px] tracking-wider text-brand-sage uppercase font-semibold">BOOKMATE</span>
                    <span class="font-bold block text-[11px] leading-tight font-serif mt-2 mb-1 line-clamp-3">${bookTitle}</span>
                </div>`;
        }

        function openBookSearchModal(titleTargetId, authorTargetId = null, coverTargetId = null, afterSelect = null) {
            bookSearchContext = { titleTargetId, authorTargetId, coverTargetId, afterSelect };
            const modal = document.getElementById('book-search-modal');
            const input = document.getElementById('book-search-modal-input');
            const titleEl = document.getElementById(titleTargetId);
            if (!modal || !input) return;
            input.value = titleEl ? titleEl.value.trim() : '';
            modal.classList.remove('hidden');
            lucide.createIcons();
            input.focus();
            if (input.value) runBookSearch(input.value);
            else renderBookSearchResults([]);
        }

        function closeBookSearchModal() {
            const modal = document.getElementById('book-search-modal');
            if (modal) modal.classList.add('hidden');
            bookSearchContext = null;
            bookSearchResults = [];
        }

        function handleBookSearchInput(value) {
            clearTimeout(bookSearchTimer);
            bookSearchTimer = setTimeout(() => runBookSearch(value), 350);
        }

        async function runBookSearch(keyword) {
            const resultsEl = document.getElementById('book-search-results');
            const query = (keyword || '').trim();
            if (!resultsEl) return;
            if (!query) {
                renderBookSearchResults([]);
                return;
            }
            resultsEl.innerHTML = `<div class="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Google Books에서 책 정보를 찾는 중...</div>`;
            lucide.createIcons();
            try {
                bookSearchResults = await searchGoogleBooks(query);
                renderBookSearchResults(bookSearchResults);
            } catch (e) {
                resultsEl.innerHTML = `<div class="py-8 text-center text-xs text-red-500">책 검색 중 오류가 발생했습니다. 직접 입력해 주세요.</div>`;
            }
        }

        function renderBookSearchResults(results) {
            const resultsEl = document.getElementById('book-search-results');
            if (!resultsEl) return;
            if (!results || results.length === 0) {
                resultsEl.innerHTML = `<div class="py-8 text-center text-xs text-gray-400">책 제목을 입력하면 실제 도서 정보를 불러옵니다.</div>`;
                return;
            }
            resultsEl.innerHTML = results.map((book, idx) => `
                <button type="button" onclick="selectBookFromSearch(${idx})" class="w-full text-left p-3 rounded-xl border border-brand-ivoryDark hover:border-brand-sage hover:bg-brand-sageLight/30 transition-all flex gap-3 items-start">
                    <div class="w-12 h-16 bg-brand-navy rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-white text-[9px] font-bold text-center">
                        ${book.thumbnail ? `<img src="${book.thumbnail}" class="w-full h-full object-cover" referrerpolicy="no-referrer">` : `<span class="px-1">BOOKMATE</span>`}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="font-bold text-sm text-brand-navy line-clamp-1">${book.title}</div>
                        <div class="text-[11px] text-brand-sageDark font-semibold mt-0.5 line-clamp-1">${book.author}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5 line-clamp-1">${[book.publisher, book.publishedDate].filter(Boolean).join(' · ') || (book.source === 'known' ? 'ISBN 기반 표지 우선 제공' : '출판정보 없음')}</div>
                        <div class="text-[10px] text-gray-500 mt-1 line-clamp-2">${book.description ? book.description.replace(/<[^>]+>/g, '') : '책 소개가 제공되지 않았습니다.'}</div>
                    </div>
                    <span class="shrink-0 text-[10px] font-bold text-white bg-brand-navy px-2 py-1 rounded-lg">선택</span>
                </button>
            `).join('');
        }

        function selectBookFromSearch(index) {
            const book = bookSearchResults[index];
            if (!book || !bookSearchContext) return;
            const titleEl = document.getElementById(bookSearchContext.titleTargetId);
            const authorEl = bookSearchContext.authorTargetId ? document.getElementById(bookSearchContext.authorTargetId) : null;
            if (titleEl) {
                titleEl.value = book.title;
                rememberSelectedBook(bookSearchContext.titleTargetId, book);
            }
            if (authorEl) authorEl.value = book.author;
            if (bookSearchContext.coverTargetId) loadBookCover(book.title, bookSearchContext.coverTargetId, "w-16 h-24 object-cover rounded-lg", book.thumbnail);
            saveAppState();
            if (typeof window[bookSearchContext.afterSelect] === 'function') window[bookSearchContext.afterSelect]();
            else if (typeof updateGatheringPreview === 'function') updateGatheringPreview();
            showToast(`『${book.title}』 책 정보를 불러왔습니다.`);
            closeBookSearchModal();
        }

        function handleMainSearch() {
            const searchInput = document.getElementById('main-book-search');
            const q = searchInput ? searchInput.value.trim() : '';
            if (q.length === 0) { showToast("검색어를 입력해 주세요.", "error"); return; }
            quickSearch(q);
        }

        function quickSearch(bookName) {
            state.searchedQuery = bookName;
            const subSearch = document.getElementById('sub-search-input');
            if (subSearch) subSearch.value = bookName;
            safeSetText('search-title', `『${bookName}』 독서모임 검색 결과`);
            safeSetText('search-desc', `선택하신 주제 키워드 혹은 책과 연계 사유도가 높고 유사 시너지를 낼 수 있는 맞춤 소모임 정보입니다.`);
            navigate('search-results');
            triggerLiveSearch(bookName);
        }

        function triggerLiveSearch(val) {
            const filtered = state.gatherings.filter(g => 
                g.title.toLowerCase().includes(val.toLowerCase()) || 
                g.book.toLowerCase().includes(val.toLowerCase()) ||
                g.desc.toLowerCase().includes(val.toLowerCase()) ||
                g.keywords.some(k => k.toLowerCase().includes(val.toLowerCase()))
            );
            renderGatheringsGrid(filtered);
        }

