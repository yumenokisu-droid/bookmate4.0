        function renderGatheringsGrid(listData = state.gatherings) {
            const container = document.getElementById('gatherings-grid-container');
            if (!container) return;
            container.innerHTML = '';
            if (listData.length === 0) {
                container.innerHTML = `<div class="col-span-full py-16 text-center text-gray-500 bg-white rounded border border-brand-ivoryDark">검색 결과가 없습니다.</div>`;
                return;
            }
            listData.filter(g => g.scope !== '비공개' || g.joined || g.invited).forEach(g => {
                const isJoined = g.joined;
                const coverId = `grid-cover-${g.id}`;
                let tagBadges = g.keywords.map(keyword => `<span class="bg-brand-sageLight text-brand-sageDark px-2 py-0.5 rounded-full text-[9px] font-bold">#${keyword}</span>`).join(' ');
                
                let scopeBadgeStyle = (g.scope === "도서관 전용" || g.libraryOnly) ? "bg-amber-100 text-amber-800" : (g.scope === "비공개" ? "bg-gray-100 text-gray-600" : "bg-brand-sageLight text-brand-sageDark");
                let libraryText = g.library ? `(${g.library})` : "";
                const targetText = formatGatheringTarget(g.target);
                const methodDetail = g.method === '온라인' ? (g.platform || 'Bookmate') : (g.place || '장소 미정');

                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl border border-brand-ivoryDark hover:border-brand-sage hover:shadow-lg transition-all relative flex flex-col justify-between space-y-4";
                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="flex justify-between items-start flex-wrap gap-1">
                            <span class="${scopeBadgeStyle} px-2.5 py-0.5 rounded-full text-[10px] font-bold">${g.scope || '공개'} ${libraryText} · ${g.type}</span>
                            ${g.libraryOnly ? `<span class="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">도서관 인증 회원</span>` : ''}
                        </div>
                        <h3 class="serif-title font-bold text-base text-brand-navy mt-1">${g.title}</h3>
                        <div class="flex items-center gap-1.5 text-xs font-semibold text-brand-sageDark bg-brand-sageLight/50 px-2.5 py-1.5 rounded-lg w-fit">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${g.schedule || '일정 미정'}
                        </div>
                        <p class="text-xs text-gray-500 line-clamp-3">${g.desc}</p>
                        <div class="flex flex-wrap gap-1">
                            <span class="bg-white text-brand-navy px-2 py-0.5 rounded-full text-[9px] font-bold border border-brand-ivoryDark">${g.method || '온라인'} · ${methodDetail}</span>
                            ${targetText ? `<span class="bg-white text-brand-navy px-2 py-0.5 rounded-full text-[9px] font-bold border border-brand-ivoryDark">${targetText}</span>` : ''}
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1">${tagBadges}<span class="bg-brand-ivory text-brand-navy px-2 py-0.5 rounded-full text-[9px] font-bold border border-brand-ivoryDark">AI 질문 준비</span></div>
                        <div class="space-y-1">
                            <div class="flex justify-between text-[9px] text-gray-400 font-bold"><span>모집률</span><span>${Math.min(100, Math.round((g.membersCount / g.maxMembers) * 100))}%</span></div>
                            <div class="h-1.5 bg-brand-ivoryDark rounded-full overflow-hidden"><div class="h-full bg-brand-sage rounded-full" style="width:${Math.min(100, Math.round((g.membersCount / g.maxMembers) * 100))}%"></div></div>
                        </div>
                        <div class="bg-brand-ivory/50 p-2.5 rounded-xl border border-brand-ivoryDark flex items-center gap-3">
                            <div class="w-10 h-14 bg-brand-navy rounded overflow-hidden shadow-sm shrink-0 flex items-center justify-center text-white" id="${coverId}">${g.book}</div>
                            <div class="text-[10px] leading-tight flex-grow overflow-hidden">
                                <span class="font-bold block text-brand-navy text-sm mb-1 truncate">${g.book}</span>
                                <span class="text-gray-400 text-xs font-medium truncate block">${g.author}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between border-t border-brand-ivory pt-3">
                        <span class="text-[10px] text-gray-400 flex items-center gap-1"><i data-lucide="users" class="w-3.5 h-3.5 text-brand-sage"></i> ${g.membersCount}/${g.maxMembers}명 참여 중</span>
                        <div class="flex gap-2">
                            ${isJoined ? `<button onclick="enterMeetingRoom('${g.book}')" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">입장</button>` : ''}
                            <button onclick="toggleGatheringMembership(${g.id})" class="px-3 py-1.5 rounded-lg text-xs font-bold ${isJoined ? 'bg-brand-ivory text-gray-500' : 'bg-brand-navy text-white'}">${isJoined ? '가입중' : '함께하기'}</button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
                loadBookCover(g.book, coverId, "w-10 h-14 object-cover rounded", g.coverUrl, g);
            });
            lucide.createIcons();
        }

        function toggleGatheringMembership(id) {
            if (isGuestUser()) { showGuestActionModal('gathering'); return; }
            const target = state.gatherings.find(g => g.id === id);
            if (!target) return;
            if (target.joined) {
                target.joined = false;
                target.membersCount--;
                showToast("독서모임 참여를 철회했습니다.");
            } else {
                if ((target.libraryOnly || target.library) && (target.library || state.currentUser.library) !== state.currentUser.library) {
                    showToast(`[${target.library}] 회원만 가입할 수 있는 모임입니다.`, "error");
                    return;
                }
                if (target.membersCount >= target.maxMembers) { showToast("모임의 정원이 다 찼습니다.", "error"); return; }
                target.joined = true;
                target.membersCount++;
                showToast(`『${target.title}』 모임에 가입되었습니다!`);
            }
            renderGatheringsGrid();
            renderMyPageGatherings();
            updateUIProfileData();
        }

        function renderMyPageGatherings() {
            const container = document.getElementById('mypage-gatherings-list');
            if (!container) return;
            container.innerHTML = '';
            const joined = state.gatherings.filter(g => g.joined);
            if (joined.length === 0) {
                container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-gray-400">현재 참여 신청한 독서모임이 없습니다.</div>`;
                return;
            }
            joined.forEach(g => {
                const coverId = `mypage-g-cover-${g.id}`;
                const div = document.createElement('div');
                div.className = "bg-brand-ivory/50 p-5 rounded-xl border border-brand-ivoryDark shadow-sm";
                div.innerHTML = `
                    <div class="flex gap-4 items-start">
                        <div class="w-12 h-16 bg-brand-navy rounded overflow-hidden shadow shrink-0 text-white text-[8px] flex items-center justify-center" id="${coverId}">${g.book}</div>
                        <div class="space-y-1 overflow-hidden">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-[9px] bg-brand-sageLight text-brand-sageDark px-2 py-0.5 rounded-full font-bold">${g.scope} · ${g.method}</span>
                                ${g.isLeader ? `<span class="text-[9px] bg-brand-navy text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-sm"><i data-lucide="crown" class="w-2.5 h-2.5"></i> 모임장</span>` : ''}
                            </div>
                            <h4 class="font-serif font-bold text-sm text-brand-navy truncate">${g.title}</h4>
                            <p class="text-[10px] text-brand-sageDark font-semibold flex items-center gap-1 mt-0.5"><i data-lucide="clock" class="w-3 h-3"></i> ${g.schedule || '일정 미정'}</p>
                            <p class="text-[10px] text-gray-500 line-clamp-2 mt-1">${g.desc}</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-[10px] border-t border-brand-ivoryDark/50 pt-2.5 mt-3 gap-2">
                        <span class="text-gray-400">대표시작 책: 『${g.book}』</span>
                        <div class="flex gap-2 items-center">
                            ${g.isLeader ? `<button onclick="openEditGatheringModal(${g.id})" class="text-brand-sage font-bold hover:underline mr-1 px-2 py-1 hover:bg-brand-sageLight rounded transition-colors">모임 관리</button>` : ''}
                            <button onclick="enterMeetingRoom('${g.book}')" class="bg-red-600 text-white px-2.5 py-1 rounded font-bold hover:bg-red-700 transition-colors">방 입장</button>
                            ${!g.isLeader ? `<button onclick="toggleGatheringMembership(${g.id})" class="text-red-600 font-bold hover:underline ml-1">탈퇴</button>` : ''}
                        </div>
                    </div>
                `;
                container.appendChild(div);
                loadBookCover(g.book, coverId, "w-12 h-16 object-cover rounded", g.coverUrl, g);
            });
            lucide.createIcons();
        }


        function getCheckedValues(name) {
            return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
        }

        function normalizeTargetValues(values, openValue) {
            if (!values || values.length === 0) return [openValue];
            if (values.includes(openValue) && values.length > 1) return values.filter(v => v !== openValue);
            return values;
        }

        function collectGatheringTarget() {
            const custom = document.getElementById('create-g-target-custom')?.value.trim();
            return {
                age: normalizeTargetValues(getCheckedValues('g-age'), '누구나'),
                gender: normalizeTargetValues(getCheckedValues('g-gender'), '누구나'),
                preference: normalizeTargetValues(getCheckedValues('g-preference'), '제한 없음'),
                custom: custom || ''
            };
        }

        function formatGatheringTarget(target) {
            if (!target) return '';
            const parts = [];
            const age = (target.age || []).filter(v => v && v !== '누구나');
            const gender = (target.gender || []).filter(v => v && v !== '누구나');
            const pref = (target.preference || []).filter(v => v && v !== '제한 없음');
            if (age.length) parts.push(age.join('/'));
            if (gender.length) parts.push(gender.join('/'));
            if (pref.length) parts.push(pref.join('/'));
            if (target.custom) parts.push(target.custom);
            return parts.length ? parts.join(' · ') : '누구나';
        }

        function setToggleButtonState(prefix, activeValue) {
            const groups = {
                scope: { '공개': 'btn-g-scope-pub', '비공개': 'btn-g-scope-priv' },
                type: { '정기모임': 'btn-g-type-reg', '1회성': 'btn-g-type-once' },
                method: { '온라인': 'btn-g-method-on', '오프라인': 'btn-g-method-off' }
            };
            const map = groups[prefix] || {};
            Object.entries(map).forEach(([value, id]) => {
                const btn = document.getElementById(id);
                if (!btn) return;
                btn.className = value === activeValue
                    ? 'flex-1 py-2 rounded-xl text-xs font-bold bg-brand-navy text-white transition-all'
                    : 'flex-1 py-2 rounded-xl text-xs font-bold bg-brand-ivory text-brand-navy hover:bg-brand-ivoryDark transition-all';
            });
            const help = document.getElementById('create-g-scope-help');
            if (help && prefix === 'scope') help.innerText = activeValue === '비공개' ? '비공개 모임은 목록 검색에 노출되지 않고, 초대 링크를 통해서만 가입할 수 있습니다.' : '공개 모임은 목록과 검색에 노출됩니다.';
        }

        function toggleKeywordSelection(keyword) {
            const index = state.createGatheringState.keywords.indexOf(keyword);
            const map = { '자기계발': 'key-tag-자기계발', '인문학': 'key-tag-인문학', '소설/문학': 'key-tag-소설', '사회/과학': 'key-tag-과학', '힐링/에세이': 'key-tag-힐링' };
            const btnEl = document.getElementById(map[keyword]);
            if (index > -1) {
                state.createGatheringState.keywords.splice(index, 1);
                if (btnEl) btnEl.className = "px-3.5 py-2 bg-brand-ivory border border-brand-ivoryDark rounded-xl text-xs font-semibold text-brand-navy";
            } else {
                state.createGatheringState.keywords.push(keyword);
                if (btnEl) btnEl.className = "px-3.5 py-2 bg-brand-navy border border-brand-navy rounded-xl text-xs font-bold text-white";
            }
            updateGatheringPreview();
        }

        function updateGatheringPreview() {
            const name = document.getElementById('create-g-name')?.value.trim() || '새로운 모임 이름';
            const book = document.getElementById('create-g-book')?.value.trim() || '지정 대기 중';
            const target = collectGatheringTarget();
            const targetLabel = formatGatheringTarget(target);
            const libraryOnly = !!document.getElementById('create-g-library-only')?.checked;
            const methodDetail = state.createGatheringState.method === '온라인'
                ? (document.getElementById('create-g-platform')?.value || 'Bookmate')
                : (document.getElementById('create-g-place')?.value.trim() || '장소 미정');

            safeSetText('preview-title', name);
            safeSetText('preview-book', book);
            safeSetText('preview-desc', document.getElementById('create-g-desc')?.value.trim() || '멋진 소개글을 입력해 보세요.');
            safeSetText('preview-tag', `${state.createGatheringState.scope} · ${state.createGatheringState.type}${libraryOnly ? ' · 도서관 인증' : ''}`);
            safeSetText('preview-method', `${state.createGatheringState.method} · ${methodDetail}`);

            const keywordBadge = document.getElementById('preview-keywords-badge');
            if (keywordBadge) {
                const keywordText = state.createGatheringState.keywords.length > 0 ? state.createGatheringState.keywords.map(k=>`#${k}`).join(', ') : '선택 없음';
                keywordBadge.innerText = targetLabel && targetLabel !== '누구나' ? `${keywordText} · 대상: ${targetLabel}` : keywordText;
            }
            const freq = document.getElementById('create-g-freq')?.value || '협의';
            const time = document.getElementById('create-g-time')?.value.trim() || '';
            safeSetText('preview-schedule', time ? `${freq} ${time}` : freq);

            const coverContainer = document.getElementById('preview-cover-container');
            if (coverContainer) {
                if (book.length > 1 && book !== '지정 대기 중') loadBookCover(book, "preview-cover-container", "w-16 h-24 object-cover rounded-lg", getSelectedBookMeta("create-g-book").coverUrl);
                else coverContainer.innerHTML = `<i data-lucide="book" class="w-8 h-8 text-brand-sageDark"></i>`;
                lucide.createIcons();
            }
        }

        function setGatheringToggle(category, value) {
            state.createGatheringState[category] = value;
            setToggleButtonState(category, value);
            updateGatheringPreview();
        }

        function updateGatheringMembers(val) {
            safeSetText('g-member-val', val);
            safeSetText('preview-members', `${val}명`);
        }

        function generateAIDescription() {
            const book = document.getElementById('create-g-book')?.value.trim() || '흥미로운 책';
            showToast("AI가 소개글 초안을 작성 중입니다...");
            setTimeout(() => {
                document.getElementById('create-g-desc').value = `『${book}』을 읽고 다양한 감상을 나누는 모임입니다. 편안하고 자유로운 분위기 속에서 건강한 토론을 지향합니다!`;
                updateGatheringPreview();
            }, 800);
        }

        function submitNewGathering() {
            const title = document.getElementById('create-g-name').value.trim();
            const book = document.getElementById('create-g-book').value.trim();
            const bookMeta = getSelectedBookMeta('create-g-book');
            if (!title || !book) { showToast("모임 이름과 책 제목을 입력해 주세요.", "error"); return; }
            
            const freq = document.getElementById('create-g-freq')?.value || '협의';
            const time = document.getElementById('create-g-time')?.value.trim() || '';
            const scheduleStr = time ? `${freq} ${time}` : freq;

            const newGathering = {
                id: state.gatherings.length + 1,
                title: title,
                book: book,
                author: document.getElementById('create-g-author').value.trim() || bookMeta.author || '미상',
                coverUrl: bookMeta.coverUrl || '',
                publisher: bookMeta.publisher || '',
                publishedDate: bookMeta.publishedDate || '',
                isbn: bookMeta.isbn || '',
                membersCount: 1,
                maxMembers: parseInt(document.getElementById('create-g-members').value),
                scope: state.createGatheringState.scope,
                type: state.createGatheringState.type,
                method: state.createGatheringState.method,
                platform: document.getElementById('create-g-platform')?.value || 'Bookmate',
                place: document.getElementById('create-g-place')?.value.trim() || '',
                schedule: scheduleStr,
                suitability: 100,
                desc: document.getElementById('create-g-desc').value.trim(),
                keywords: [...state.createGatheringState.keywords],
                target: collectGatheringTarget(),
                libraryOnly: !!document.getElementById('create-g-library-only')?.checked,
                library: document.getElementById('create-g-library-only')?.checked ? state.currentUser.library : '',
                shareLink: state.createGatheringState.scope === '비공개' ? `bookmate://gathering/${Date.now()}` : '',
                joined: true,
                isLeader: true
            };
            state.gatherings.push(newGathering);
            saveAppState();
            renderGatheringsGrid();
            renderMyPageGatherings();
            showToast(newGathering.scope === "비공개" ? "비공개 모임이 개설되었습니다. 초대 링크로만 가입할 수 있어요." : "모임이 성공적으로 개설되었습니다!");
            navigate('mypage');
        }

        let currentEditGatheringId = null;

        function openEditGatheringModal(id) {
            const g = state.gatherings.find(x => x.id === id);
            if (!g) return;
            currentEditGatheringId = id;
            
            document.getElementById('edit-g-name').value = g.title;
            document.getElementById('edit-g-schedule').value = g.schedule;
            document.getElementById('edit-g-desc').value = g.desc;
            document.getElementById('edit-g-members').value = g.maxMembers;
            document.getElementById('edit-g-member-val').innerText = g.maxMembers;
            
            document.getElementById('edit-gathering-modal').classList.remove('hidden');
        }

        function closeEditGatheringModal() {
            document.getElementById('edit-gathering-modal').classList.add('hidden');
            currentEditGatheringId = null;
        }

        function updateEditGatheringMembers(val) {
            safeSetText('edit-g-member-val', val);
        }

        function saveGatheringEdit() {
            if (!currentEditGatheringId) return;
            const g = state.gatherings.find(x => x.id === currentEditGatheringId);
            if (g) {
                const title = document.getElementById('edit-g-name').value.trim();
                if(!title) { showToast("모임 이름을 입력해 주세요.", "error"); return; }
                
                g.title = title;
                g.schedule = document.getElementById('edit-g-schedule').value.trim();
                g.desc = document.getElementById('edit-g-desc').value.trim();
                g.maxMembers = parseInt(document.getElementById('edit-g-members').value);
                
                showToast("모임 정보가 수정되었습니다.");
                renderGatheringsGrid();
                renderMyPageGatherings();
            }
            closeEditGatheringModal();
        }

        function enterMeetingRoom(bookTitle = "달러구트 꿈 백화점") {
            navigate('club-meeting');
            const titleEl = document.getElementById('meeting-room-title');
            if (titleEl) {
                titleEl.innerText = `${bookTitle} 사색 소모임`;
                if (titleEl.nextElementSibling) titleEl.nextElementSibling.innerText = `지정도서: 『${bookTitle}』`;
            }
            
            state.meetingState.currentAiStage = 1;
            const scroller = document.getElementById('meeting-chat-scroller');
            if (scroller) {
                scroller.innerHTML = `
                    <div class="bg-[#EAF2E8] p-3 rounded-xl border border-brand-sage/20 text-brand-sageDark font-semibold text-center animate-fadeIn" id="meeting-welcome-banner">
                        어서오세요! LIVE 모임방에 입장하셨습니다. 하단의 [모임 시작하기 🚀] 버튼을 눌러보세요.
                    </div>
                    <div class="bg-brand-ivory border border-brand-ivoryDark p-4 rounded-xl space-y-2 flex gap-3 items-start hidden" id="facilitator-prompt-box">
                        <div class="w-12 h-16 rounded overflow-hidden shadow-sm shrink-0 bg-brand-navy text-[8px] text-white flex items-center justify-center" id="meeting-ai-quest-cover-mini">달러구트</div>
                        <div class="space-y-1">
                            <span class="text-[10px] font-bold text-brand-sageDark block flex items-center gap-1"><i data-lucide="bot" class="w-3.5 h-3.5"></i> AI 퍼실리테이터 전담 리드</span>
                            <p class="font-serif font-bold text-brand-navy text-xs leading-relaxed" id="meeting-ai-question">Q1. 첫 번째 질문입니다...</p>
                        </div>
                    </div>
                    <div class="flex justify-center gap-2" id="meeting-action-triggers">
                        <button onclick="triggerFacilitatorIntro()" class="bg-brand-navy hover:bg-brand-navyLight text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md">모임 시작하기 🚀</button>
                    </div>
                `;
            }
            safeSetText('meeting-ai-stage-label', '대기 중...');
            showToast("실시간 토론방에 입장했습니다.");
            lucide.createIcons();
            loadBookCover(bookTitle, "meeting-ai-quest-cover-mini", "w-12 h-16 object-cover rounded shadow-sm");
        }

        function triggerFacilitatorIntro() {
            state.meetingState.currentAiStage = 1;
            renderFacilitatorDialogue();
        }

        function renderFacilitatorDialogue() {
            const scroller = document.getElementById('meeting-chat-scroller');
            if (!scroller) return;
            const welcome = document.getElementById('meeting-welcome-banner');
            if(welcome) welcome.classList.add('hidden');
            
            const data = meetingDialogueScript[state.meetingState.currentAiStage];
            if (!data) return;

            const promptBox = document.getElementById('facilitator-prompt-box');
            if (promptBox) {
                promptBox.classList.remove('hidden');
                safeSetText('meeting-ai-question', data.message);
            }
            safeSetText('meeting-ai-stage-label', data.stageLabel);
            
            const actions = document.getElementById('meeting-action-triggers');
            if (actions) actions.innerHTML = data.actions;

            const bubble = document.createElement('div');
            bubble.className = "flex gap-3 max-w-[85%] animate-fadeIn mt-4 border-l-4 border-brand-sage pl-3 bg-brand-sageLight/30 p-2.5 rounded-r-xl";
            bubble.innerHTML = `
                ${getAIAvatarHTML('w-7 h-7')}
                <div class="space-y-1"><p class="text-xs text-brand-navy whitespace-pre-line">${data.message}</p></div>
            `;
            scroller.appendChild(bubble);
            scroller.scrollTop = scroller.scrollHeight;

            const currentStage = state.meetingState.currentAiStage;
            const peerAnswers = {
                2: [
                    { author: "사유올빼미", text: "저는 하늘을 훨훨 나는 꿈을 꾸면서 스트레스를 날려버리고 싶네요!", delay: 2500 },
                    { author: "지혜의등대", text: "요즘 너무 피곤해서... 아무도 없는 고요한 숲속에서 푹 쉬는 꿈을 사고 싶습니다 🌿", delay: 5000 }
                ],
                4: [
                    { author: "한줄수집가", text: "저는 예전에 기르던 반려견을 다시 만나는 꿈을 비싸게 주고라도 사고 싶어요. ㅠㅠ", delay: 3000 },
                    { author: "지혜의등대", text: "일상의 소소한 기쁨을 다시금 깨닫게 해주는 평범하고 따뜻한 하루의 꿈도 좋겠네요.", delay: 6000 }
                ],
                5: [
                    { author: "사유올빼미", text: "트라우마를 극복하려면 결국 한 번은 정면으로 마주해야 하니까, 악몽도 충분히 가치가 있다고 봅니다.", delay: 3500 },
                    { author: "한줄수집가", text: "저는 조금 무섭긴 하지만... 그래도 극복의 계기가 된다면 용기를 내볼 것 같아요.", delay: 6500 }
                ],
                6: [
                    { author: "지혜의등대", text: "저는 다가올 미래에 대한 설렘과 목표가 절 움직이게 하는 것 같아요. 새로운 기대감이 중요하죠.", delay: 3000 },
                    { author: "사유올빼미", text: "저는 반대로 제가 지나온 과거의 발자취를 보며 '잘 해왔다'는 위안에서 힘을 많이 얻습니다.", delay: 6000 }
                ]
            };

            if (peerAnswers[currentStage]) {
                peerAnswers[currentStage].forEach(peer => {
                    setTimeout(() => {
                        const sc = document.getElementById('meeting-chat-scroller');
                        if(!sc) return;
                        const peerBubble = document.createElement('div');
                        peerBubble.className = "space-y-1 text-xs text-left mt-3 animate-fadeIn";
                        peerBubble.innerHTML = `
                            <span class="font-bold text-brand-navy block">${peer.author} <span class="text-[9px] text-gray-400 font-normal">방금</span></span>
                            <p class="text-gray-700 bg-brand-ivory inline-block px-3 py-2 rounded-xl border border-brand-ivoryDark text-left">${peer.text}</p>
                        `;
                        sc.appendChild(peerBubble);
                        sc.scrollTop = sc.scrollHeight;
                    }, peer.delay);
                });
            }
        }

        function proceedToNextStage() {
            state.meetingState.currentAiStage++;
            if (state.meetingState.currentAiStage > 7) state.meetingState.currentAiStage = 1;
            renderFacilitatorDialogue();
            updateLiveMicStatusList();
        }

        function updateLiveMicStatusList() {
            const stage = state.meetingState.currentAiStage;
            const owl = document.getElementById('mic-status-사유올빼미');
            const lh = document.getElementById('mic-status-지혜의등대');
            if(owl && lh) {
                if(stage === 4 || stage === 5 || stage === 6) owl.innerHTML = `<span class="bg-red-50 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded animate-pulse">대답 중</span>`;
                else owl.innerHTML = `<span class="text-gray-400 text-[9px]">경청 중</span>`;
            }
        }

        function sendMeetingChatMessage() {
            const input = document.getElementById('meeting-chat-input');
            const scroller = document.getElementById('meeting-chat-scroller');
            const txt = input.value.trim();
            if(!txt || !scroller) return;
            const div = document.createElement('div');
            div.className = "space-y-1 text-xs text-right mt-3 animate-fadeIn";
            div.innerHTML = `<span class="font-bold text-brand-navy block">${state.currentUser.nickname} (나)</span>
                             <p class="text-white bg-brand-navy inline-block px-3 py-2 rounded-xl text-left">${txt}</p>`;
            scroller.appendChild(div);
            scroller.scrollTop = scroller.scrollHeight;
            input.value = '';

            setTimeout(() => {
                const peerBubble = document.createElement('div');
                peerBubble.className = "space-y-1 text-xs text-left mt-2 animate-fadeIn";
                const peers = ["한줄수집가", "지혜의등대", "사유올빼미"];
                const peerName = peers[Math.floor(Math.random() * peers.length)];
                
                const reactions = [
                    `${state.currentUser.nickname}님의 생각에 깊이 공감합니다! 좋은 시각이네요.`,
                    "오, 그렇게 생각할 수도 있겠군요. 흥미로운 관점입니다.",
                    "저도 책 읽으면서 정확히 그 부분에서 멈칫했어요. 맞습니다.",
                    "말씀해주신 부분 덕분에 제 생각도 더 또렷하게 정리가 되네요. 감사합니다!",
                    "완전 동의합니다. 고개가 저절로 끄덕여지네요.",
                    "그 의견 들으니까 책을 다시 한 번 읽어보고 싶어지네요."
                ];
                const reaction = reactions[Math.floor(Math.random() * reactions.length)];
                
                peerBubble.innerHTML = `
                    <span class="font-bold text-brand-navy block">${peerName} <span class="text-[9px] text-gray-400 font-normal">방금</span></span>
                    <p class="text-gray-700 bg-brand-ivory inline-block px-3 py-2 rounded-xl border border-brand-ivoryDark text-left">${reaction}</p>
                `;
                scroller.appendChild(peerBubble);
                scroller.scrollTop = scroller.scrollHeight;
            }, 1500 + Math.random() * 1000);
        }

        function meetingUserAct(actionKey) {
            const scroller = document.getElementById('meeting-chat-scroller');
            if(!scroller) return;

            let userSpeech = '';
            let peerResponses = [];

            if (actionKey === 'greet') {
                userSpeech = `안녕하세요! 반갑습니다. ${state.currentUser.nickname}입니다. 오늘 따뜻한 대화 나누었으면 좋겠네요. 😊`;
                peerResponses = [
                    { author: "사유올빼미", text: "환영합니다! 저번 모임에서 남기신 서평 요약 잘 읽었습니다." },
                    { author: "지혜의등대", text: "반갑습니다! 오늘은 소설이라 마음 가볍게 참여했네요." }
                ];
            } else if (actionKey === 'ice1' || actionKey === 'ice2') {
                userSpeech = actionKey === 'ice1' ? "하늘을 자유롭게 날아다니는 상쾌한 꿈을 다시 꾸고 싶어요." : "만개한 귤나무 아래서 은은한 과수원 향기를 느끼는 꿈이 인상 깊었어요.";
                peerResponses = [
                    { author: "한줄수집가", text: `${state.currentUser.nickname}님의 상상만으로도 온몸이 이완되는 포근한 기분입니다.` }
                ];
            } else if (actionKey === 'p1_opt1' || actionKey === 'p1_opt2') {
                userSpeech = actionKey === 'p1_opt1' ? "그리운 사람과 꿈속에서마저 정다운 안부를 묻는 가치를 사고 싶습니다." : "스트레스 없이 가볍게 잠들어 온전히 내 마음의 피로를 비우는 꿈을 희망해요.";
                peerResponses = [
                    { author: "사유올빼미", text: "저도요. 꿈 백화점에서 파는 무형의 감정이 현실을 지탱하는 든든한 위로가 되어 주니까요." }
                ];
            } else if (actionKey === 'p2_opt1' || actionKey === 'p2_opt2') {
                userSpeech = actionKey === 'p2_opt1' ? "두려운 대상을 회피하기보다는 꿈속에서나마 직면할 기회를 얻는 것이 극복의 첫걸음이라고 생각해요." : "현실의 고통만으로도 벅차기에 무의식 속에서는 순수히 해방될 수 있는 위로만을 바라는 마음입니다.";
                peerResponses = [
                    { author: "지혜의등대", text: `${state.currentUser.nickname}님의 의견에 동의합니다. 결국 내가 한 단계 성장했다는 증명이자 백신 역할을 해주는 셈이죠.` }
                ];
            } else if (actionKey === 'p3_opt1' || actionKey === 'p3_opt2') {
                userSpeech = actionKey === 'p3_opt1' ? "내가 성실히 극복하고 쌓아온 과거의 위로와 수용에서 깊은 전진 에너지를 얻습니다." : "앞으로 가야 할 미지의 가능성과 새로운 설렘이 저를 앞으로 움직이게 합니다.";
                peerResponses = [
                    { author: "사유올빼미", text: "맞아요, 그 두 가지 에너지가 교차하며 비로소 중심을 잡아나가는 것 같습니다." }
                ];
            }

            const div = document.createElement('div');
            div.className = "space-y-1 text-xs text-right mt-3 animate-fadeIn";
            div.innerHTML = `<span class="font-bold text-brand-navy block">${state.currentUser.nickname} (나) <span class="text-[9px] text-gray-400 font-normal">방금</span></span>
                             <p class="text-white bg-brand-navy inline-block px-3 py-2 rounded-xl text-left">${userSpeech}</p>`;
            scroller.appendChild(div);
            scroller.scrollTop = scroller.scrollHeight;

            peerResponses.forEach((peer, idx) => {
                setTimeout(() => {
                    const peerBubble = document.createElement('div');
                    peerBubble.className = "space-y-1 text-xs text-left mt-2 animate-fadeIn";
                    peerBubble.innerHTML = `
                        <span class="font-bold text-brand-navy block">${peer.author} <span class="text-[9px] text-gray-400 font-normal">방금</span></span>
                        <p class="text-gray-700 bg-brand-ivory inline-block px-3 py-2 rounded-xl border border-brand-ivoryDark text-left">${peer.text}</p>
                    `;
                    scroller.appendChild(peerBubble);
                    scroller.scrollTop = scroller.scrollHeight;
                }, 1200 + (idx * 1500));
            });
        }

        function triggerVoiceSpeechSimulation() {
            showToast("마이크 입력을 듣고 있습니다...", "success");
            setTimeout(() => {
                const input = document.getElementById('meeting-chat-input');
                if(input) { input.value = "저도 깊은 공감을 느꼈습니다."; showToast("음성이 텍스트로 변환되었습니다."); }
            }, 1500);
        }

        function toggleMyMic() {
            state.meetingState.myMicOn = !state.meetingState.myMicOn;
            const badge = document.getElementById('my-mic-status-badge');
            if (badge) {
                if(state.meetingState.myMicOn) { badge.className="bg-brand-sageLight text-brand-sageDark text-[9px] px-2.5 py-1 rounded-md font-bold"; badge.innerText="마이크 켜짐"; }
                else { badge.className="bg-red-100 text-red-600 text-[9px] px-2.5 py-1 rounded-md font-bold"; badge.innerText="음소거"; }
            }
        }

        function toggleMyCam() {
            state.meetingState.myCamOn = !state.meetingState.myCamOn;
            showToast(state.meetingState.myCamOn ? "카메라가 켜졌습니다." : "카메라가 꺼졌습니다.");
        }

        function exitClubMeeting() {
            navigate('home');
            showToast("토론방에서 퇴장하였습니다.");
        }

        function archiveAndEndMeeting() {
            showToast("회의 요약본이 안전하게 아카이브에 저장되었습니다.");
            navigate('archive');
        }

        function triggerGatheringKeepVote() {
            showToast("회원들에게 '유지 여부 투표'를 발송했습니다.");
        }

        function triggerMeetingAiAssist(cmd) {
            showToast(cmd === 'summary' ? "AI가 핵심 사유를 요약 중입니다." : "AI가 반대 관점을 제안합니다.");
        }

        function handleMeetingChatKeyPress(e) {
            if (e.key === 'Enter') sendMeetingChatMessage();
        }

