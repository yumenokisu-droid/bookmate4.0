        function isGuestUser() { return !!(state.currentUser && state.currentUser.isGuest); }
        function guestAuthCardHTML(title, desc, icon='📚') {
            return `<div class="mt-4 p-5 rounded-2xl bg-white border border-brand-ivoryDark text-center shadow-sm"><div class="text-2xl mb-2">${icon}</div><h4 class="serif-title text-base font-bold text-brand-navy">${title}</h4><p class="text-xs text-gray-500 leading-relaxed mt-2">${String(desc||'').replace(/\n/g,'<br>')}</p><div class="flex justify-center gap-2 mt-4"><button onclick="openAuthPage('login')" class="px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold">로그인</button><button onclick="openAuthPage('signup')" class="px-4 py-2 rounded-xl bg-white border border-brand-ivoryDark text-brand-navy text-xs font-bold">회원가입</button></div></div>`;
        }
        function showGuestActionModal(kind='social') {
            const configs = {
                social: { icon:'👤', title:'BOOKMATE가 되어\n다른 독자와 소통해보세요.', desc:'아래와 같은 기능을 이용할 수 있습니다.', bullets:['북라운지 방문','북메이트 신청','인사하기'] },
                discussion: { icon:'📚', title:'함께 책 이야기를 나눠요.', desc:'로그인 후 감상, 추천, 질문을 자유롭게 남길 수 있습니다.', bullets:['감상 남기기','추천하기','질문하기'] },
                gathering: { icon:'👥', title:'BOOKMATE가 되어 독서모임을 함께 하세요.', desc:'비슷한 독서취향을 가진 사람들과\n책으로 연결됩니다.', bullets:['독서모임 참여','함께 읽기','모임 기록 저장'] }
            };
            const c = configs[kind] || configs.social;
            const modal = document.getElementById('guest-action-modal');
            if (!modal) { showToast((c.title || '').replace(/\n/g,' ')); return; }
            safeSetText('guest-action-icon', c.icon || '👤');
            safeSetText('guest-action-title', c.title || 'BOOKMATE가 되어 함께 이야기해요.');
            safeSetText('guest-action-desc', c.desc || '로그인 후 더 많은 기능을 이용할 수 있습니다.');
            const list = document.getElementById('guest-action-list');
            if (list) list.innerHTML = (c.bullets || []).map(b => `<li class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-brand-sageLight text-brand-sageDark flex items-center justify-center text-[10px]">✓</span><span>${b}</span></li>`).join('');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => { try { lucide.createIcons(); } catch(e) {} }, 0);
        }
        function closeGuestActionModal() {
            const modal = document.getElementById('guest-action-modal');
            if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        }
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeGuestActionModal(); });
        function showGuestJoinPrompt(kind='discussion') {
            const prompts = {
                discussion: { icon:'📚', title:'BOOKMATE가 되어, 함께 책 이야기를 나눠요.', desc:'로그인 후 감상, 추천, 질문을 자유롭게 남길 수 있습니다.' },
                ai: { icon:'🤖', title:'AI 모아와의 대화가 마음에 드셨나요?', desc:'BOOKMATE가 되어 더 많은 대화를 이어가고,\n나만의 독서 기록을 차곡차곡 남겨보세요.' },
                gathering: { icon:'👥', title:'BOOKMATE가 되어 독서모임을 함께 하세요.', desc:'비슷한 독서취향을 가진 사람들과\n책으로 연결됩니다.' },
                lounge: { icon:'🏡', title:'독서 활동으로 나만의 공간을 꾸며보세요.', desc:'BOOKMATE가 되어 아이템을 모으고\n나만의 북라운지를 채워보세요.' },
                archive: { icon:'📖', title:'읽은 책과 생각을 차곡차곡 기록해 보세요.', desc:'BOOKMATE가 되어 독서기록, AI 대화, 감상, 필사를\n나만의 아카이브에 남겨보세요.' },
                bookmates: { icon:'🤝', title:'같은 책을 좋아하는 사람들과 만나보세요.', desc:'BOOKMATE가 되어 독서 친구를 만들고\n책으로 연결되어 보세요.' }
            };
            const p = prompts[kind] || prompts.discussion;
            window.bookmateGuestReturnView = (state.currentView && state.currentView !== 'guest-gate') ? state.currentView : 'home';
            renderGuestGate(p);
            navigate('guest-gate');
        }
        function updateGuestHomeVisibility() {
            const guest = isGuestUser();
            const live = document.getElementById('top-live-meeting-badge');
            if (live) {
                live.classList.add('hidden');
                live.setAttribute('aria-hidden', 'true');
            }
            const schedule = document.getElementById('home-reading-schedule-card');
            if (schedule) {
                schedule.classList.toggle('hidden', guest);
                schedule.setAttribute('aria-hidden', guest ? 'true' : 'false');
            }
            updateHomeBrief();
        }
        function renderGuestGate(config) {
            const c = config || {};
            safeSetText('guest-gate-icon', c.icon || '📚');
            safeSetText('guest-gate-title', c.title || 'BOOKMATE가 되어 함께 이야기해요.');
            safeSetText('guest-gate-desc', c.desc || '로그인 후 더 많은 기능을 이용할 수 있습니다.');
        }
        function returnFromGuestGate() {
            const target = window.bookmateGuestReturnView || 'home';
            window.bookmateGuestReturnView = 'home';
            window.bookmateGuestBlurView = '';
            navigate(target === 'guest-gate' ? 'home' : target);
        }
        window.returnFromGuestGate = returnFromGuestGate;
        function openAuthPage(mode='login') { showAuthScreen(mode); }
        function appendGuestAIJoinCard(scroller) {
            if (!scroller || document.getElementById('guest-ai-join-card')) return;
            const cardWrap = document.createElement('div');
            cardWrap.id = 'guest-ai-join-card';
            cardWrap.className = "max-w-[88%] animate-fadeIn mt-4 mb-2 ml-10";
            cardWrap.innerHTML = `
                <div class="bg-white p-5 rounded-2xl border border-brand-sage/30 shadow-sm relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 text-brand-sage/10"><i data-lucide="sparkles" class="w-24 h-24"></i></div>
                    <div class="relative z-10">
                        <h4 class="serif-title text-base font-bold text-brand-navy">AI 모아와의 대화가 마음에 드셨나요?</h4>
                        <p class="text-xs text-gray-500 leading-relaxed mt-2">BOOKMATE가 되어 더 많은 대화를 이어가고,<br>나만의 독서 기록을 차곡차곡 남겨보세요.</p>
                        <div class="flex gap-2 mt-4">
                            <button onclick="openAuthPage('login')" class="px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold">로그인</button>
                            <button onclick="openAuthPage('signup')" class="px-4 py-2 rounded-xl bg-white border border-brand-ivoryDark text-brand-navy text-xs font-bold">회원가입</button>
                        </div>
                    </div>
                </div>`;
            scroller.appendChild(cardWrap);
            lucide.createIcons();
            scroller.scrollTop = scroller.scrollHeight;
        }

        function isCurrentUserAuthor(author) { return !!(state.currentUser && !state.currentUser.isGuest && state.currentUser.nickname === author); }
        function persistSocialState() { try { if (typeof saveAppState === 'function') saveAppState(); } catch(e) {} }
        function renderSocialComposerState() {
            const guest = isGuestUser();
            const notice = document.getElementById('guest-social-notice');
            if (notice) notice.classList.toggle('hidden', !guest);
            ['social-post-text','social-post-book','social-post-scope'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = guest;
                    el.classList.toggle('opacity-60', guest);
                    el.classList.toggle('cursor-not-allowed', guest);
                    if (guest && id === 'social-post-text') el.placeholder = '회원가입 후 책 이야기를 남길 수 있어요.';
                }
            });
            const submit = document.getElementById('social-post-submit');
            if (submit) {
                submit.disabled = guest;
                submit.classList.toggle('opacity-50', guest);
                submit.classList.toggle('cursor-not-allowed', guest);
                submit.textContent = guest ? '회원 전용' : '올리기';
            }
        }

        function getDiscussionBookMeta(title, author='', cover='', isbn='') {
            const known = (typeof findKnownBook === 'function') ? findKnownBook(title) : null;
            return { title: title || '책 제목 없음', author: author || known?.author || '', isbn: isbn || known?.isbn || '', cover: cover || (typeof getDirectCoverByTitle === 'function' ? getDirectCoverByTitle(title) : '') || known?.fixedCoverUrl || known?.thumbnail || '' };
        }
        function bookCoverFallbackHTML(meta, size='w-20 h-28') { return `<div class="${size} rounded-xl shadow-sm border border-brand-ivoryDark bg-gradient-to-br from-brand-navy to-brand-sage text-white flex items-center justify-center text-[10px] font-bold text-center leading-tight p-2">${String(meta.title||'BOOK').slice(0,8)}</div>`; }
        function bookCoverHTML(meta, size='w-20 h-28') { return meta.cover ? `<img src="${escapeAttr(meta.cover)}" alt="${escapeAttr(meta.title)} 표지" referrerpolicy="no-referrer" class="${size} object-cover rounded-xl shadow-sm border border-brand-ivoryDark bg-brand-ivory">` : bookCoverFallbackHTML(meta, size); }
        function getBookDiscussionStats(title) {
            const key = typeof normalizeTitleKey === 'function' ? normalizeTitleKey(title) : String(title||'');
            const posts = (state.socialPosts||[]).filter(p => (typeof normalizeTitleKey === 'function' ? normalizeTitleKey(p.book||'') : String(p.book||'')) === key);
            return { total: posts.length, 감상: posts.filter(p=>p.category==='감상').length, 추천: posts.filter(p=>p.category==='추천').length, 질문: posts.filter(p=>p.category==='질문').length, 함께: posts.filter(p=>p.category==='함께 읽어요').length, likes: posts.reduce((a,p)=>a+(+p.likes||0),0) };
        }
        function openBookDiscussion(title) { state.bookDiscussionFilter = title; state.socialFilter='전체'; const i=document.getElementById('discussion-global-book-search'); if(i) i.value=title; const r=document.getElementById('discussion-book-search-results'); if(r) r.classList.add('hidden'); renderSocialFeed(); showToast(`『${title}』 이야기만 모아봅니다.`); }
        function clearBookDiscussionFilter() { state.bookDiscussionFilter=''; const i=document.getElementById('discussion-global-book-search'); if(i) i.value=''; renderSocialFeed(); }
        async function searchDiscussionBooks(keyword) {
            const box=document.getElementById('discussion-book-search-results'); if(!box) return; const q=keyword.trim(); if(!q){box.classList.add('hidden'); box.innerHTML=''; return;}
            box.classList.remove('hidden'); box.innerHTML='<div class="p-3 text-xs text-gray-400">책을 찾는 중...</div>'; let books=[]; try{books=await searchGoogleBooks(q);}catch(e){}
            if(!books.length && typeof KNOWN_BOOKS!=='undefined') books=Object.keys(KNOWN_BOOKS).filter(t=>t.includes(q)).map(t=>findKnownBook(t));
            box.innerHTML=(books||[]).slice(0,7).map(b=>{const m=getDiscussionBookMeta(b.title,b.author,b.thumbnail||b.fixedCoverUrl,b.isbn); return `<button onclick="openBookDiscussion('${escapeAttr(m.title)}')" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-brand-ivory text-left transition-colors">${bookCoverHTML(m,'w-10 h-14')}<span class="min-w-0"><b class="block text-xs text-brand-navy line-clamp-1">${m.title}</b><span class="text-[10px] text-gray-500 line-clamp-1">${m.author||'저자 정보 없음'}</span></span></button>`;}).join('') || '<div class="p-3 text-xs text-gray-400">검색 결과가 없습니다.</div>';
        }
        async function searchSocialPostBooks(keyword) {
            const box=document.getElementById('social-post-book-results'); if(!box) return; const q=keyword.trim(); ['author','cover','isbn'].forEach(k=>{const el=document.getElementById(`social-post-book-${k}`); if(el) el.value='';}); if(!q){box.classList.add('hidden'); return;}
            box.classList.remove('hidden'); box.innerHTML='<div class="p-2 text-[10px] text-gray-400">검색 중...</div>'; let books=[]; try{books=await searchGoogleBooks(q);}catch(e){}
            if(!books.length && typeof KNOWN_BOOKS!=='undefined') books=Object.keys(KNOWN_BOOKS).filter(t=>t.includes(q)).map(t=>findKnownBook(t));
            box.innerHTML=(books||[]).slice(0,6).map(b=>{const m=getDiscussionBookMeta(b.title,b.author,b.thumbnail||b.fixedCoverUrl,b.isbn); return `<button onclick="selectSocialPostBook('${escapeAttr(m.title)}','${escapeAttr(m.author)}','${escapeAttr(m.cover)}','${escapeAttr(m.isbn)}')" class="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-brand-ivory text-left">${bookCoverHTML(m,'w-8 h-11')}<span class="min-w-0"><b class="block text-[11px] text-brand-navy line-clamp-1">${m.title}</b><span class="text-[9px] text-gray-500 line-clamp-1">${m.author||'저자 정보 없음'}</span></span></button>`;}).join('') || '<div class="p-2 text-[10px] text-gray-400">검색 결과가 없습니다.</div>';
        }
        function selectSocialPostBook(title, author, cover, isbn) { document.getElementById('social-post-book').value=title; document.getElementById('social-post-book-author').value=author||''; document.getElementById('social-post-book-cover').value=cover||''; document.getElementById('social-post-book-isbn').value=isbn||''; const b=document.getElementById('social-post-book-results'); if(b)b.classList.add('hidden'); showToast(`『${title}』이 연결되었습니다.`); }
        function triggerSocialPostBookSearch(){ const input=document.getElementById('social-post-book'); const q=(input?.value||'').trim(); if(!q){ showToast('검색할 책 제목을 입력해주세요.'); input?.focus(); return; } searchSocialPostBooks(q); }
        function openMemberActionMenu(author,id){
            document.querySelectorAll('.member-action-menu').forEach(el=>el.classList.add('hidden'));
            if(isGuestUser()){
                showGuestActionModal('social');
                return;
            }
            const m=document.getElementById(`member-menu-${id}`); if(m)m.classList.toggle('hidden');
        }
        function findAccountByNickname(nickname){ const users=(typeof getAuthUsers==='function')?getAuthUsers():(typeof DEFAULT_AUTH_USERS!=='undefined'?DEFAULT_AUTH_USERS:[]); return users.find(u=>u.nickname===nickname || u.id===nickname); }
        function normalizeLibraryName(name){ return String(name||'').replace(/\s+/g,'').replace('없음','소속도서관없음'); }
        function getAuthorLibrary(author){ const account=findAccountByNickname(author); return account?.library || ''; }
        function getAuthorLibraryVerified(author){ const account=findAccountByNickname(author); return !!account?.libraryVerified; }
        function getPostLibrary(post){ return post?.library || getAuthorLibrary(post?.author) || ''; }
        function isNoLibrary(name){ const n=normalizeLibraryName(name); return !n || n.includes('소속도서관없음'); }
        function isSameLibrary(a,b){ return !!a && !!b && !isNoLibrary(a) && !isNoLibrary(b) && normalizeLibraryName(a)===normalizeLibraryName(b); }
        function libraryBadgeHTML(author, post){ const library=getPostLibrary(post||{author}); if(!library || isNoLibrary(library)) return ''; const verified=getAuthorLibraryVerified(author); const short=library.replace('도서관','').replace('시립','시립'); return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-sageLight text-brand-sageDark text-[9px] font-bold border border-brand-sage/20">🏛 ${escapeAttr(short)}${verified?' 인증':''}</span>`; }
        function visitMemberLounge(author){ if(isGuestUser()){ showGuestJoinPrompt('lounge'); return; } const account=findAccountByNickname(author); window.bookmateVisitedLoungeAuthor = account ? account.nickname : author; navigate('booklounge'); renderOfficialLounge(); showToast(`${window.bookmateVisitedLoungeAuthor}님의 북라운지로 이동했습니다.`); }
        function memberQuickAction(action,author){ if(action==='북라운지 방문'){ visitMemberLounge(author); return; } showToast(`${author}님에게 '${action}' 기능을 실행했습니다.`);}
        function renderDiscussionWidgets(){renderRecommendationRanking(); renderHotDiscussionBook(); renderDiscussionTags();}
        function renderHotDiscussionBook(){const c=document.getElementById('hot-discussion-book-card'); if(!c)return; const books={}; (state.socialPosts||[]).forEach(p=>{if(p.book)books[p.book]=(books[p.book]||0)+1+(p.comments?.length||0)}); const ent=Object.entries(books).sort((a,b)=>b[1]-a[1])[0]; if(!ent){c.innerHTML='<div class="text-xs text-gray-400">아직 이야기되는 책이 없습니다.</div>';return;} const title=ent[0], m=getDiscussionBookMeta(title), st=getBookDiscussionStats(title); c.innerHTML=`<span class="text-xs font-bold text-brand-navy tracking-wider uppercase block border-b border-brand-ivory pb-2 flex items-center gap-1.5"><i data-lucide="flame" class="w-4 h-4 text-orange-500"></i> 오늘 가장 많이 이야기되는 책</span><button onclick="openBookDiscussion('${escapeAttr(title)}')" class="w-full text-left mt-4 group"><div class="flex gap-3 items-center">${bookCoverHTML(m,'w-16 h-24')}<div class="min-w-0"><h4 class="serif-title font-bold text-brand-navy line-clamp-2 group-hover:text-brand-sage">${title}</h4><p class="text-[10px] text-gray-500 mt-1">${m.author||'저자 정보 없음'}</p><div class="flex gap-1.5 mt-2 flex-wrap text-[10px] font-bold"><span class="bg-brand-sageLight text-brand-sageDark px-2 py-0.5 rounded-full">💬 ${st.total}</span><span class="bg-brand-ivory text-brand-navy px-2 py-0.5 rounded-full">👍 ${st.likes}</span></div></div></div></button>`; lucide.createIcons();}
        function renderDiscussionTags(){const c=document.getElementById('discussion-tag-list'); if(!c)return; const tags=['#소설','#감상','#추천','#질문','#채식주의자','#달러구트','#사피엔스','#독서모임']; c.innerHTML=tags.map(t=>`<button onclick="filterSocialFeed('${t.replace('#','')}')" class="px-3 py-1.5 rounded-full bg-brand-ivory hover:bg-brand-sageLight text-[10px] font-bold text-brand-navy transition-colors">${t}</button>`).join('');}

        function publishSocialPost() {
            if (isGuestUser()) { showGuestJoinPrompt('discussion'); return; }
            const text = document.getElementById('social-post-text').value.trim();
            if(!text) { showToast("내용을 입력해주세요", "error"); return; }
            const selectedScope = document.getElementById('social-post-scope')?.value || '전체';
            if (selectedScope === '내 도서관' && isNoLibrary(state.currentUser?.library)) { showToast('소속도서관 인증 후 내 도서관 글을 남길 수 있어요.'); return; }
            state.socialPosts.unshift({
                id: Date.now(),
                author: state.currentUser.nickname,
                authorInitial: state.currentUser.nickname.charAt(0),
                time: "방금",
                category: state.activeSocialCategory,
                book: document.getElementById('social-post-book').value.trim(),
                bookAuthor: document.getElementById('social-post-book-author')?.value || '',
                bookCover: document.getElementById('social-post-book-cover')?.value || '',
                bookIsbn: document.getElementById('social-post-book-isbn')?.value || '',
                scope: selectedScope,
                visibility: selectedScope === '내 도서관' ? 'library' : 'public',
                library: state.currentUser.library || '',
                text: text,
                likes: 0,
                liked: false,
                showComments: false,
                comments: []
            });
            renderSocialFeed();
            renderDiscussionWidgets();
            document.getElementById('social-post-text').value = '';
            document.getElementById('social-post-book').value = '';
            document.getElementById('social-post-book-author').value = '';
            document.getElementById('social-post-book-cover').value = '';
            document.getElementById('social-post-book-isbn').value = '';
            const scopeEl = document.getElementById('social-post-scope'); if(scopeEl) scopeEl.value = '전체';
        }

        function setSocialCategory(cat) { state.activeSocialCategory = cat; document.querySelectorAll('.cat-chip').forEach(b=>{b.classList.remove('bg-brand-navy','text-white'); b.classList.add('bg-brand-ivory','text-brand-navy');}); const a=document.getElementById(`chip-cat-${cat}`); if(a){a.classList.add('bg-brand-navy','text-white'); a.classList.remove('bg-brand-ivory','text-brand-navy');} }
        function filterSocialFeed(cat) { state.socialFilter = cat; renderSocialFeed(); }
        
        function renderSocialFeed() {
            const container = document.getElementById('social-feed-container');
            if (!container) return;
            container.innerHTML = '';
            let list = [...(state.socialPosts || [])];
            if (state.bookDiscussionFilter) {
                const filterKey = (typeof normalizeTitleKey === 'function') ? normalizeTitleKey(state.bookDiscussionFilter) : state.bookDiscussionFilter;
                list = list.filter(p => ((typeof normalizeTitleKey === 'function') ? normalizeTitleKey(p.book || '') : (p.book || '')) === filterKey);
            }
            // 도서관 전용 글은 같은 소속도서관 회원에게만 보입니다. 게스트는 전체 공개 글만 볼 수 있습니다.
            list = list.filter(p => {
                if ((p.visibility === 'library' || p.scope === '내 도서관') && !isSameLibrary(getPostLibrary(p), state.currentUser?.library)) return false;
                return true;
            });
            if (state.socialFilter && !['전체','최신','인기'].includes(state.socialFilter)) {
                if (['감상','추천','질문','함께 읽어요'].includes(state.socialFilter)) list = list.filter(p => p.category === state.socialFilter);
                else if (state.socialFilter === '내 도서관') {
                    if (isGuestUser() || isNoLibrary(state.currentUser?.library)) { showGuestJoinPrompt('discussion'); return; }
                    list = list.filter(p => isSameLibrary(getPostLibrary(p), state.currentUser.library));
                }
                else list = list.filter(p => (p.book || '').includes(state.socialFilter) || (p.text || '').includes(state.socialFilter));
            }
            if (state.socialFilter === '인기') list.sort((a,b)=>(b.likes||0)-(a.likes||0));
            if (state.socialFilter === '최신') list.sort((a,b)=>(b.id||0)-(a.id||0));
            renderDiscussionWidgets();
            if (list.length === 0) { container.innerHTML = `<div class="p-8 text-center text-gray-400 text-xs bg-white rounded-xl border border-brand-ivoryDark">${state.bookDiscussionFilter ? '『'+state.bookDiscussionFilter+'』에 대한 이야기가 아직 없습니다.' : '게시글이 없습니다. 첫 글의 주인공이 되어보세요!'}</div>`; return; }
            if (state.bookDiscussionFilter) {
                const m=getDiscussionBookMeta(state.bookDiscussionFilter), st=getBookDiscussionStats(state.bookDiscussionFilter); const sum=document.createElement('div'); sum.className='relative bg-gradient-to-br from-brand-sageLight to-white p-5 pr-20 rounded-2xl border border-brand-sage/30 shadow-sm'; sum.innerHTML=`<div class="flex items-start justify-between gap-4 mb-4"><div><p class="text-[10px] font-bold text-brand-sageDark tracking-wider uppercase">이 책의 이야기</p><h3 class="serif-title text-xl md:text-2xl font-bold text-brand-navy leading-tight break-keep mt-1">${m.title}</h3></div><button onclick="clearBookDiscussionFilter()" class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-navy text-white hover:bg-brand-navyLight transition-colors shadow-sm text-[11px] font-bold whitespace-nowrap" title="전체보기로 돌아가기"><i data-lucide="x" class="w-4 h-4"></i> 전체보기</button></div><div class="flex gap-4 items-center">${bookCoverHTML(m,'w-20 h-28 shrink-0')}<div class="min-w-0 flex-1"><p class="text-xs text-gray-500">${m.author||'저자 정보 없음'}</p><div class="flex flex-wrap gap-2 mt-3 text-[10px] font-bold"><span class="bg-white text-brand-navy px-2.5 py-1 rounded-full border border-brand-ivoryDark">💬 전체 ${st.total}</span><span class="bg-white text-brand-sageDark px-2.5 py-1 rounded-full border border-brand-ivoryDark">📖 감상 ${st.감상}</span><span class="bg-white text-amber-700 px-2.5 py-1 rounded-full border border-brand-ivoryDark">💡 추천 ${st.추천}</span><span class="bg-white text-blue-600 px-2.5 py-1 rounded-full border border-brand-ivoryDark">❓ 질문 ${st.질문}</span><span class="bg-white text-purple-700 px-2.5 py-1 rounded-full border border-brand-ivoryDark">👥 함께 ${st.함께||0}</span></div></div></div>`; container.appendChild(sum);
            }
            list.forEach(p => {
                const commentCount = p.comments.length + p.comments.reduce((acc,c)=>acc+(c.replies?c.replies.length:0),0);
                const m=getDiscussionBookMeta(p.book,p.bookAuthor,p.bookCover,p.bookIsbn), st=p.book?getBookDiscussionStats(p.book):{total:0,likes:0};
                const commentsHTML = p.showComments ? `<div class="mt-4 pt-4 border-t border-brand-ivoryDark bg-brand-ivory/30 -mx-6 px-6 pb-2 rounded-b-2xl animate-fadeIn">${p.comments.map(c=>{ const canEditComment=isCurrentUserAuthor(c.author); return `<div class="flex gap-2 mt-4">${getAvatarByName(c.author,'w-7 h-7')}<div class="flex-grow"><div class="bg-white p-3 rounded-xl rounded-tl-none border border-brand-ivoryDark shadow-sm"><div class="flex justify-between items-start mb-1"><span class="font-bold text-xs text-brand-navy">${c.author} <span class="font-normal text-gray-400 ml-1 text-[10px]">${c.time}</span></span>${canEditComment?`<span class="flex gap-1"><button onclick="editSocialComment(${p.id}, ${c.id})" class="text-[10px] font-bold text-gray-400 hover:text-brand-sage">수정</button><button onclick="deleteSocialComment(${p.id}, ${c.id})" class="text-[10px] font-bold text-gray-400 hover:text-red-500">삭제</button></span>`:''}</div><p class="text-xs text-brand-navy">${c.text}</p></div><div class="flex gap-3 mt-1.5 ml-1"><button onclick="likeSocialItem('comment', ${p.id}, ${c.id})" class="text-[10px] font-semibold flex items-center gap-1 ${c.liked?'text-red-500':'text-gray-400 hover:text-brand-sage'}"><i data-lucide="heart" class="w-3 h-3 ${c.liked?'fill-red-500':''}"></i> ${c.likes}</button></div></div></div>`;}).join('')}${isGuestUser()?guestAuthCardHTML('BOOKMATE가 되어, 함께 책 이야기를 나눠요.','로그인 후 감상, 추천, 질문을 자유롭게 남길 수 있습니다.','📚'):`<div class="mt-4 flex gap-2 items-center pb-2">${getAvatarHTML(state.currentUser,'w-8 h-8')}<input id="comment-input-${p.id}" type="text" placeholder="이 이야기에 댓글을 남겨보세요..." class="flex-1 bg-white border border-brand-ivoryDark rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-sage" onkeypress="if(event.key === 'Enter') addSocialComment(${p.id})"><button onclick="addSocialComment(${p.id})" class="bg-brand-navy hover:bg-brand-navyLight text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm">등록</button></div>`}</div>` : '';
                let catColor='bg-[#FAF1D6] text-amber-800', icon='💡'; if(p.category==='감상'){catColor='bg-[#EAF2E8] text-brand-sageDark'; icon='📖';} if(p.category==='질문'){catColor='bg-blue-50 text-blue-600'; icon='❓';} if(p.category==='함께 읽어요'){catColor='bg-purple-50 text-purple-700'; icon='👥';}
                const ownerActions = isCurrentUserAuthor(p.author) ? `<div class="flex items-center gap-1 mr-2"><button onclick="editSocialPost(${p.id})" class="px-2 py-1 rounded-lg bg-brand-ivory text-[10px] font-bold text-brand-navy hover:bg-brand-sageLight">수정</button><button onclick="deleteSocialPost(${p.id})" class="px-2 py-1 rounded-lg bg-red-50 text-[10px] font-bold text-red-500 hover:bg-red-100">삭제</button></div>` : '';
                const div=document.createElement('div'); div.className='bg-white p-6 rounded-2xl border border-brand-ivoryDark shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all';
                div.innerHTML=`${p.book?`<button onclick="openBookDiscussion('${escapeAttr(p.book)}')" class="w-full text-left mb-5 group"><div class="flex gap-4 bg-brand-ivory/40 border border-brand-ivoryDark rounded-2xl p-3 hover:border-brand-sage/40 transition-colors">${bookCoverHTML(m,'w-20 h-28')}<div class="min-w-0 flex-1 py-1"><p class="text-[9px] font-bold text-brand-sageDark tracking-wider uppercase">BOOK DISCUSSION</p><h3 class="serif-title text-lg font-bold text-brand-navy line-clamp-2 group-hover:text-brand-sage">${m.title}</h3><p class="text-[11px] text-gray-500 mt-1">${m.author||'저자 정보 없음'}</p><div class="flex gap-1.5 flex-wrap mt-3 text-[10px] font-bold"><span class="bg-white border border-brand-ivoryDark text-brand-navy px-2 py-0.5 rounded-full">💬 이야기 ${st.total}</span><span class="bg-white border border-brand-ivoryDark text-brand-sageDark px-2 py-0.5 rounded-full">👍 관심 ${st.likes}</span></div></div></div></button>`:''}<div class="flex justify-between items-start mb-3 relative"><button onclick="openMemberActionMenu('${escapeAttr(p.author)}', ${p.id})" class="flex items-center gap-2.5 text-left group">${getAvatarByName(p.author,'w-9 h-9')}<div><h4 class="font-bold text-xs text-brand-navy group-hover:text-brand-sage flex items-center gap-1.5 flex-wrap"><span>${p.author}</span> <span class="text-[9px] text-gray-400 font-normal">${p.time}</span> ${libraryBadgeHTML(p.author,p)} ${(p.scope==='내 도서관'||p.visibility==='library')?'<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-ivory text-brand-navy text-[9px] font-bold border border-brand-ivoryDark">우리 도서관 공개</span>':''}</h4><p class="text-[10px] text-gray-400">닉네임을 누르면 메뉴가 열립니다</p></div></button><div id="member-menu-${p.id}" class="member-action-menu hidden absolute left-0 top-11 bg-white border border-brand-ivoryDark rounded-xl shadow-xl p-1.5 z-30 w-40 text-[11px] font-bold"><button onclick="memberQuickAction('북라운지 방문','${escapeAttr(p.author)}')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-ivory">🏠 북라운지 방문</button><button onclick="memberQuickAction('인사하기','${escapeAttr(p.author)}')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-ivory">👋 인사하기</button><button onclick="memberQuickAction('북메이트 신청','${escapeAttr(p.author)}')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-ivory">🤝 북메이트 신청</button></div><div class="flex items-center gap-1">${ownerActions}<span class="${catColor} text-[10px] px-2.5 py-1 rounded-full font-bold">${icon} ${p.category}</span></div></div><div class="text-sm text-gray-700 leading-relaxed mb-4">${p.text}</div><div class="flex gap-4 text-xs border-t border-brand-ivory pt-3 mt-2"><button onclick="likeSocialItem('post', ${p.id})" class="flex items-center gap-1.5 font-semibold transition-colors ${p.liked?'text-red-500':'text-gray-400 hover:text-brand-navy'}"><i data-lucide="heart" class="w-4 h-4 ${p.liked?'fill-red-500':''}"></i> 좋아요 ${p.likes}</button><button onclick="toggleSocialComments(${p.id})" class="flex items-center gap-1.5 font-semibold text-gray-400 hover:text-brand-navy transition-colors"><i data-lucide="message-circle" class="w-4 h-4"></i> 댓글 ${commentCount}</button></div>${commentsHTML}`;
                container.appendChild(div);
            });
            lucide.createIcons();
        }

        function editSocialPost(postId) {
            const p = state.socialPosts.find(x => x.id === postId);
            if (!p || !isCurrentUserAuthor(p.author)) return;
            const next = prompt('게시글 내용을 수정하세요.', p.text || '');
            if (next === null) return;
            const clean = next.trim();
            if (!clean) { showToast('게시글 내용은 비워둘 수 없습니다.'); return; }
            p.text = clean;
            p.time = '수정됨';
            persistSocialState();
            renderSocialFeed();
            showToast('게시글을 수정했습니다.');
        }

        function deleteSocialPost(postId) {
            const idx = state.socialPosts.findIndex(x => x.id === postId);
            if (idx < 0 || !isCurrentUserAuthor(state.socialPosts[idx].author)) return;
            if (!confirm('이 게시글을 삭제할까요?')) return;
            state.socialPosts.splice(idx, 1);
            persistSocialState();
            renderSocialFeed();
            showToast('게시글을 삭제했습니다.');
        }

        function editSocialComment(postId, commentId) {
            const p = state.socialPosts.find(x => x.id === postId);
            const c = p && p.comments.find(x => x.id === commentId);
            if (!c || !isCurrentUserAuthor(c.author)) return;
            const next = prompt('댓글 내용을 수정하세요.', c.text || '');
            if (next === null) return;
            const clean = next.trim();
            if (!clean) { showToast('댓글 내용은 비워둘 수 없습니다.'); return; }
            c.text = clean;
            c.time = '수정됨';
            persistSocialState();
            renderSocialFeed();
            showToast('댓글을 수정했습니다.');
        }

        function deleteSocialComment(postId, commentId) {
            const p = state.socialPosts.find(x => x.id === postId);
            if (!p) return;
            const idx = p.comments.findIndex(x => x.id === commentId);
            if (idx < 0 || !isCurrentUserAuthor(p.comments[idx].author)) return;
            if (!confirm('이 댓글을 삭제할까요?')) return;
            p.comments.splice(idx, 1);
            persistSocialState();
            renderSocialFeed();
            showToast('댓글을 삭제했습니다.');
        }

        function likeSocialItem(type, postId, commentId = null, replyId = null) {
            if (isGuestUser()) { showGuestJoinPrompt('discussion'); return; }
            const p = state.socialPosts.find(x => x.id === postId);
            if (!p) return;
            
            if (type === 'post') {
                p.liked = !p.liked;
                p.likes += p.liked ? 1 : -1;
            } else if (type === 'comment') {
                const c = p.comments.find(x => x.id === commentId);
                if (c) {
                    c.liked = !c.liked;
                    c.likes += c.liked ? 1 : -1;
                }
            } else if (type === 'reply') {
                const c = p.comments.find(x => x.id === commentId);
                if (c) {
                    const r = c.replies.find(x => x.id === replyId);
                    if (r) {
                        r.liked = !r.liked;
                        r.likes += r.liked ? 1 : -1;
                    }
                }
            }
            persistSocialState();
            renderSocialFeed();
        }

        function toggleSocialComments(postId) {
            const p = state.socialPosts.find(x => x.id === postId);
            if (p) { p.showComments = !p.showComments; renderSocialFeed(); }
        }

        function toggleReplyInput(postId, commentId) {
            const p = state.socialPosts.find(x => x.id === postId);
            if (!p) return;
            const c = p.comments.find(x => x.id === commentId);
            if (c) { c.showReplyInput = !c.showReplyInput; renderSocialFeed(); }
        }

        function addSocialComment(postId) {
            if (isGuestUser()) { showGuestJoinPrompt('discussion'); return; }
            const input = document.getElementById(`comment-input-${postId}`);
            const text = input ? input.value.trim() : '';
            if(!text) return;

            const p = state.socialPosts.find(x => x.id === postId);
            if (p) {
                p.comments.push({
                    id: Date.now(),
                    author: state.currentUser.nickname,
                    text: text,
                    time: "방금",
                    likes: 0,
                    liked: false,
                    showReplyInput: false,
                    replies: []
                });
                persistSocialState();
                renderSocialFeed();
            }
        }

        function addSocialReply(postId, commentId) {
            if (isGuestUser()) { showGuestJoinPrompt('discussion'); return; }
            const input = document.getElementById(`reply-input-${commentId}`);
            const text = input ? input.value.trim() : '';
            if(!text) return;

            const p = state.socialPosts.find(x => x.id === postId);
            if (p) {
                const c = p.comments.find(x => x.id === commentId);
                if (c) {
                    if(!c.replies) c.replies = [];
                    c.replies.push({
                        id: Date.now(),
                        author: state.currentUser.nickname,
                        text: text,
                        time: "방금",
                        likes: 0,
                        liked: false
                    });
                    c.showReplyInput = false;
                    persistSocialState();
                    renderSocialFeed();
                }
            }
        }

        function renderRecommendationRanking() {
            const counts = {};
            (state.socialPosts || []).forEach(p => { if (p.category === '추천' && p.book) { if(!counts[p.book]) counts[p.book]={count:0,likes:0,author:p.bookAuthor||'',cover:p.bookCover||'',isbn:p.bookIsbn||''}; counts[p.book].count++; counts[p.book].likes += Number(p.likes||0); }});
            const sorted = Object.entries(counts).sort((a,b)=>(b[1].count+b[1].likes/10)-(a[1].count+a[1].likes/10)).slice(0,10);
            const container=document.getElementById('realtime-recommendation-list'); if(!container)return; container.innerHTML='';
            if(!sorted.length){ container.innerHTML='<div class="text-xs text-gray-400 py-2">아직 추천된 도서가 없습니다. 첫 추천글을 남겨보세요!</div>'; return; }
            sorted.forEach(([title,data],idx)=>{const m=getDiscussionBookMeta(title,data.author,data.cover,data.isbn); container.innerHTML += `<button class="w-full flex items-center gap-3 text-xs group cursor-pointer bg-brand-ivory/30 p-2.5 rounded-xl border border-transparent hover:border-brand-sage/30 hover:bg-brand-sageLight/20 transition-all text-left" onclick="openBookDiscussion('${escapeAttr(title)}')"><span class="w-5 text-center ${idx<3?'text-brand-sage':'text-gray-400'} font-serif font-bold text-lg">${idx+1}</span>${bookCoverHTML(m,'w-10 h-14')}<span class="min-w-0 flex-1"><b class="block text-brand-navy group-hover:text-brand-sage line-clamp-2">${title}</b><span class="block text-[10px] text-gray-500 mt-0.5">${data.count}회 추천 · 좋아요 ${data.likes}</span></span></button>`;});
            lucide.createIcons();
        }


        // Local login / signup system
        const AUTH_USERS_KEY = 'bookmate_v2_auth_users';
        const AUTH_SESSION_KEY = 'bookmate_v2_auth_session';

        function getManagedDataset() {
            try {
                // 기본 데이터는 항상 data/bookmate-data.js를 기준으로 읽습니다.
                // localStorage의 관리자 데이터가 GitHub 수정본을 덮어쓰지 않도록 했습니다.
                if (window.BOOKMATE_DATA && typeof window.BOOKMATE_DATA === 'object') {
                    return window.BOOKMATE_DATA;
                }
                return null;
            } catch (error) {
                console.warn('[BOOKMATE DATA] 데모 데이터 로드 실패', error);
                return null;
            }
        }

        function getManagedSeedUsers() {
            const fallbackUsers = [
            { id: 'moa01', password: '1234', name: '김도윤', age: 29, gender: '남성', nickname: '달빛독서가', library: '익산시립도서관', libraryVerified: true, tastes: ['소설','에세이','인문'], readingType: '인물의 심리와 관계를 따라 읽는 독자', readingTypeIcon: '📚', avatarId: 1, role: '따뜻한 감상글', readBooksCount: 68, gatheringCount: 3, chatMessagesCount: 1540 },
            { id: 'moa02', password: '1234', name: '이서윤', age: 34, gender: '여성', nickname: '사유올빼미', library: '전북대표도서관', libraryVerified: true, tastes: ['철학','심리','인문'], readingType: '질문을 통해 생각을 확장하는 독자', readingTypeIcon: '🧠', avatarId: 2, role: '깊은 댓글 · 사유형 독자', readBooksCount: 91, gatheringCount: 2, chatMessagesCount: 2120 }
        ];
            const dataset = getManagedDataset();
            const managedAccounts = dataset && (Array.isArray(dataset.accounts) ? dataset.accounts : (Array.isArray(dataset.users) ? dataset.users : []));
            if (managedAccounts && managedAccounts.length) {
                return managedAccounts.map((user, index) => ({
                    avatarType: 'moa',
                    avatarId: ((index % 4) + 1),
                    libraryVerified: true,
                    ...user
                }));
            }
            return fallbackUsers;
        }
        const DEFAULT_AUTH_USERS = getManagedSeedUsers();


        const BASE_ACCOUNT_DATA = JSON.parse(JSON.stringify({
            recentBooks: state.recentBooks || [],
            recentArchives: state.recentArchives || [],
            gatherings: state.gatherings || [],
            notifications: state.notifications || [],
            socialPosts: state.socialPosts || [],
            aiChatHistory: state.aiChatHistory || [],
            currentAIBook: state.currentAIBook || '',
            currentAIMode: state.currentAIMode || 'moa'
        }));


        function deepClone(value, fallback) {
            try {
                if (value === undefined || value === null) return fallback;
                return JSON.parse(JSON.stringify(value));
            } catch (error) {
                return fallback;
            }
        }

        function getManagedAccounts() {
            const dataset = getManagedDataset();
            if (!dataset) return [];
            if (Array.isArray(dataset.accounts)) return dataset.accounts;
            if (Array.isArray(dataset.users)) return dataset.users;
            return [];
        }

        function getManagedAccountById(id) {
            if (!id) return null;
            return getManagedAccounts().find(account => account && account.id === id) || null;
        }

        function getGuestModeData() {
            const dataset = getManagedDataset();
            return (dataset && dataset.guestMode && typeof dataset.guestMode === 'object') ? dataset.guestMode : {};
        }

        function applyGatheringMembership(baseGatherings, accountData) {
            const joinedIds = new Set((accountData && Array.isArray(accountData.joinedGatheringIds)) ? accountData.joinedGatheringIds.map(Number) : []);
            const leaderIds = new Set((accountData && Array.isArray(accountData.leadingGatheringIds)) ? accountData.leadingGatheringIds.map(Number) : []);
            const nickname = accountData?.nickname || state.currentUser?.nickname || '';
            return deepClone(baseGatherings || [], []).map(g => {
                const joined = joinedIds.has(Number(g.id));
                const isLeader = leaderIds.has(Number(g.id));
                if (!Array.isArray(g.members)) g.members = [];
                if (joined && nickname && !g.members.some(m => m.nickname === nickname)) {
                    g.members.push({ nickname, role: isLeader ? 'leader' : 'member' });
                }
                if (isLeader && nickname) {
                    g.members.forEach(m => { if (m.role === 'leader') m.role = 'member'; });
                    const mine = g.members.find(m => m.nickname === nickname);
                    if (mine) mine.role = 'leader';
                    else g.members.unshift({ nickname, role: 'leader' });
                    g.leaderNickname = nickname;
                }
                g.coLeaderNicknames = g.members.filter(m => m.role === 'coLeader').map(m => m.nickname);
                g.membersCount = Array.isArray(g.members) && g.members.length ? g.members.length : g.membersCount;
                return { ...g, joined, isLeader };
            });
        }

        function getAccountLoungeBookmates(accountData) {
            const dataset = getManagedDataset();
            if (accountData && Array.isArray(accountData.loungeBookmates)) return deepClone(accountData.loungeBookmates, []);
            if (dataset && Array.isArray(dataset.loungeBookmates)) return deepClone(dataset.loungeBookmates, []);
            if (typeof DEFAULT_BOOKMATES !== 'undefined') return DEFAULT_BOOKMATES.slice();
            return [];
        }

        function getAccountLoungeProgress(accountData) {
            if (accountData && accountData.loungeProgress && typeof accountData.loungeProgress === 'object') {
                return { ...accountData.loungeProgress };
            }
            return null;
        }

        function applyManagedDatasetToState() {
            const dataset = getManagedDataset();
            if (!dataset) return;

            // 공통 데이터만 기본값으로 반영합니다.
            // 계정별 내서재/아카이브/북라운지는 applyActivityDataForAccount에서 따로 불러옵니다.
            const publicMapping = [
                ['gatherings', 'gatherings'],
                ['notifications', 'notifications'],
                ['socialPosts', 'socialPosts'],
                ['aiChatHistory', 'aiChatHistory']
            ];
            publicMapping.forEach(([key, stateKey]) => {
                if (Array.isArray(dataset[key])) {
                    state[stateKey] = deepClone(dataset[key], []);
                    BASE_ACCOUNT_DATA[stateKey] = deepClone(dataset[key], []);
                }
            });

            // v3.7부터는 currentUser를 데이터 파일에서 직접 관리하지 않습니다.
            // 첫 접속은 initAuthSystem()에서 항상 guest로 시작합니다.
            if (typeof dataset.currentAIBook === 'string') {
                state.currentAIBook = dataset.currentAIBook;
                BASE_ACCOUNT_DATA.currentAIBook = dataset.currentAIBook;
            }
        }

        applyManagedDatasetToState();

        function isSeedAccount(userOrId) {
            const id = typeof userOrId === 'string' ? userOrId : (userOrId && userOrId.id);
            return DEFAULT_AUTH_USERS.some(u => u.id === id);
        }

        function getEmptyGatheringsForNewUser() {
            return (BASE_ACCOUNT_DATA.gatherings || []).map(g => ({ ...g, joined: false, isLeader: false }));
        }

        function applyActivityDataForAccount(user) {
            const isGuest = !user || user.isGuest;
            const accountData = isGuest ? getGuestModeData() : getManagedAccountById(user.id);

            if (isGuest) {
                state.recentBooks = deepClone(accountData.recentBooks, []);
                state.recentArchives = deepClone(accountData.recentArchives, []);
                state.notifications = deepClone(accountData.notifications || BASE_ACCOUNT_DATA.notifications, []);
                state.socialPosts = deepClone(accountData.socialPosts || BASE_ACCOUNT_DATA.socialPosts, []);
                state.aiChatHistory = deepClone(accountData.aiChatHistory, []);
                state.aiChatTurns = 0;
                state.currentAIBook = accountData.currentAIBook || '';
                state.currentAIMode = 'debate';
                state.gatherings = applyGatheringMembership(BASE_ACCOUNT_DATA.gatherings || [], accountData);
                if (typeof loungeBookmates !== 'undefined') loungeBookmates = deepClone(accountData.loungeBookmates, []);
                return;
            }

            const isKnownSeed = isSeedAccount(user.id);
            if (!isKnownSeed && !accountData) {
                state.recentBooks = [];
                state.recentArchives = [];
                state.notifications = [];
                state.socialPosts = deepClone(BASE_ACCOUNT_DATA.socialPosts || [], []);
                state.aiChatHistory = [];
                state.aiChatTurns = 0;
                state.currentAIBook = '';
                state.currentAIMode = 'debate';
                state.gatherings = getEmptyGatheringsForNewUser();
                if (typeof loungeBookmates !== 'undefined') loungeBookmates = [];
                return;
            }

            const data = accountData || {};
            state.recentBooks = deepClone(data.recentBooks, deepClone(BASE_ACCOUNT_DATA.recentBooks || [], []));
            state.recentArchives = deepClone(data.recentArchives, deepClone(BASE_ACCOUNT_DATA.recentArchives || [], []));
            state.gatherings = applyGatheringMembership(BASE_ACCOUNT_DATA.gatherings || [], data);
            state.notifications = deepClone(data.notifications || BASE_ACCOUNT_DATA.notifications, []);
            state.socialPosts = deepClone(data.socialPosts || BASE_ACCOUNT_DATA.socialPosts, []);
            state.aiChatHistory = deepClone(data.aiChatHistory, []);
            state.aiChatTurns = 0;
            state.currentAIBook = data.currentAIBook || BASE_ACCOUNT_DATA.currentAIBook || '';
            state.currentAIMode = normalizeAIModeKey(data.currentAIMode || BASE_ACCOUNT_DATA.currentAIMode || 'debate');
            if (typeof loungeBookmates !== 'undefined') loungeBookmates = getAccountLoungeBookmates(data);
        }

        function refreshAccountBoundViews() {
            updateUIProfileData();
            renderMyPageRecentBooks();
            renderReadingTimeline();
            renderMyPageRecentArchives();
            renderSocialFeed();
            renderDiscussionWidgets();
            renderGatheringsGrid();
            renderMyPageGatherings();
            renderBookmates();
            if (typeof renderOfficialLounge === 'function') renderOfficialLounge();
            if (typeof resetAIChat === 'function') resetAIChat();
        }

        function getAuthUsers() {
            try {
                const raw = localStorage.getItem(AUTH_USERS_KEY);
                const saved = raw ? JSON.parse(raw) : [];
                const customUsers = Array.isArray(saved) ? saved.filter(u => !DEFAULT_AUTH_USERS.some(d => d.id === u.id)) : [];
                return DEFAULT_AUTH_USERS.concat(customUsers);
            } catch(e) {
                return DEFAULT_AUTH_USERS.slice();
            }
        }

        function saveAuthUsers(users) {
            const customUsers = (users || []).filter(u => !DEFAULT_AUTH_USERS.some(d => d.id === u.id));
            localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(customUsers));
        }

        function authUserToCurrentUser(user) {
            return {
                id: user.id,
                name: user.name,
                age: user.age,
                gender: user.gender,
                nickname: user.nickname,
                library: user.library,
                libraryVerified: !!user.libraryVerified,
                tastes: user.tastes || [],
                readingType: user.readingType || '',
                readingTypeIcon: user.readingTypeIcon || '',
                avatarType: user.avatarType || 'moa',
                avatarId: user.avatarId || 1,
                avatarImage: user.avatarImage || '',
                readBooksCount: user.readBooksCount ?? 0,
                gatheringCount: user.gatheringCount ?? 0,
                chatMessagesCount: user.chatMessagesCount ?? 0
            };
        }

        function applyLoggedInUser(user) {
            state.currentUser = authUserToCurrentUser(user);
            applyActivityDataForAccount(state.currentUser);
            try { localStorage.setItem(AUTH_SESSION_KEY, user.id); } catch(e) {}
            saveAppState();
            refreshAccountBoundViews();
            renderDemoAccounts();
            hideAuthScreen();
            updateAuthHeader();
            updateGuestHomeVisibility();
            showToast(`${user.nickname}님, 환영합니다!`);
        }

        function initAuthSystem() {
            renderDemoAccounts();
            // BOOKMATE 2.0: 첫 접속은 항상 게스트 상태로 시작합니다.
            // 이전 세션이 남아 있어도 자동 로그인하지 않고, 사용자가 직접 로그인해야 합니다.
            try { localStorage.removeItem(AUTH_SESSION_KEY); } catch(e) {}
            state.currentUser = createGuestUser();
            applyActivityDataForAccount(state.currentUser);
            saveAppState();
            hideAuthScreen();
            updateAuthHeader();
            updateGuestHomeVisibility();
        }

        function showAuthScreen(mode = 'login') {
            switchAuthMode(mode);
            const el = document.getElementById('auth-screen');
            if (el) el.classList.remove('hidden');
            setTimeout(() => { try { lucide.createIcons(); } catch(e) {} }, 0);
        }

        function hideAuthScreen() {
            const el = document.getElementById('auth-screen');
            if (el) el.classList.add('hidden');
        }

        function createGuestUser() {
            return {
                id: 'guest', name: '게스트', age: '', gender: '선택 안 함', nickname: '게스트 독자',
                library: '소속도서관 없음', libraryVerified: false, tastes: ['소설','에세이'],
                readingType: '둘러보는 독자', readingTypeIcon: '👀', avatarType: 'moa', avatarId: 1, avatarImage: '',
                readBooksCount: 0, gatheringCount: 0, chatMessagesCount: 0, isGuest: true
            };
        }

        function updateAuthHeader() {
            const isLoggedIn = !!localStorage.getItem(AUTH_SESSION_KEY);
            const btn = document.getElementById('auth-header-action');
            if (!btn) return;
            btn.title = isLoggedIn ? '로그아웃' : '로그인';
            btn.innerHTML = isLoggedIn ? '<i data-lucide="log-out" class="w-5 h-5"></i>' : '<i data-lucide="log-in" class="w-5 h-5"></i>';
            try { lucide.createIcons(); } catch(e) {}
        }

        function handleAuthHeaderClick() {
            if (localStorage.getItem(AUTH_SESSION_KEY)) logoutBookmate();
            else showAuthScreen('login');
        }

        function continueAsGuest() {
            localStorage.removeItem(AUTH_SESSION_KEY);
            state.currentUser = createGuestUser();
            applyActivityDataForAccount(state.currentUser);
            saveAppState();
            refreshAccountBoundViews();
            hideAuthScreen();
            updateAuthHeader();
            updateGuestHomeVisibility();
            showToast('게스트로 BOOKMATE를 둘러봅니다.');
        }

        function renderDemoAccounts() {
            // 로그인 화면에서는 가계정 안내를 노출하지 않습니다.
            const list = document.getElementById('demo-account-list');
            if (list) list.innerHTML = '';
        }

        function fillDemoAccount(id, password = '1234') {
            switchAuthMode('login');
            const idEl = document.getElementById('login-id');
            const pwEl = document.getElementById('login-password');
            if (idEl) idEl.value = id;
            if (pwEl) pwEl.value = password || '1234';
        }

        function switchAuthMode(mode) {
            const isLogin = mode === 'login';
            document.getElementById('auth-login-form')?.classList.toggle('hidden', !isLogin);
            document.getElementById('auth-signup-form')?.classList.toggle('hidden', isLogin);
            const loginTab = document.getElementById('auth-login-tab');
            const signupTab = document.getElementById('auth-signup-tab');
            if (loginTab) loginTab.className = `flex-1 py-3 rounded-xl text-sm font-bold ${isLogin ? 'bg-white shadow text-brand-navy' : 'text-gray-500'}`;
            if (signupTab) signupTab.className = `flex-1 py-3 rounded-xl text-sm font-bold ${!isLogin ? 'bg-white shadow text-brand-navy' : 'text-gray-500'}`;
        }

        function handleLoginSubmit(event) {
            event.preventDefault();
            const id = document.getElementById('login-id')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            const user = getAuthUsers().find(u => u.id === id && u.password === password);
            if (!user) { showToast('아이디 또는 비밀번호가 맞지 않습니다.', 'error'); return; }
            applyLoggedInUser(user);
        }

        function resetSignupLibraryVerification() {
            const el = document.getElementById('signup-library-verified');
            const library = document.getElementById('signup-library')?.value || '소속도서관 없음';
            if (!el) return;
            if (library === '소속도서관 없음') {
                el.dataset.verified = 'true';
                el.className = 'mt-2 text-[11px] text-gray-500';
                el.innerText = '소속도서관 없이 가입합니다.';
                return;
            }
            el.dataset.verified = 'false';
            el.className = 'mt-2 text-[11px] text-gray-400';
            el.innerText = '아직 인증되지 않았습니다.';
        }

        function verifySignupLibrary() {
            const el = document.getElementById('signup-library-verified');
            const library = document.getElementById('signup-library')?.value || '소속도서관 없음';
            if (el) {
                el.dataset.verified = 'true';
                el.className = 'mt-2 text-[11px] text-brand-sageDark font-bold';
                el.innerText = library === '소속도서관 없음' ? '소속도서관 없이 가입합니다.' : `${library} 인증 완료`;
            }
            showToast(library === '소속도서관 없음' ? '소속도서관 없이 가입합니다.' : '소속도서관 인증이 완료되었습니다.');
        }

        const TASTE_DIAGNOSIS_QUESTIONS = [
            { key: 'mood', text: '책을 읽고 어떤 기분이 가장 좋으세요?', options: ['힐링', '생각할 거리', '감동', '몰입감', '새로운 지식'] },
            { key: 'genre', text: '영화나 콘텐츠를 고른다면 어떤 장르가 끌리나요?', options: ['로맨스/드라마', '다큐/실화', '미스터리', '판타지/SF', '역사/교양'] },
            { key: 'purpose', text: '책을 읽는 가장 큰 이유는 무엇인가요?', options: ['휴식', '성장', '공부', '대화거리', '상상력'] },
            { key: 'pace', text: '어떤 책이 더 편하게 느껴지나요?', options: ['잔잔한 문장', '깊은 사유', '빠른 전개', '실용적인 내용', '새로운 세계관'] },
            { key: 'tryNew', text: '새로운 분야의 책도 도전하는 편인가요?', options: ['자주 도전', '가끔 도전', '익숙한 분야 선호'] }
        ];
        let tasteDiagnosisStep = 0;
        let tasteDiagnosisAnswers = {};

        function openTasteDiagnosis() {
            tasteDiagnosisStep = 0;
            tasteDiagnosisAnswers = {};
            const modal = document.getElementById('taste-diagnosis-modal');
            if (modal) modal.classList.remove('hidden');
            renderTasteDiagnosisQuestion();
        }

        function closeTasteDiagnosis() {
            const modal = document.getElementById('taste-diagnosis-modal');
            if (modal) modal.classList.add('hidden');
        }

        function resetTasteDiagnosis() {
            tasteDiagnosisStep = 0;
            tasteDiagnosisAnswers = {};
            renderTasteDiagnosisQuestion();
        }

        function renderTasteDiagnosisQuestion() {
            const area = document.getElementById('taste-question-area');
            if (!area) return;
            const q = TASTE_DIAGNOSIS_QUESTIONS[tasteDiagnosisStep];
            if (!q) { renderTasteDiagnosisResult(); return; }
            area.innerHTML = `
                <div class="rounded-2xl border border-brand-ivoryDark bg-white p-5 shadow-sm animate-fadeIn">
                    <div class="text-[11px] font-bold text-brand-sageDark mb-2">질문 ${tasteDiagnosisStep + 1} / ${TASTE_DIAGNOSIS_QUESTIONS.length}</div>
                    <div class="serif-title text-xl font-bold text-brand-navy mb-4">${q.text}</div>
                    <div class="grid sm:grid-cols-2 gap-2">
                        ${q.options.map(opt => `<button type="button" onclick="answerTasteDiagnosis('${q.key}', '${opt.replace(/'/g, "\\'")}')" class="text-left px-4 py-3 rounded-xl bg-brand-ivory/60 hover:bg-brand-sageLight border border-brand-ivoryDark text-sm font-bold text-brand-navy transition-colors">${opt}</button>`).join('')}
                    </div>
                </div>
            `;
        }

        function answerTasteDiagnosis(key, value) {
            tasteDiagnosisAnswers[key] = value;
            tasteDiagnosisStep += 1;
            renderTasteDiagnosisQuestion();
        }

        function analyzeTasteDiagnosis() {
            const a = tasteDiagnosisAnswers;
            let result = { icon: '🌿', type: '감성 탐험가', tags: ['소설','에세이','심리','인문','시'], books: ['달러구트 꿈 백화점', '불편한 편의점', '어서 오세요, 휴남동 서점'], mates: ['달빛독서가', '문장수집가', '사유올빼미'], groups: ['힐링소설 읽기', '문장필사 모임'] };
            if (a.genre === '판타지/SF' || a.purpose === '상상력' || a.pace === '새로운 세계관') result = { icon: '🚀', type: '상상 설계자', tags: ['판타지','SF','소설','추리','과학'], books: ['프로젝트 헤일메리', '해리 포터와 마법사의 돌', '삼체'], mates: ['책읽는고양이', '밤의독서가', '달빛독서가'], groups: ['장르문학 탐험대', 'SF 상상 독서모임'] };
            else if (a.mood === '새로운 지식' || a.purpose === '공부' || a.pace === '실용적인 내용') result = { icon: '🔬', type: '지식 연구자', tags: ['과학','경제','재테크','논픽션','역사'], books: ['도둑맞은 집중력', '사피엔스', '돈의 심리학'], mates: ['밤의독서가', '지혜의등대', '초록책갈피'], groups: ['지식확장 북클럽', '경제교양 읽기'] };
            else if (a.mood === '생각할 거리' || a.pace === '깊은 사유') result = { icon: '🧠', type: '깊은 사색가', tags: ['인문','철학','심리','고전','사회'], books: ['아주 작은 습관의 힘', '참을 수 없는 존재의 가벼움', '소크라테스 익스프레스'], mates: ['사유올빼미', '지혜의등대', '초록책갈피'], groups: ['생각이 깊어지는 인문독서', '질문하는 독서모임'] };
            else if (a.genre === '역사/교양') result = { icon: '🏛', type: '인문 산책가', tags: ['역사','인문','예술','고전','여행'], books: ['역사의 쓸모', '나의 문화유산답사기', '방구석 미술관'], mates: ['초록책갈피', '사유올빼미', '밤의독서가'], groups: ['역사 산책 독서모임', '예술과 인문학 읽기'] };
            else if (a.purpose === '성장') result = { icon: '💼', type: '성장 전략가', tags: ['자기계발','경제','재테크','심리','인문'], books: ['원씽', '돈의 심리학', '아주 작은 습관의 힘'], mates: ['지혜의등대', '밤의독서가', '달빛독서가'], groups: ['성장 독서 루틴', '재테크 입문 북클럽'] };
            return result;
        }

        function renderTasteDiagnosisResult() {
            const area = document.getElementById('taste-question-area');
            if (!area) return;
            const r = analyzeTasteDiagnosis();
            area.innerHTML = `
                <div class="rounded-[1.5rem] border border-brand-sage/30 bg-brand-sageLight/40 p-6 text-center animate-fadeIn">
                    <div class="text-5xl mb-3">${r.icon}</div>
                    <div class="text-xs font-bold text-brand-sageDark tracking-[0.2em] mb-2">진단 결과</div>
                    <div class="serif-title text-3xl font-bold text-brand-navy mb-3">${r.type}</div>
                    <p class="text-sm text-gray-600 leading-relaxed mb-5">모아가 추천하는 취향 키워드를 회원가입 정보에 반영할게요.</p>
                    <div class="flex flex-wrap justify-center gap-2 mb-5">${r.tags.map(t => `<span class="px-3 py-1.5 rounded-full bg-white border border-brand-ivoryDark text-xs font-bold text-brand-navy">#${t}</span>`).join('')}</div>
                    <div class="grid sm:grid-cols-3 gap-3 text-left mb-5">
                        <div class="rounded-2xl bg-white p-4 border border-brand-ivoryDark"><b class="text-xs text-brand-navy">📚 추천도서</b><p class="text-[11px] text-gray-500 mt-2 leading-relaxed">${r.books.join('<br>')}</p></div>
                        <div class="rounded-2xl bg-white p-4 border border-brand-ivoryDark"><b class="text-xs text-brand-navy">😊 추천 북메이트</b><p class="text-[11px] text-gray-500 mt-2 leading-relaxed">${r.mates.join('<br>')}</p></div>
                        <div class="rounded-2xl bg-white p-4 border border-brand-ivoryDark"><b class="text-xs text-brand-navy">🌿 추천 모임</b><p class="text-[11px] text-gray-500 mt-2 leading-relaxed">${r.groups.join('<br>')}</p></div>
                    </div>
                    <button type="button" onclick="applyTasteDiagnosisResult()" class="w-full py-3.5 rounded-xl bg-brand-navy text-white text-sm font-bold hover:bg-brand-navyLight transition-colors">이 취향으로 적용하기</button>
                </div>
            `;
        }

        function applyTasteDiagnosisResult() {
            const r = analyzeTasteDiagnosis();
            document.querySelectorAll('input[name="signup-taste"]').forEach(el => { el.checked = r.tags.includes(el.value); });
            const typeEl = document.getElementById('signup-reading-type');
            const iconEl = document.getElementById('signup-reading-type-icon');
            if (typeEl) typeEl.value = r.type;
            if (iconEl) iconEl.value = r.icon;
            const resultEl = document.getElementById('signup-ai-result');
            if (resultEl) {
                resultEl.classList.remove('hidden');
                resultEl.innerHTML = `<b class="text-brand-navy">${r.icon} ${r.type}</b><div class="text-xs text-gray-500 mt-1">AI가 추천한 취향: ${r.tags.map(t => '#'+t).join(' ')}</div>`;
            }
            closeTasteDiagnosis();
            showToast('AI 독서취향 진단 결과가 적용되었습니다.');
        }

        function handleSignupSubmit(event) {
            event.preventDefault();
            const users = getAuthUsers();
            const id = document.getElementById('signup-id')?.value.trim();
            const password = document.getElementById('signup-password')?.value || '';
            const confirm = document.getElementById('signup-password-confirm')?.value || '';
            const name = document.getElementById('signup-name')?.value.trim();
            const age = Number(document.getElementById('signup-age')?.value || 0);
            const gender = document.getElementById('signup-gender')?.value;
            const nickname = document.getElementById('signup-nickname')?.value.trim();
            const library = document.getElementById('signup-library')?.value;
            const libraryVerified = library === '소속도서관 없음' || document.getElementById('signup-library-verified')?.dataset.verified === 'true';
            const tastes = Array.from(document.querySelectorAll('input[name="signup-taste"]:checked')).map(el => el.value);
            const readingType = document.getElementById('signup-reading-type')?.value || '';
            const readingTypeIcon = document.getElementById('signup-reading-type-icon')?.value || '';

            if (!id || id.length < 4) { showToast('아이디는 4자 이상 입력해 주세요.', 'error'); return; }
            if (users.some(u => u.id === id)) { showToast('이미 사용 중인 아이디입니다.', 'error'); return; }
            if (password.length < 4) { showToast('비밀번호는 4자 이상 입력해 주세요.', 'error'); return; }
            if (password !== confirm) { showToast('비밀번호 확인이 일치하지 않습니다.', 'error'); return; }
            if (!name || !nickname || !age || !gender) { showToast('이름, 나이, 성별, 닉네임을 입력해 주세요.', 'error'); return; }
            if (!libraryVerified) { showToast('소속도서관 인증을 먼저 완료해 주세요.', 'error'); return; }
            if (tastes.length === 0) { showToast('독서취향을 1개 이상 선택해 주세요.', 'error'); return; }

            const user = {
                id, password, name, age, gender, nickname, library, libraryVerified, tastes, readingType, readingTypeIcon,
                avatarType: 'moa', avatarId: ((users.length % 4) + 1), avatarImage: '',
                readBooksCount: 0, gatheringCount: 0, chatMessagesCount: 0,
                missions: createDefaultFirstMissions(), achievements: [], loungeRewards: []
            };
            users.push(user);
            saveAuthUsers(users);
            document.getElementById('auth-signup-form')?.reset();
            resetSignupLibraryVerification();
            applyLoggedInUser(user);
        }

        function createDefaultFirstMissions() {
            return { firstBook:false, firstAI:false, firstReview:false, firstBookmate:false, firstGathering:false };
        }
        const FIRST_MISSION_REWARDS = {
            firstBook: '책장', firstAI: '말풍선', firstReview: '액자', firstBookmate: '화분', firstGathering: '다과세트'
        };
        function ensureUserMissions() {
            if (!state.currentUser || state.currentUser.isGuest) return null;
            if (!state.currentUser.missions) state.currentUser.missions = createDefaultFirstMissions();
            if (!state.currentUser.achievements) state.currentUser.achievements = [];
            if (!state.currentUser.loungeRewards) state.currentUser.loungeRewards = [];
            return state.currentUser.missions;
        }
        function showFirstMissionModal() {
            // BOOKMATE 4.0: 로그인 피로도 완화를 위해 첫 미션 팝업은 자동 노출하지 않습니다.
            // 첫 미션은 추후 '내 서재'의 카드형 미션으로 이동합니다.
            return;
        }
        function closeFirstMissionModal() {
            const modal = document.getElementById('first-mission-modal');
            if (modal) modal.classList.add('hidden');
        }
        function renderFirstMissionButtons() {
            const missions = ensureUserMissions();
            if (!missions) return;
            document.querySelectorAll('.first-mission-btn').forEach(btn => {
                const key = btn.dataset.mission;
                const done = !!missions[key];
                btn.classList.toggle('bg-brand-sageLight', done);
                btn.classList.toggle('border-brand-sage', done);
                const b = btn.querySelector('b');
                if (b && done && !b.textContent.includes('완료')) b.textContent = '✅ ' + b.textContent.replace(/^✅\s*/, '') + ' 완료';
            });
        }
        function completeFirstMission(key) {
            const missions = ensureUserMissions();
            if (!missions || !FIRST_MISSION_REWARDS[key]) return;
            missions[key] = true;
            const reward = FIRST_MISSION_REWARDS[key];
            if (!state.currentUser.loungeRewards.includes(reward)) state.currentUser.loungeRewards.push(reward);
            if (!state.currentUser.achievements.includes(key)) state.currentUser.achievements.push(key);
            saveAppState();
            renderFirstMissionButtons();
            showToast(`${reward} 아이템을 획득했어요!`);
        }

        function logoutBookmate() {
            localStorage.removeItem(AUTH_SESSION_KEY);
            state.currentUser = createGuestUser();
            applyActivityDataForAccount(state.currentUser);
            saveAppState();
            refreshAccountBoundViews();
            updateAuthHeader();
            updateGuestHomeVisibility();
            showToast('로그아웃했습니다. 메인 화면은 게스트 상태로 유지됩니다.');
        }


        function sayHelloToReader(name) { showToast(`${name}님에게 인사를 건넸습니다! 🙋`); }
        window.onload = function() {
            loadAppState();
            initAuthSystem();
            updateGuestHomeVisibility();
            lucide.createIcons();
            updateUIProfileData();
            renderSocialFeed();
            renderDiscussionWidgets();
            renderGatheringsGrid();
            renderMyPageGatherings();
            if (typeof checkGatheringInviteFromUrl === 'function') checkGatheringInviteFromUrl();
            loadBookCover('채식주의자', 'home-question-cover', 'w-14 h-20 object-cover rounded-xl shadow-sm', 'https://image.aladin.co.kr/product/29137/2/cover500/8936434594_2.jpg', { title: '채식주의자', author: '한강', isbn: '9788936434595' });
            preloadBookCovers([...state.recentBooks, ...state.gatherings.map(g => ({ title: g.book, author: g.author, isbn: g.isbn, coverUrl: g.coverUrl }))]);
            
            // AI 채팅 초기화 호출
            state.currentAIMode = normalizeAIModeKey(state.currentAIMode || 'moa');
            resetAIChat(state.currentAIBook || '', state.currentAIMode);
            renderAIHistoryList();
            
            // 아카이브 섹션의 임시 이미지 적용 (미리 정의된 커버 또는 Typography로 표시됨)
            loadBookCover('사피엔스', 'archive-cover-sapiens', 'w-12 h-16 object-cover rounded shadow');
            loadBookCover('데미안', 'archive-cover-demian', 'w-12 h-16 object-cover rounded shadow');
            loadBookCover('도둑맞은 집중력', 'archive-cover-focus', 'w-12 h-16 object-cover rounded shadow');
            loadBookCover('도둑맞은 집중력', 'archive-cover-habits', 'w-12 h-16 object-cover rounded shadow');
        }

