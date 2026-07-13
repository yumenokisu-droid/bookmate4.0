
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

        function updateHomeReadingSchedule() {
            const card = document.getElementById('home-reading-schedule-card');
            if (!card) return;
            const todays = getTodayJoinedGatherings();
            if (!todays.length) {
                card.classList.add('hidden');
                return;
            }
            const g = todays[0];
            const time = getGatheringScheduleTime(g.schedule) || '오늘';
            const titleEl = card.querySelector('h2');
            const descEl = card.querySelector('p.text-xs.sm\\:text-sm, p.text-xs');
            const button = card.querySelector('button');
            if (titleEl) titleEl.innerText = `${time}, 『${g.book}』 ${g.title}`;
            if (descEl) descEl.innerText = `${g.method || '독서모임'} · ${g.platform || g.place || '진행 장소 미정'}에서 진행되는 나의 독서모임입니다.`;
            if (button) button.setAttribute('onclick', `enterMeetingRoom(${JSON.stringify(g.book)})`);
            card.classList.remove('hidden');
        }

        function updateHomeBrief() {
            const avatarEl = document.getElementById('home-brief-avatar');
            if (avatarEl) avatarEl.innerHTML = getAvatarHTML(state.currentUser, 'w-14 h-14', 'border-4 border-white shadow-sm');

            if (typeof isGuestUser === 'function' && isGuestUser()) {
                safeSetText('home-brief-eyebrow', 'GUEST PREVIEW');
                safeSetText('home-brief-title', '👋 게스트 독자님, BOOKMATE를 둘러보세요.');
                safeSetText('home-brief-subtitle', '토론글을 읽고, AI 모아와 책 이야기를 가볍게 체험할 수 있어요.');
                safeSetText('home-stat-1-value', '읽기');
                safeSetText('home-stat-1-label', '토론방 둘러보기');
                safeSetText('home-stat-2-value', '체험');
                safeSetText('home-stat-2-label', 'AI 모아 대화');
                safeSetText('home-stat-3-value', '가입');
                safeSetText('home-stat-3-label', '기록 저장하기');
                const card = document.getElementById('home-reading-schedule-card');
                if (card) card.classList.add('hidden');
                return;
            }

            safeSetText('home-brief-eyebrow', '오늘의 북메이트');
            safeSetText('home-brief-title', `${state.currentUser.nickname}님, 오늘도 북메이트와 함께할 준비 되셨나요?`);
            const joinedCount = state.gatherings ? state.gatherings.filter(g => g.joined).length : 0;
            const todayGatherings = getTodayJoinedGatherings();
            const todayCount = todayGatherings.length;
            safeSetText('home-brief-subtitle', todayCount > 0 ? `오늘은 가입한 독서모임 ${todayCount}개가 예정되어 있어요. 알림에서 자세히 확인할 수 있습니다.` : '오늘 예정된 가입 독서모임은 없습니다. 관심 모임을 찾아보거나 새 모임을 만들어보세요.');
            safeSetText('home-stat-1-value', '7일');
            safeSetText('home-stat-1-label', '독서 연속');
            safeSetText('home-stat-2-value', `${todayCount}개`);
            safeSetText('home-stat-2-label', '오늘 모임');
            safeSetText('home-stat-3-value', `${joinedCount}개`);
            safeSetText('home-stat-3-label', '가입 모임');
            updateHomeReadingSchedule();
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
        }

        function renderMyPageNotifications() {
            const container = document.getElementById('mypage-notifications-list');
            if (!container) return;
            renderSocialComposerState();
            container.innerHTML = '';
            
            const unreadCount = state.notifications.filter(n => !n.isRead).length + (typeof getTodayJoinedGatherings === 'function' ? getTodayJoinedGatherings().length : 0);
            const badge = document.getElementById('notification-badge-count');
            if(badge) {
                badge.innerText = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }

            if (state.notifications.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400 text-center py-4">새로운 알림이 없습니다.</div>`;
                return;
            }

            state.notifications.forEach(n => {
                const isReadClass = n.isRead ? 'opacity-60' : '';
                const dotClass = n.isRead ? '' : '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>';
                
                let actions = '';
                if (n.type === 'hello') {
                    actions = `<button onclick="handleNotiAction(${n.id}, 'reply')" class="mt-2 px-3 py-1.5 bg-brand-sageLight text-brand-sageDark hover:bg-brand-sage/20 rounded-lg text-[10px] font-bold transition-colors">인사 답하기</button>`;
                } else if (n.type === 'invite_rx') {
                    actions = `
                        <div class="flex gap-2 mt-2">
                            <button onclick="handleNotiAction(${n.id}, 'accept')" class="px-3 py-1.5 bg-brand-navy hover:bg-brand-navyLight text-white rounded-lg text-[10px] font-bold transition-colors">수락</button>
                            <button onclick="handleNotiAction(${n.id}, 'decline')" class="px-3 py-1.5 bg-brand-ivory text-brand-navy border border-brand-ivoryDark rounded-lg text-[10px] font-bold transition-colors">거절</button>
                        </div>
                    `;
                } else if (n.type === 'invite_tx') {
                    actions = `<div class="mt-2 text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded inline-block bg-gray-50">${n.status}</div>`;
                }

                let profileName = n.from || n.to;
                let directionText = n.type === 'invite_tx' ? '님에게 초대장을 보냈습니다.' : '님이 메시지를 보냈습니다.';
                if (n.type === 'hello') directionText = '님이 인사를 건넸습니다.';

                const div = document.createElement('div');
                div.className = `p-3 rounded-xl border border-brand-ivoryDark bg-brand-ivory/30 ${isReadClass}`;
                div.innerHTML = `
                    <div class="flex gap-3">
                        <div class="relative shrink-0">
                            ${getAvatarHTML({ name: profileName, avatarType: 'moa', avatarId: n.avatarId || ((n.initial || profileName).charCodeAt(0) % 4) + 1 }, 'w-8 h-8')}
                            ${dotClass}
                        </div>
                        <div class="flex-grow">
                            <div class="flex justify-between items-start">
                                <span class="text-[10px] font-bold text-brand-navy block">${profileName} <span class="font-normal text-gray-500">${directionText}</span></span>
                                <span class="text-[9px] text-gray-400 shrink-0">${n.time}</span>
                            </div>
                            <p class="text-[11px] text-gray-600 mt-1 leading-snug">${n.message || `『${n.gathering}』 모임`}</p>
                            ${actions}
                        </div>
                    </div>
                `;
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
            state.currentUser.library = document.getElementById('settings-library')?.value || state.currentUser.library;
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
                        <p class="text-xs text-gray-500 leading-relaxed mt-2">게스트 계정에서는 예시 알림을 보여주지 않습니다. BOOKMATE가 되어 독서모임 일정, 초대, 새 글 알림을 확인해보세요.</p>
                        <button onclick="openAuthPage('login')" class="mt-5 px-5 py-2.5 bg-brand-navy text-white rounded-xl text-xs font-bold shadow">로그인 / 가입하기</button>
                    </div>`;
                return;
            }
            const todays = getTodayJoinedGatherings();
            const scheduleItems = todays.map(g => {
                const time = getGatheringScheduleTime(g.schedule) || '오늘';
                return `<div class="p-5 flex gap-4 hover:bg-brand-ivory/40 transition-colors"><div class="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0"><i data-lucide="calendar-clock" class="w-5 h-5"></i></div><div><h3 class="font-bold text-sm text-brand-navy">${time} 『${g.book}』 ${g.title} 모임이 있습니다.</h3><p class="text-xs text-gray-500 mt-1">${g.method || '독서모임'} · ${g.platform || g.place || g.schedule}</p><button onclick="enterMeetingRoom(${JSON.stringify(g.book)})" class="mt-3 px-3 py-1.5 bg-brand-navy text-white rounded-lg text-[10px] font-bold">입장하기</button></div></div>`;
            });
            const baseItems = (state.notifications || []).map(n => `<div class="p-5 flex gap-4 hover:bg-brand-ivory/40 transition-colors"><div class="w-10 h-10 rounded-full bg-brand-sageLight text-brand-sageDark flex items-center justify-center shrink-0">${n.initial || '알'}</div><div><h3 class="font-bold text-sm text-brand-navy">${n.message || n.gathering || '새 알림이 있습니다.'}</h3><p class="text-xs text-gray-500 mt-1">${n.time || ''}</p></div></div>`);
            list.innerHTML = (scheduleItems.length || baseItems.length) ? [...scheduleItems, ...baseItems].join('') : `<div class="p-8 text-center text-xs text-gray-400">오늘 확인할 알림이 없습니다.</div>`;
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
            const toast = document.createElement('div');
            const bgColor = type === "error" ? "bg-red-500" : "bg-brand-sageDark";
            toast.className = `${bgColor} text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold toast-enter flex items-center gap-2`;
            toast.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" class="w-4 h-4"></i> ${message}`;
            container.appendChild(toast);
            lucide.createIcons();
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
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

