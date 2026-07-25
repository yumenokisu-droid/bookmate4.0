        // --- AI 1:1 토론방 (Gemini API 연동 로직) --- //

        const AI_CHAT_STORAGE_KEY = 'bookmate_v2_2_ai_partner_chats';
        const AI_MODES = {
            moa: {
                icon:'📚', avatar: AI_AVATAR_SRC, title:'AI 독서파트너 모아', desc:'책을 읽는 모든 순간, 함께 생각하고 대화하는 AI입니다.', placeholder:'책 제목이나 궁금한 점을 편하게 적어보세요.', badge:'AI 독서파트너',
                prompt:`너는 BOOKMATE의 AI 독서파트너 모아다. 사용자가 읽는 책, 감상, 질문, 독서모임 준비, 생각 정리, 책 추천을 자연스럽게 돕는다. 기능 모드를 나누어 말하지 말고 하나의 독서 파트너처럼 대화한다. 사용자가 책의 존재 여부, 제목, 작가, 줄거리 같은 사실 확인을 요청하면 먼저 정확히 확인하거나 필요한 질문을 한다. 사용자의 의견을 존중하되 무조건 동의하지 말고, 책 속 장면·인물·주제·사용자의 경험을 연결해 대화를 이어간다. 마지막에는 독서가 계속 이어질 수 있는 짧은 질문이나 제안을 덧붙인다.`
            }
        };

        const AI_MODE_ALIASES = { facilitator:'moa', prepare:'moa', recommend:'moa', debate:'moa', organize:'moa', coaching:'moa', curator:'moa', moa:'moa' };
        function escapeHTML(value) { return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
        function normalizeAIModeKey(modeKey) { return AI_MODE_ALIASES[modeKey] || (AI_MODES[modeKey] ? modeKey : 'moa'); }
        function getAIMode() { const key = normalizeAIModeKey(state.currentAIMode || 'moa'); return AI_MODES[key] || AI_MODES.moa; }
        function loadAIChats() { try { return JSON.parse(localStorage.getItem(AI_CHAT_STORAGE_KEY) || '[]'); } catch(e) { return []; } }
        function saveAIChats(list) { localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(list || [])); renderAIHistoryList(); }

        function renderAIModeSelector() {
            const input = document.getElementById('ai-chat-input');
            if (input) input.placeholder = '책 제목이나 궁금한 점을 편하게 적어보세요.';
            const badge = document.getElementById('ai-current-mode-badge');
            if (badge) badge.textContent = 'AI 독서 파트너';
            updateAIHeaderAvatar();
            updateAIHeaderStatus();
        }

        function setAIMode(modeKey) {
            const prev = normalizeAIModeKey(state.currentAIMode || 'moa');
            state.currentAIMode = normalizeAIModeKey(modeKey);
            renderAIModeSelector();
            renderAIBookAnalysisCard(state.currentAIBook);
            const mode = getAIMode();
            const headerBookEl = document.getElementById('ai-chat-header-book');
            if (headerBookEl) headerBookEl.innerText = `${state.currentAIBook ? `『${state.currentAIBook}』` : 'AI 독서 파트너'}`;
            showToast(`${mode.title}로 전환했습니다.`);
            if (state.aiSetupStage === 'askMode') {
                setAISetupStage('chat');
                const msg = getModeStartMessage(state.currentAIMode, state.currentAIBook);
                state.aiChatHistory.push({ role: 'model', parts: [{ text: msg }] });
                appendAIMessageToScroller('model', msg);
                const scroller = document.getElementById('ai-chat-scroller');
                if (scroller) scroller.scrollTop = scroller.scrollHeight;
                return;
            }
            if (prev !== state.currentAIMode && state.aiChatHistory && state.aiChatHistory.length > 2) {
                appendSystemAIEvent(`${mode.icon} ${mode.title}가 이어받았습니다. AI 모아가 역할을 전환했어요.`);
            }
        }

        function aiHistoryToPlainText(history, includeUserSeed=false) {
            return (history || []).filter((h,idx)=>includeUserSeed || idx>0).map(h => `${h.role==='model'?'AI 모아':'나'}: ${(h.parts?.[0]?.text||'').replace(/\n/g,' ')}`).join('\n');
        }


        function getLatestUserMessage(history) {
            const userMessages = (history || []).filter(h => h.role === 'user');
            return userMessages.length ? (userMessages[userMessages.length - 1].parts?.[0]?.text || '') : '';
        }

        function compactText(text, max=68) {
            const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
            return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
        }

        function guessBookTitleFromText(text) {
            const t = String(text || '').trim();
            if (!t) return '';
            const quoted = t.match(/[『「\"']([^『』「」\"']{1,40})[』」\"']/);
            if (quoted) return quoted[1].trim();
            const patterns = [
                /(.+?)(?:으로|로)\s*(?:독서토론|토론|진행|이야기|대화|해볼게|할게|하고 싶)/,
                /(?:책은|책 제목은|도서는)\s*([^\n\.?!]{1,40})/,
                /([^\n\.?!]{1,30})(?:이요|요)$/
            ];
            for (const re of patterns) {
                const m = t.match(re);
                if (m && m[1]) {
                    const v = m[1].replace(/^(저는|나는|그럼|음|아|네|응|좋아|좋아요)\s*/,'').trim();
                    if (v.length >= 2 && v.length <= 40) return v;
                }
            }
            return '';
        }

        function inferAIModeFromUserText(text) {
            const t = String(text || '').toLowerCase();
            if (/추천|비슷한 책|다음 책|읽을 책|책 골라|큐레이터|사서/.test(t)) return 'curator';
            if (/모임|발제|논제|질문 만들|진행|퍼실리|토론 질문|아이스브레이킹|요약해줘.*모임/.test(t)) return 'coaching';
            if (/정리|다듬|서평|독후감|문단|글로|한 문장|생각.*정리/.test(t)) return 'organize';
            if (/토론|반론|다른 입장|어떻게 생각|동의|반대|장면.*기억|왜/.test(t)) return 'debate';
            return normalizeAIModeKey(state.currentAIMode || 'moa');
        }

        function setAIBookTitle(bookTitle, silent=false) {
            const title = String(bookTitle || '').trim();
            if (!title) return;
            state.currentAIBook = title;
            safeSetText('ai-chat-header-book', `『${title}』`);
            updateAIHeaderStatus();
            renderAIBookAnalysisCard(title);
            if (!silent) showToast(`『${title}』로 대화 주제를 설정했습니다.`);
        }

        function switchAIPartner(modeKey, reason='') {
            const next = normalizeAIModeKey(modeKey);
            const prev = normalizeAIModeKey(state.currentAIMode || 'moa');
            state.currentAIMode = next;
            renderAIModeSelector();
            renderAIBookAnalysisCard(state.currentAIBook);
            const mode = getAIMode();
            const headerBookEl = document.getElementById('ai-chat-header-book');
            if (headerBookEl) headerBookEl.innerText = `${state.currentAIBook ? `『${state.currentAIBook}』` : 'AI 독서 파트너'}`;
            if (next !== prev && reason) {
                
            }
        }

        function appendSystemAIEvent(text) {
            const scroller = document.getElementById('ai-chat-scroller');
            if (!scroller) return;
            const div = document.createElement('div');
            div.className = 'max-w-[85%] ml-10 my-2 animate-fadeIn';
            div.innerHTML = `<div class="text-[10px] text-brand-sageDark bg-brand-sageLight/50 border border-brand-sage/20 rounded-full px-3 py-1 inline-block">${escapeHTML(text)}</div>`;
            scroller.appendChild(div);
            scroller.scrollTop = scroller.scrollHeight;
        }

        function getAIModeOpening(bookTitle, modeKey) {
            const name = getReaderName();
            if (bookTitle) {
                return `안녕하세요 ${name}. 저는 AI 독서파트너 모아입니다.
『${bookTitle}』에 대해 궁금한 장면, 마음에 남은 문장, 정리하고 싶은 생각을 편하게 말해주세요.`;
            }
            return `안녕하세요 ${name}. 저는 AI 독서파트너 모아입니다.
모드를 고르지 않아도 괜찮아요. 책 제목이나 궁금한 장면, 마음에 남은 문장 하나부터 이야기해볼까요?`;
        }

        function getAIModeGuideHTML() {
            const guides = {
                debate: ['책 제목을 대화 중에 정해도 됩니다', 'AI의 의견에 다시 반박하거나 동의해보기', '장면이 기억나지 않으면 바로 물어보기'],
                organize: ['정리되지 않은 감정과 메모 그대로 쓰기', 'AI가 잡은 핵심이 맞는지 고치기', '필요하면 서평·독후감·문단으로 발전시키기'],
                coaching: ['모임 전: 대상·시간·분위기 알려주기', '모임 중: 다음 질문·정리 멘트 요청하기', '모임 후: 토론 요약과 다음 모임 제안 받기'],
                curator: ['현재 기분과 읽고 싶은 분위기 말하기', '최근 좋았던 책과 싫었던 책 알려주기', '추천받은 책으로 바로 토론 이어가기']
            };
            return (guides[normalizeAIModeKey(state.currentAIMode || 'moa')] || guides.debate).map(item => `<li>${item}</li>`).join('');
        }



        function updateAIHeaderStatus() {
            const book = state.currentAIBook ? `『${state.currentAIBook}』` : '책 미정';
            const line = document.getElementById('ai-chat-status-line');
            if (line) line.innerText = `📚 현재 책: ${book} · AI 독서 파트너`;
            const header = document.getElementById('ai-chat-header-book');
            if (header) header.innerText = `${state.currentAIBook ? `『${state.currentAIBook}』` : 'AI 독서 파트너'}`;
            const badge = document.getElementById('ai-current-mode-badge');
            if (badge) badge.textContent = 'AI 독서 파트너';
            updateAIHeaderAvatar();
        }

        function isBookExistenceQuestion(text) {
            const t = String(text || '').trim();
            return /(라는|란)?\s*책이\s*(있어|있나요|존재|실제|맞아|맞나요)|실제로\s*있는\s*책|제목이\s*맞/.test(t);
        }

        function cleanBookQuery(text) {
            return String(text || '')
                .replace(/책이\s*(있어|있나요|존재해|존재하나요|맞아|맞나요)\??/g, '')
                .replace(/(라는|란)\s*책/g, '')
                .replace(/[『』「」"'?!。.]/g, '')
                .replace(/^(혹시|그럼|음|아|네|응|저는|나는)\s*/g, '')
                .trim();
        }

        function bookMatchConfidence(query, book) {
            const q = normalizeTitleKey(query);
            const t = normalizeTitleKey(book?.title || '');
            if (!q || !t) return 0;
            if (q === t) return 100;
            if (t.includes(q)) return q.length >= 4 ? 82 : 72;
            if (q.includes(t)) return 78;
            return 0;
        }

        async function validateBookInput(rawText) {
            const query = cleanBookQuery(guessBookTitleFromText(rawText) || rawText);
            if (!query || isNoBookAnswer(query)) return { status: 'none', query };
            let results = [];
            try {
                if (typeof searchGoogleBooks === 'function') results = await searchGoogleBooks(query);
            } catch(e) { console.warn('[BOOKMATE AI] 책 검색 실패', e); }
            results = (results || []).filter(b => b && b.title).slice(0, 5);
            if (!results.length) return { status: 'notFound', query };
            const top = results[0];
            const confidence = bookMatchConfidence(query, top);
            if (confidence >= 95) return { status: 'confirmed', query, book: top, results };
            if (confidence >= 70) return { status: 'suggest', query, book: top, results };
            return { status: 'multiple', query, results };
        }


        const AI_BOOK_KNOWLEDGE_STORAGE_KEY = 'bookmate_v3_book_knowledge_cache';


        const BOOKMATE_SEED_BOOK_KNOWLEDGE = [
            {
                aliases: ['데미안', 'demian', 'demian die geschichte von emil sinclairs jugend'],
                bookInfo: { title: '데미안', author: '헤르만 헤세', publisher: '', publishedDate: '1919', category: '고전문학/성장소설', thumbnail: '', isbn: '', description: '한 소년이 선악의 이분법을 넘어 자기 자신에게 이르는 길을 찾아가는 성장소설.' },
                analysis: {
                    shortIntro: '『데미안』은 싱클레어가 유년의 안정된 세계를 벗어나 자기 내면의 목소리를 따라 성장해가는 이야기입니다. 선과 악, 자아 발견, 고독, 선택의 문제가 중심에 놓여 있어 독서토론에 잘 맞는 작품입니다.',
                    plot: '싱클레어는 밝고 질서 있는 세계에서 자라지만, 크로머와의 사건을 계기로 어두운 세계를 경험합니다. 이후 데미안, 피스토리우스, 에바 부인과의 만남을 거치며 타인의 기준이 아니라 자기 내면의 길을 찾아가려 합니다.',
                    characters: ['에밀 싱클레어', '막스 데미안', '프란츠 크로머', '피스토리우스', '에바 부인'],
                    themes: ['자아 발견', '선과 악의 경계', '성장과 고독', '내면의 목소리', '상징과 신화', '기존 질서로부터의 독립'],
                    debatePoints: ['싱클레어의 변화는 성장일까요, 방황일까요?', '데미안은 싱클레어를 구원한 인물일까요, 위험한 영향을 준 인물일까요?', '선과 악을 나누는 기준은 누가 정하는 것일까요?', '자기 자신이 된다는 것은 사회와 멀어지는 일일까요?', '크로머와의 사건은 싱클레어에게 어떤 의미였을까요?'],
                    organizeQuestions: ['이 책에서 가장 오래 남은 감정은 무엇인가요?', '싱클레어의 흔들림 중 나와 닮았다고 느낀 부분이 있나요?', '내가 믿고 있던 “밝은 세계”는 무엇이었나요?', '나에게 데미안 같은 인물이 있었나요?'],
                    meetingQuestions: ['첫인상: 이 책은 어렵게 느껴졌나요, 매혹적으로 느껴졌나요?', '인물 토론: 데미안은 조력자인가요, 유혹자인가요?', '주제 토론: 선악의 경계를 흔드는 장면을 어떻게 읽었나요?', '삶 연결: 자기 자신답게 산다는 말은 현실에서 가능한가요?'],
                    similarBooks: ['수레바퀴 아래서', '싯다르타', '호밀밭의 파수꾼'],
                    cautions: ['세부 문장이나 장면 인용은 판본별 번역 차이가 있으므로 추가 확인이 필요합니다.']
                }
            },
            {
                aliases: ['불편한 편의점', '불편한편의점'],
                bookInfo: { title: '불편한 편의점', author: '김호연', publisher: '나무옆의자', publishedDate: '2021', category: '한국소설', thumbnail: '', isbn: '', description: '서울역 근처 편의점을 배경으로 상처 입은 사람들이 서로에게 작은 온기를 건네는 소설.' },
                analysis: {
                    shortIntro: '『불편한 편의점』은 편의점이라는 일상적 공간에서 다양한 인물들이 만나며 회복과 관계의 가능성을 발견하는 이야기입니다. 쉽고 따뜻한 문체 덕분에 폭넓은 독자층과 독서모임에 잘 어울립니다.',
                    plot: '서울역에서 노숙 생활을 하던 독고가 편의점에서 일하게 되며, 편의점을 오가는 사람들의 삶에 조금씩 변화를 일으킵니다. 각 인물의 사연이 편의점이라는 공간에서 교차하고, 작은 배려가 관계를 회복하는 계기가 됩니다.',
                    characters: ['독고', '염 여사', '편의점 직원들', '편의점 손님들'],
                    themes: ['회복', '관계', '노동과 존엄', '공간의 온기', '상처와 돌봄', '일상의 선의'],
                    debatePoints: ['이 소설의 따뜻함은 현실적이라고 느껴지나요, 이상적으로 느껴지나요?', '독고라는 인물의 변화는 설득력이 있었나요?', '편의점은 왜 사람들을 회복시키는 공간이 될 수 있었을까요?', '타인의 선의는 한 사람의 삶을 어디까지 바꿀 수 있을까요?'],
                    organizeQuestions: ['나에게 편의점처럼 잠시 쉬어갈 수 있는 공간은 어디인가요?', '책 속 인물 중 가장 마음이 쓰였던 사람은 누구인가요?', '작은 친절을 받은 경험이 떠오르나요?'],
                    meetingQuestions: ['가장 공감한 인물은 누구였나요?', '이 책이 주는 위로는 어떤 방식이었나요?', '현실의 편의점과 소설 속 편의점은 어떻게 달랐나요?', '이 소설을 “힐링 소설”이라고 부를 수 있을까요?'],
                    similarBooks: ['나미야 잡화점의 기적', '어서 오세요, 휴남동 서점입니다', '달러구트 꿈 백화점'],
                    cautions: ['인물별 세부 에피소드는 대화 중 필요할 때 추가 확인이 필요합니다.']
                }
            },
            {
                aliases: ['달러구트', '달러구트 꿈 백화점', '달러구트꿈백화점'],
                bookInfo: { title: '달러구트 꿈 백화점', author: '이미예', publisher: '팩토리나인', publishedDate: '2020', category: '한국 판타지소설', thumbnail: '', isbn: '', description: '잠든 사람들에게 꿈을 파는 백화점을 배경으로 꿈과 마음의 회복을 그리는 소설.' },
                analysis: {
                    shortIntro: '『달러구트 꿈 백화점』은 꿈을 사고파는 환상적인 공간을 통해 사람들의 상처, 소망, 기억을 다룹니다. 가볍게 읽히지만 꿈의 의미와 마음의 회복에 대해 이야기하기 좋은 작품입니다.',
                    plot: '페니가 달러구트 꿈 백화점에서 일하게 되며 다양한 꿈 제작자와 손님들을 만납니다. 손님들이 선택하는 꿈은 단순한 환상이 아니라 각자의 결핍과 욕망, 기억과 회복의 문제와 연결됩니다.',
                    characters: ['페니', '달러구트', '꿈 제작자들', '꿈을 사는 손님들'],
                    themes: ['꿈', '상처와 회복', '기억', '소망', '일과 성장', '상상력'],
                    debatePoints: ['꿈을 돈으로 사고파는 설정은 낭만적인가요, 불편한가요?', '사람에게 좋은 꿈은 현실을 바꾸는 힘이 있을까요?', '이 책의 판타지는 현실의 고민을 잘 비추고 있나요?', '페니의 성장은 어떤 방식으로 드러나나요?'],
                    organizeQuestions: ['내가 사고 싶은 꿈이 있다면 어떤 꿈일까요?', '잊고 싶은 꿈과 간직하고 싶은 꿈 중 어느 쪽이 더 중요할까요?', '이 책을 읽고 떠오른 나의 결핍이나 바람은 무엇인가요?'],
                    meetingQuestions: ['가장 인상 깊은 꿈은 무엇이었나요?', '꿈 백화점이라는 공간은 왜 매력적으로 느껴졌나요?', '꿈이 위로가 될 수 있다고 생각하나요?', '이 책을 청소년·성인 독자에게 추천하는 이유는 다를까요?'],
                    similarBooks: ['불편한 편의점', '나미야 잡화점의 기적', '어서 오세요, 휴남동 서점입니다'],
                    cautions: ['시리즈 후속권과 혼동될 수 있으므로 권차 확인이 필요합니다.']
                }
            },
            {
                aliases: ['아몬드', 'almond'],
                bookInfo: { title: '아몬드', author: '손원평', publisher: '창비', publishedDate: '2017', category: '한국소설/청소년문학', thumbnail: '', isbn: '', description: '감정을 느끼고 표현하는 데 어려움을 겪는 소년의 성장과 관계를 다룬 소설.' },
                analysis: {
                    shortIntro: '『아몬드』는 감정을 잘 느끼지 못하는 소년 윤재를 통해 공감, 폭력, 관계, 성장의 의미를 묻는 소설입니다. 청소년과 성인 모두 토론하기 좋은 주제가 많습니다.',
                    plot: '윤재는 감정 표현에 어려움을 겪으며 살아갑니다. 사건 이후 세상과 더욱 거리를 두게 되지만, 곤이 등 주변 인물과의 만남을 통해 감정과 관계의 의미를 조금씩 배워갑니다.',
                    characters: ['윤재', '곤이', '도라', '윤재의 가족'],
                    themes: ['공감', '감정', '폭력과 상처', '관계의 회복', '정상성', '성장'],
                    debatePoints: ['공감은 타고나는 것일까요, 배울 수 있는 것일까요?', '윤재와 곤이 중 누가 더 상처받은 인물이라고 느꼈나요?', '소설은 폭력을 어떻게 바라보고 있나요?', '감정을 잘 표현하는 사람이 더 성숙한 사람일까요?'],
                    organizeQuestions: ['내가 감정을 표현하기 어려웠던 순간이 있었나요?', '윤재를 보며 불편했던 점과 이해됐던 점은 무엇인가요?', '공감받았던 경험이 나를 어떻게 바꿨나요?'],
                    meetingQuestions: ['윤재의 무감정은 약점일까요, 다른 방식의 감각일까요?', '곤이의 행동을 어디까지 이해할 수 있나요?', '이 책을 청소년에게 추천한다면 어떤 이유를 말하고 싶나요?'],
                    similarBooks: ['완득이', '페인트', '체리새우: 비밀글입니다'],
                    cautions: ['사건 전개와 결말 세부는 스포일러 민감도가 있으므로 필요할 때만 다룹니다.']
                }
            },
            {
                aliases: ['어린 왕자', '어린왕자', 'the little prince'],
                bookInfo: { title: '어린 왕자', author: '앙투안 드 생텍쥐페리', publisher: '', publishedDate: '1943', category: '고전/우화', thumbnail: '', isbn: '', description: '어린 왕자의 여행을 통해 관계, 사랑, 책임, 어른의 세계를 성찰하는 우화.' },
                analysis: {
                    shortIntro: '『어린 왕자』는 짧고 쉬운 이야기처럼 보이지만 사랑, 책임, 길들임, 상실을 깊이 묻는 작품입니다. 세대에 따라 다르게 읽히는 점이 독서토론의 큰 장점입니다.',
                    plot: '사막에 불시착한 조종사는 어린 왕자를 만나 그의 별과 여행 이야기를 듣습니다. 어린 왕자는 여러 별의 어른들을 만나고 지구에서 여우와 장미의 의미를 깨달으며 관계와 책임을 배웁니다.',
                    characters: ['어린 왕자', '조종사', '장미', '여우', '여러 별의 어른들'],
                    themes: ['사랑과 책임', '길들임', '어른의 세계', '상실', '순수함', '보이지 않는 것의 가치'],
                    debatePoints: ['장미는 이기적인 존재일까요, 사랑받고 싶은 존재일까요?', '길들인다는 것은 소유일까요, 관계일까요?', '어른들은 왜 중요한 것을 보지 못하게 되었을까요?', '어린 왕자의 선택을 어떻게 받아들여야 할까요?'],
                    organizeQuestions: ['내가 길들여진 관계는 무엇인가요?', '나에게 보이지 않지만 중요한 것은 무엇인가요?', '어른이 되며 잃어버린 감각이 있다면 무엇인가요?'],
                    meetingQuestions: ['어릴 때 읽은 느낌과 지금 읽은 느낌이 달랐나요?', '가장 기억에 남는 별의 어른은 누구였나요?', '여우의 말은 지금의 관계에도 적용될까요?'],
                    similarBooks: ['갈매기의 꿈', '모모', '꽃들에게 희망을'],
                    cautions: ['유명 문장은 번역본마다 표현이 다르므로 직접 인용 시 판본 확인이 필요합니다.']
                }
            },
            {
                aliases: ['채식주의자', 'the vegetarian'],
                bookInfo: { title: '채식주의자', author: '한강', publisher: '창비', publishedDate: '2007', category: '한국소설', thumbnail: '', isbn: '', description: '채식을 선언한 한 여성을 둘러싸고 가족과 사회의 폭력, 몸과 욕망의 문제를 그리는 소설.' },
                analysis: {
                    shortIntro: '『채식주의자』는 한 개인의 선택이 가족과 사회의 폭력적 시선 속에서 어떻게 해석되고 훼손되는지 보여주는 작품입니다. 강렬하고 불편한 질문을 남기기 때문에 깊은 토론에 적합합니다.',
                    plot: '영혜가 어느 날 육식을 거부하고 채식을 선언하면서 가족과 주변인들은 그녀를 이해하기보다 통제하려 합니다. 이야기는 여러 시선을 통해 영혜의 몸, 욕망, 침묵, 폭력을 둘러싼 긴장을 드러냅니다.',
                    characters: ['영혜', '영혜의 남편', '형부', '인혜', '가족들'],
                    themes: ['몸의 주체성', '폭력', '가족과 통제', '욕망', '침묵', '사회적 정상성'],
                    debatePoints: ['영혜의 채식은 선택일까요, 저항일까요, 붕괴일까요?', '가족은 보호자였나요, 폭력의 주체였나요?', '이 작품에서 가장 불편했던 장면은 무엇이며 왜 그랬나요?', '타인의 몸과 선택에 사회는 어디까지 개입할 수 있을까요?'],
                    organizeQuestions: ['이 작품이 불편했다면 그 불편함의 근원은 무엇인가요?', '영혜를 이해하고 싶었나요, 거리감을 느꼈나요?', '내가 정상이라고 믿는 기준은 어디에서 왔나요?'],
                    meetingQuestions: ['이 책을 읽는 동안 감정의 변화가 있었나요?', '영혜의 침묵은 약함인가요, 거부인가요?', '세 화자의 시선은 영혜를 이해하게 만들었나요, 더 멀어지게 만들었나요?'],
                    similarBooks: ['소년이 온다', '작별하지 않는다', '82년생 김지영'],
                    cautions: ['폭력과 신체에 대한 민감한 내용이 있어 독서모임에서는 안전한 대화 규칙이 필요합니다.']
                }
            },
            {
                aliases: ['모순'],
                bookInfo: { title: '모순', author: '양귀자', publisher: '쓰다', publishedDate: '1998', category: '한국소설', thumbnail: '', isbn: '', description: '삶의 선택과 행복의 모순을 한 여성의 시선으로 그린 한국 장편소설.' },
                analysis: {
                    shortIntro: '『모순』은 누구나 더 나은 삶을 원하지만, 선택의 결과가 늘 선명하지 않다는 사실을 보여주는 소설입니다. 가족, 사랑, 결혼, 행복의 기준을 이야기하기 좋습니다.',
                    plot: '주인공 안진진은 가족의 삶과 자신의 사랑, 결혼 가능성을 바라보며 삶의 아이러니를 체감합니다. 닮은 듯 다른 두 여성의 삶과 여러 선택지를 통해 행복의 조건을 묻게 됩니다.',
                    characters: ['안진진', '진진의 어머니', '이모', '나영규', '김장우'],
                    themes: ['삶의 모순', '행복의 기준', '가족', '사랑과 결혼', '선택과 후회', '현실 감각'],
                    debatePoints: ['행복한 삶은 안정적인 삶과 같은 말일까요?', '진진의 선택은 현실적이었나요, 체념이었나요?', '이모와 어머니의 삶은 무엇을 대비시키나요?', '우리는 왜 모순을 알면서도 선택해야 할까요?'],
                    organizeQuestions: ['내가 생각하는 행복의 조건은 무엇인가요?', '내 삶에서 가장 큰 모순은 무엇인가요?', '현실적인 선택과 마음이 원하는 선택이 갈렸던 경험이 있나요?'],
                    meetingQuestions: ['가장 이해가 갔던 인물은 누구였나요?', '이 소설의 결말을 어떻게 받아들였나요?', '읽고 나서 “행복”에 대한 생각이 달라졌나요?'],
                    similarBooks: ['나는 소망한다 내게 금지된 것을', '사서함 110호의 우편물', '밝은 밤'],
                    cautions: ['결말 해석은 독자별로 갈릴 수 있으므로 하나의 정답으로 단정하지 않습니다.']
                }
            },
            {
                aliases: ['구의 증명', '구의증명'],
                bookInfo: { title: '구의 증명', author: '최진영', publisher: '은행나무', publishedDate: '2015', category: '한국소설', thumbnail: '', isbn: '', description: '상실과 사랑, 기억의 강렬한 감각을 밀도 높은 문장으로 그린 소설.' },
                analysis: {
                    shortIntro: '『구의 증명』은 사랑하는 존재를 잃은 뒤 남겨진 사람이 기억과 상실을 견디는 방식을 강렬하게 보여주는 소설입니다. 사랑의 윤리와 애도의 방식에 대해 깊은 이야기를 나눌 수 있습니다.',
                    plot: '담과 구의 관계를 중심으로 사랑, 결핍, 상실의 감정이 전개됩니다. 사건 이후 담은 구의 부재를 자기 안에 붙들고자 하며, 이 과정에서 사랑과 소유, 애도의 경계가 흔들립니다.',
                    characters: ['담', '구'],
                    themes: ['상실', '사랑', '애도', '기억', '몸과 감각', '소유와 결핍'],
                    debatePoints: ['이 작품의 사랑은 아름다운가요, 위험한가요?', '상실을 견디는 방식에 한계가 있을까요?', '담의 선택을 이해할 수 있었나요?', '사랑은 타인을 보존하려는 마음일까요, 놓아주는 마음일까요?'],
                    organizeQuestions: ['이 책에서 가장 강하게 남은 감각은 무엇인가요?', '상실을 다룬 방식이 불편했나요, 절실했나요?', '사랑과 집착의 경계는 어디라고 생각하나요?'],
                    meetingQuestions: ['이 작품을 읽기 힘들었다면 그 이유는 무엇인가요?', '담과 구의 관계를 한 단어로 표현한다면?', '애도의 방식은 개인의 자유일까요, 윤리의 문제일까요?'],
                    similarBooks: ['해가 지는 곳으로', '밝은 밤', '소년이 온다'],
                    cautions: ['강한 정서와 민감한 장면이 있어 독서모임에서는 참여자의 감정 반응을 존중해야 합니다.']
                }
            },
            {
                aliases: ['노르웨이의 숲', '상실의 시대', 'norwegian wood'],
                bookInfo: { title: '노르웨이의 숲', author: '무라카미 하루키', publisher: '', publishedDate: '1987', category: '일본문학/장편소설', thumbnail: '', isbn: '', description: '상실과 사랑, 청춘의 고독을 회고 형식으로 그린 무라카미 하루키의 장편소설.' },
                analysis: {
                    shortIntro: '『노르웨이의 숲』은 청춘의 사랑과 상실, 살아남은 사람의 죄책감과 고독을 섬세하게 다룹니다. 인물 선택과 관계의 윤리를 두고 의견이 많이 갈릴 수 있는 작품입니다.',
                    plot: '와타나베는 과거의 사랑과 상실을 회상합니다. 나오코와 미도리, 그리고 주변 인물들과의 관계 속에서 그는 죽음의 그늘과 삶의 감각 사이를 오가며 성장합니다.',
                    characters: ['와타나베', '나오코', '미도리', '기즈키', '레이코'],
                    themes: ['상실', '청춘', '고독', '사랑의 방식', '삶과 죽음', '기억'],
                    debatePoints: ['와타나베는 책임감 있는 인물인가요, 회피적인 인물인가요?', '나오코와 미도리는 어떤 삶의 방향을 상징한다고 볼 수 있을까요?', '상실을 겪은 사람은 어떻게 다시 살아갈 수 있을까요?', '이 소설의 분위기는 아름다움인가요, 공허함인가요?'],
                    organizeQuestions: ['읽고 난 뒤 남은 감정은 쓸쓸함인가요, 위로인가요?', '나에게 청춘은 어떤 이미지로 남아 있나요?', '상실 이후에도 계속 살아간다는 말은 무엇일까요?'],
                    meetingQuestions: ['가장 공감한 인물과 가장 거리감이 든 인물은 누구였나요?', '와타나베의 선택을 어떻게 평가하나요?', '이 책이 오래 읽히는 이유는 무엇일까요?'],
                    similarBooks: ['데미안', '호밀밭의 파수꾼', '위대한 개츠비'],
                    cautions: ['민감한 정서와 관계 묘사가 있으므로 독서모임에서는 개인 경험을 강요하지 않습니다.']
                }
            },
            {
                aliases: ['밝은 밤', '밝은밤'],
                bookInfo: { title: '밝은 밤', author: '최은영', publisher: '문학동네', publishedDate: '2021', category: '한국소설', thumbnail: '', isbn: '', description: '여성들의 삶과 기억, 세대 간 상처와 회복을 따라가는 장편소설.' },
                analysis: {
                    shortIntro: '『밝은 밤』은 개인의 상처가 가족사와 시대의 기억 속에서 어떻게 이어지는지 보여주는 작품입니다. 여성 서사, 기억, 돌봄, 화해에 대해 깊게 이야기하기 좋습니다.',
                    plot: '주인공은 이혼 후 새로운 곳에서 지내며 할머니와 가까워지고, 그 과정에서 증조모와 할머니 세대의 이야기를 듣게 됩니다. 개인의 상실은 가족과 역사 속 여성들의 삶과 연결되며 회복의 가능성을 찾아갑니다.',
                    characters: ['지연', '할머니', '증조모', '가족 여성들'],
                    themes: ['여성의 삶', '가족사', '기억과 증언', '상처와 회복', '돌봄', '세대 간 연결'],
                    debatePoints: ['개인의 상처를 이해하는 데 가족사는 얼마나 중요할까요?', '이 소설의 회복은 완전한 치유에 가까울까요, 함께 견디기에 가까울까요?', '여성들의 연대는 어떤 방식으로 드러나나요?', '기억을 말하는 일은 왜 중요할까요?'],
                    organizeQuestions: ['내 가족의 이야기 중 나를 이해하게 만든 기억이 있나요?', '이 책에서 가장 조용하지만 강하게 느껴진 장면은 무엇인가요?', '상처를 말로 꺼내는 일은 어떤 의미가 있을까요?'],
                    meetingQuestions: ['세대가 다른 여성들의 삶을 어떻게 읽었나요?', '가족 이야기를 듣는 장면들이 어떤 감정을 주었나요?', '이 책의 제목 “밝은 밤”은 어떻게 해석할 수 있을까요?'],
                    similarBooks: ['모순', '소년이 온다', '작별하지 않는다'],
                    cautions: ['가족사와 상처를 다룰 때 개인 경험 고백을 강요하지 않는 진행이 필요합니다.']
                }
            }
        ].map(item => ({ ...item, source: 'bookmate-seed-card-v1', createdAt: '2026-07-02T00:00:00.000Z' }));

        function cloneBookKnowledge(obj) {
            try { return JSON.parse(JSON.stringify(obj)); } catch(e) { return obj; }
        }

        function findSeedBookKnowledge(bookOrTitle) {
            const raw = typeof bookOrTitle === 'string' ? bookOrTitle : (bookOrTitle?.title || bookOrTitle?.bookInfo?.title || '');
            const key = normalizeTitleKey(raw);
            if (!key) return null;
            const found = BOOKMATE_SEED_BOOK_KNOWLEDGE.find(item => {
                const keys = [item.bookInfo?.title, item.bookInfo?.author, ...(item.aliases || [])].filter(Boolean).map(normalizeTitleKey);
                return keys.some(k => key === k || k.includes(key) || key.includes(k));
            });
            return found ? cloneBookKnowledge(found) : null;
        }

        function getBookKnowledgeCache() {
            try { return JSON.parse(localStorage.getItem(AI_BOOK_KNOWLEDGE_STORAGE_KEY) || '{}'); }
            catch(e) { return {}; }
        }

        function saveBookKnowledgeCache(cache) {
            try { localStorage.setItem(AI_BOOK_KNOWLEDGE_STORAGE_KEY, JSON.stringify(cache || {})); } catch(e) {}
        }

        function bookKnowledgeKey(book) {
            const isbn = cleanIsbn(book?.isbn || '');
            return isbn ? `isbn:${isbn}` : `title:${normalizeTitleKey(book?.title || book || '')}`;
        }

        function getCachedBookKnowledge(book) {
            const cache = getBookKnowledgeCache();
            const cached = cache[bookKnowledgeKey(book)];
            if (cached) return cached;
            return findSeedBookKnowledge(book);
        }

        function saveBookKnowledge(book, knowledge) {
            const cache = getBookKnowledgeCache();
            cache[bookKnowledgeKey(book)] = knowledge;
            saveBookKnowledgeCache(cache);
        }

        function showBookResearchProgress(bookTitle) {
            appendSystemAIEvent(`📚 『${bookTitle}』 책 정보를 수집하고 있어요.`);
            setTimeout(() => appendSystemAIEvent('🔎 제목·저자·출판 정보를 확인 중이에요.'), 300);
            setTimeout(() => appendSystemAIEvent('🧠 줄거리와 핵심 주제를 분석하고 있어요.'), 650);
            setTimeout(() => appendSystemAIEvent('💬 대화에 필요한 토론 포인트를 정리하고 있어요.'), 1000);
        }

        function buildLocalBookKnowledge(book) {
            const title = book?.title || '선택한 책';
            const author = book?.author || '저자 정보 없음';
            const desc = (book?.description || '').replace(/<[^>]+>/g, '').trim();
            const category = book?.category || book?.categories || '';
            const intro = desc ? compactText(desc, 180) : `${title}의 기본 정보를 바탕으로 독서 대화를 준비했습니다. 정확한 장면이나 세부 내용은 대화 중 필요한 경우 추가 확인이 필요할 수 있어요.`;
            return {
                bookInfo: {
                    title,
                    author,
                    publisher: book?.publisher || '',
                    publishedDate: book?.publishedDate || '',
                    description: desc,
                    category,
                    thumbnail: book?.thumbnail || book?.fixedCoverUrl || '',
                    isbn: book?.isbn || ''
                },
                analysis: {
                    shortIntro: intro,
                    plot: desc ? compactText(desc, 260) : '책 소개 정보를 바탕으로 큰 흐름만 확인되었습니다. 세부 장면은 추가 확인이 필요합니다.',
                    characters: [],
                    themes: category ? [category, '관계', '성장'] : ['감정', '관계', '성장'],
                    debatePoints: ['가장 오래 남은 장면은 무엇인가요?', '인물의 선택을 어떻게 바라볼 수 있을까요?', '이 책이 내 삶과 연결되는 지점은 어디인가요?'],
                    organizeQuestions: ['이 책을 읽고 가장 먼저 떠오른 감정은 무엇인가요?', '불편하거나 오래 남은 문장이 있었나요?'],
                    meetingQuestions: ['첫인상 나누기', '인상 깊은 장면 나누기', '인물의 선택에 대한 의견 나누기']
                },
                source: book?.source || 'google-books/local',
                createdAt: new Date().toISOString()
            };
        }

        async function analyzeBookInfoWithGemini(book) {
            if (!apiKey) return buildLocalBookKnowledge(book);
            const desc = (book?.description || '').replace(/<[^>]+>/g, '').trim();
            const systemPrompt = `너는 BOOKMATE의 독서 지식 엔진이다. 입력된 책 정보를 바탕으로 독서 대화에 사용할 지식 카드를 만든다. 반드시 JSON만 반환한다. 이 책을 읽었다고 가정하지 말고 제공된 자료에서 확인 가능한 내용만 사용한다. 모르는 세부 장면·인물·문장은 지어내지 말고 "추가 확인 필요"라고 표시한다. 신간이나 정보가 부족한 책은 소개문 기반의 임시 지식 카드임을 cautions에 남긴다.`;
            const userPrompt = `책 정보:
제목: ${book?.title || ''}
저자: ${book?.author || ''}
출판사: ${book?.publisher || ''}
출간일: ${book?.publishedDate || ''}
분류: ${book?.category || ''}
소개: ${desc || '소개 정보 없음'}

아래 JSON 형식으로만 응답해줘.
{
  "shortIntro": "책을 2~3문장으로 소개",
  "plot": "스포일러를 과하게 포함하지 않는 핵심 흐름",
  "characters": ["주요 인물 또는 중요 대상"],
  "themes": ["핵심 주제 3~6개"],
  "debatePoints": ["독서토론 질문 3개"],
  "organizeQuestions": ["생각정리 질문 3개"],
  "meetingQuestions": ["독서모임 질문 3개"],
  "cautions": ["확실하지 않거나 추가 확인이 필요한 점"]
}`;
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
                    })
                });
                if (!response.ok) throw new Error('Book analysis API failed');
                const data = await response.json();
                let txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(txt);
                return {
                    bookInfo: buildLocalBookKnowledge(book).bookInfo,
                    analysis,
                    source: 'google-books+gemini',
                    createdAt: new Date().toISOString()
                };
            } catch(e) {
                console.warn('[BOOKMATE AI] 책 분석 실패, 로컬 지식으로 대체', e);
                return buildLocalBookKnowledge(book);
            }
        }

        async function prepareBookKnowledge(book, options = {}) {
            if (!book || !book.title) return null;
            const cached = getCachedBookKnowledge(book);
            if (cached && !options.forceRefresh) {
                state.currentAIBookKnowledge = cached;
                state.currentAIBookMeta = cached.bookInfo || book;
                renderAIBookAnalysisCard(cached.bookInfo?.title || book.title);
                if (cached.source === 'bookmate-seed-card-v1' && options.showProgress !== false) {
                    appendSystemAIEvent(`📘 대표도서 지식 카드에서 『${cached.bookInfo?.title || book.title}』 정보를 불러왔어요.`);
                    appendSystemAIEvent('✅ 줄거리·인물·주제·토론 질문까지 준비되어 있어요.');
                }
                return cached;
            }
            if (options.showProgress !== false) showBookResearchProgress(book.title);
            const knowledge = await analyzeBookInfoWithGemini(book);
            saveBookKnowledge(book, knowledge);
            state.currentAIBookKnowledge = knowledge;
            state.currentAIBookMeta = knowledge.bookInfo || book;
            renderAIBookAnalysisCard(book.title);
            appendSystemAIEvent(`✅ 『${book.title}』 분석이 끝났어요. 이제 이 정보를 바탕으로 대화할게요.`);
            return knowledge;
        }

        async function setAIBookFromBook(book, silent=false, options={}) {
            if (!book || !book.title) return null;
            state.currentAIBook = book.title;
            state.currentAIBookMeta = book;
            safeSetText('ai-chat-header-book', `『${book.title}』`);
            updateAIHeaderStatus();
            if (!silent) showToast(`『${book.title}』로 대화 주제를 설정했습니다.`);
            const knowledge = await prepareBookKnowledge(book, options);
            return knowledge;
        }

        function bookDisplay(book) {
            if (!book) return '';
            return `『${book.title}』${book.author ? `(${book.author})` : ''}`;
        }

        function buildBookNotFoundReply(query) {
            return `지금은 “${query}”라는 제목의 책을 정확히 찾지 못했어요.\n제가 추측해서 바로 대화를 시작하진 않을게요.\n혹시 제목이 조금 다르거나, 작가 이름을 알고 계실까요? 아니면 “책 추천해줘”라고 말씀하시면 큐레이터 AI가 함께 골라드릴게요.`;
        }

        function buildBookSuggestReply(validation) {
            const b = validation.book;
            return `혹시 ${bookDisplay(b)}을 말씀하시는 걸까요?\n맞다면 “맞아요” 또는 “이 책으로 할게요”라고 해주세요. 다른 책이라면 제목이나 작가를 조금 더 알려주세요.`;
        }

        function buildBookMultipleReply(validation) {
            const list = (validation.results || []).slice(0,3).map((b,i)=>`${i+1}. ${bookDisplay(b)}`).join('\n');
            return `비슷한 책이 몇 권 보여요. 어떤 책으로 이야기할까요?\n\n${list}\n\n번호나 정확한 제목을 알려주시면 그 책으로 이어갈게요.`;
        }

        function setPendingBookValidation(validation) {
            state.pendingAIBookValidation = validation ? {
                query: validation.query || '',
                book: validation.book || null,
                results: validation.results || []
            } : null;
        }

        function resolvePendingBookByUserText(text) {
            const pending = state.pendingAIBookValidation;
            if (!pending) return null;
            const t = String(text || '').trim().toLowerCase();
            if (/^(맞아|맞아요|네|응|ㅇㅇ|이 책|그 책|좋아|좋아요|진행|할게|해줘)/.test(t)) return pending.book || pending.results?.[0] || null;
            const num = t.match(/[1-3]/)?.[0];
            if (num && pending.results?.[Number(num)-1]) return pending.results[Number(num)-1];
            return null;
        }

        function getReaderName() {
            return isGuestUser() ? '게스트 독자님' : `${state.currentUser.nickname}님`;
        }

        function isNoBookAnswer(text) {
            return /^(없어|없어요|아직|못 골랐|못골랐|모르겠|안 정했|책 없음|없)$/i.test(String(text || '').trim()) || /책.*(못 골랐|못골랐|없|모르겠|안 정했)/.test(String(text || ''));
        }

        function inferExplicitModeFromUserText(text) {
            const t = String(text || '').toLowerCase();
            if (/독서토론|토론 ai|토론ai|토론 모드|debate/.test(t)) return 'debate';
            if (/생각정리|생각 정리|생각다듬|생각 다듬|정리 ai|정리ai|organize/.test(t)) return 'organize';
            if (/독서모임|모임 코칭|코칭 ai|코칭ai|퍼실리|facilitator|coaching/.test(t)) return 'coaching';
            if (/큐레이터|책추천|책 추천|추천 ai|추천ai|사서|curator/.test(t)) return 'curator';
            return '';
        }

        function getModeChoicePrompt(bookTitle) {
            const title = bookTitle ? `『${bookTitle}』` : '이 책';
            const k = state.currentAIBookKnowledge;
            const intro = k?.analysis?.shortIntro ? `

먼저 확인한 내용으로는, ${k.analysis.shortIntro}` : '';
            const sourceLine = k?.source === 'bookmate-seed-card-v1' ? '\n대표도서 지식 카드가 준비되어 있어요.' : '\n검색한 책 정보를 바탕으로 임시 지식 카드를 만들었어요.';
            return `${title} 정보를 확인하고 분석했어요.${sourceLine}${intro}

이제 모드를 고르지 않아도 괜찮아요. 궁금한 장면, 마음에 남은 문장, 정리하고 싶은 생각부터 바로 이야기해볼까요?`;
        }

        function getModeStartMessage(modeKey, bookTitle) {
            const name = getReaderName();
            const bookLine = bookTitle ? `오늘은 『${bookTitle}』을 중심으로 이야기해볼게요.` : `아직 책이 정해지지 않았으니, 대화하면서 함께 정해봐도 좋아요.`;
            return `안녕하세요. ${name} 저는 AI 독서파트너 모아입니다.\n${bookLine}\n질문, 감상, 토론, 글쓰기 정리, 책 추천까지 대화 흐름에 맞춰 자연스럽게 도와드릴게요.`;
        }

        function setAISetupStage(stage) {
            state.aiSetupStage = 'chat';
            const badge = document.getElementById('ai-current-mode-badge');
            if (badge) badge.textContent = 'AI 독서 파트너';
            updateAIHeaderStatus();
        }

        function buildLocalAIModeResponse(history) {
            const latest = compactText(getLatestUserMessage(history), 120);
            const book = state.currentAIBook ? `『${state.currentAIBook}』` : '지금 이야기 중인 책';
            const userTurns = (history || []).filter(h => h.role === 'user').length;
            const prefix = userTurns > 2 ? '앞 대화 흐름은 유지하고 있어요.' : '대화를 시작할 준비는 되어 있어요.';

            if (/추천|비슷한 책|다음 책|읽을 책/.test(latest)) {
                return `모아의 AI 연결이 잠시 불안정해서, 지금은 임시로 짧게 답할게요.\n${prefix} 추천도서는 충분한 대화가 쌓인 뒤 이유와 함께 제안하는 편이 좋아요. 방금 말씀하신 “${latest || '추천'}”의 기준을 더 정확히 잡기 위해, 최근 좋았던 책 1권이나 피하고 싶은 분위기 1가지만 알려주세요.`;
            }
            if (/서평|독후감|문단|정리|다듬/.test(latest)) {
                return `모아의 AI 연결이 잠시 불안정해서, 지금은 임시로 짧게 답할게요.\n방금 말씀하신 내용을 바로 완성문으로 만들기보다는, 먼저 핵심 감정을 잡는 게 좋아요. “${latest || '방금 생각'}”에서 가장 강한 감정이 공감, 불편함, 궁금함 중 어디에 가까웠나요?`;
            }
            if (/토론|논제|질문|모임|발제/.test(latest)) {
                return `모아의 AI 연결이 잠시 불안정해서, 지금은 임시로 짧게 답할게요.\n${book}에 대한 토론이라면, 먼저 “가장 오래 남은 장면은 무엇인가요?”처럼 쉬운 질문에서 시작하고, 이어서 “왜 그 장면이 나에게 남았을까요?”로 확장하면 자연스러워요.`;
            }
            if (/줄거리|내용|무슨 이야기|요약/.test(latest)) {
                return `모아의 AI 연결이 잠시 불안정해서, 지금은 임시로 짧게 답할게요.\n줄거리 설명은 스포일러 여부가 중요해요. 아직 읽는 중이라면 결말은 피해서 핵심 배경과 인물 관계만 먼저 정리하는 방식이 좋습니다.`;
            }
            return `모아의 AI 연결이 잠시 불안정해서 답변이 완전히 이어지지 않을 수 있어요.\n그래도 방금 말씀하신 “${latest || '그 부분'}”은 이어서 다룰 수 있어요. 같은 내용을 한 번만 더 보내주시면, 책의 장면·인물·생각 정리 중 필요한 방향으로 바로 이어갈게요.`;
        }

        function saveCurrentAIChat() {
            if (isGuestUser()) { showGuestJoinPrompt('ai'); return; }
            if (!state.aiChatHistory || state.aiChatHistory.length < 2) { showToast('저장할 대화가 없습니다.', 'error'); return; }
            const list = loadAIChats();
            const mode = getAIMode();
            const item = { id: Date.now(), title: `${state.currentAIBook || '책 미지정'} · ${mode.badge}`, book: state.currentAIBook || '', mode: normalizeAIModeKey(state.currentAIMode || 'moa'), history: state.aiChatHistory, locked:false, favorite:false, createdAt:'오늘' };
            saveAIChats([item, ...list].slice(0, 20));
            renderAIHistoryList();
            showToast('AI 대화가 저장되었습니다.');
        }

        function renderAIHistoryList() {
            const box = document.getElementById('ai-history-list');
            if (!box) return;
            const list = loadAIChats();
            if (!list.length) { box.innerHTML = '<div class="text-[10px] text-gray-400 bg-brand-ivory/50 border border-dashed border-brand-ivoryDark rounded-xl p-3 text-center">저장된 대화가 없습니다.</div>'; return; }
            box.innerHTML = list.map(item => `<div class="group rounded-xl border border-brand-ivoryDark bg-white hover:bg-brand-ivory/60 transition-colors p-2"><button onclick="openSavedAIChat(${item.id})" class="w-full text-left flex items-start gap-2"><i data-lucide="${item.locked?'lock':item.favorite?'star':'message-square'}" class="w-3.5 h-3.5 mt-0.5 text-brand-sage"></i><span class="min-w-0 flex-1"><b class="block text-[11px] text-brand-navy line-clamp-1">${escapeHTML(item.title)}</b><span class="text-[9px] text-gray-400">${item.createdAt || '저장됨'}</span></span></button><div class="flex gap-1 justify-end mt-1 opacity-80"><button onclick="toggleAIChatFavorite(${item.id})" class="text-[9px] px-1.5 py-0.5 rounded hover:bg-white">⭐</button><button onclick="toggleAIChatLock(${item.id})" class="text-[9px] px-1.5 py-0.5 rounded hover:bg-white">🔒</button><button onclick="shareSavedAIChat(${item.id})" class="text-[9px] px-1.5 py-0.5 rounded hover:bg-white">공유</button><button onclick="deleteAIChat(${item.id})" class="text-[9px] px-1.5 py-0.5 rounded hover:bg-white text-red-500">삭제</button></div></div>`).join('');
            try { lucide.createIcons(); } catch(e) {}
        }

        function openSavedAIChat(id) {
            const item = loadAIChats().find(x => x.id === id);
            if (!item) return;
            state.currentAIBook = item.book || '';
            state.currentAIMode = normalizeAIModeKey(item.mode || 'debate');
            state.aiChatHistory = item.history || [];
            state.aiChatTurns = Math.max(0, Math.floor((state.aiChatHistory.length - 2) / 2));
            renderAIModeSelector();
            renderAIBookAnalysisCard(state.currentAIBook);
            safeSetText('ai-chat-header-book', `${state.currentAIBook ? `『${state.currentAIBook}』` : 'AI 독서 파트너'}`);
            const scroller = document.getElementById('ai-chat-scroller');
            if (scroller) {
                scroller.innerHTML = '';
                (state.aiChatHistory || []).slice(1).forEach(h => appendAIMessageToScroller(h.role, h.parts?.[0]?.text || ''));
                scroller.scrollTop = scroller.scrollHeight;
            }
            renderAIRightSidebar();
            showToast('저장된 대화를 열었습니다.');
        }

        function toggleAIChatFavorite(id) { const list=loadAIChats(); const item=list.find(x=>x.id===id); if(item){ item.favorite=!item.favorite; saveAIChats(list); } }
        function toggleAIChatLock(id) { const list=loadAIChats(); const item=list.find(x=>x.id===id); if(item){ item.locked=!item.locked; saveAIChats(list); } }
        function deleteAIChat(id) { const list=loadAIChats(); const item=list.find(x=>x.id===id); if(item?.locked){ showToast('잠금된 대화는 삭제할 수 없습니다. 잠금을 해제해주세요.', 'error'); return; } if(!confirm('이 AI 대화 기록을 삭제할까요?')) return; saveAIChats(list.filter(x=>x.id!==id)); showToast('AI 대화 기록을 삭제했습니다.'); }

        function shareAIChat(type='summary') {
            openAIShareModal(type);
        }
        function shareSavedAIChat(id) { const item=loadAIChats().find(x=>x.id===id); if(!item)return; state.currentAIBook=item.book; state.currentAIMode=normalizeAIModeKey(item.mode || 'debate'); state.aiChatHistory=item.history; shareAIChat('full'); }

        function appendAIMessageToScroller(role, text) {
            const scroller = document.getElementById('ai-chat-scroller'); if (!scroller) return;
            const div = document.createElement('div');
            if (role === 'model') {
                div.className = 'flex gap-3 max-w-[85%] animate-fadeIn mt-2';
                div.innerHTML = `${getAIAvatarHTML('w-7 h-7', 'flex-shrink-0')}<div class="bg-brand-ivory rounded-2xl p-4 text-xs leading-relaxed text-brand-navy border border-brand-ivoryDark shadow-sm space-y-2"><p>${escapeHTML(text).replace(/\n/g,'<br>')}</p></div>`;
            } else {
                div.className = 'flex gap-3 max-w-[85%] ml-auto justify-end animate-fadeIn';
                div.innerHTML = `<div class="bg-brand-navy text-white rounded-2xl p-4 text-xs leading-relaxed border border-brand-navy/10 shadow-sm">${escapeHTML(text).replace(/\n/g,'<br>')}</div>`;
            }
            scroller.appendChild(div);
        }


        function sendAIChip(text) {
            const input = document.getElementById('ai-chat-input');
            if (!input) return;
            input.value = text;
            sendAIChatMessage();
        }

        function handleAIChatKeyPress(e) {
            if (e.key === 'Enter') sendAIChatMessage();
        }

        function openNewAIChatModal() {
            document.getElementById('new-ai-chat-book-title').value = '';
            const modeSelect = document.getElementById('new-ai-chat-mode');
            if (modeSelect) modeSelect.value = state.currentAIMode || 'moa';
            document.getElementById('new-ai-chat-modal').classList.remove('hidden');
        }

        function closeNewAIChatModal() {
            document.getElementById('new-ai-chat-modal').classList.add('hidden');
        }

        function startNewAIChat() {
            const title = document.getElementById('new-ai-chat-book-title').value.trim();
            closeNewAIChatModal();
            resetAIChat(title, 'debate');
            showToast(title ? `『${title}』로 모아와 대화를 시작합니다.` : `모아와 새 대화를 시작합니다.`);
        }

        function getMockBookAnalysis(bookTitle) {
            if (!bookTitle) {
                return { intro:'책을 아직 정하지 않았어요. 대화 중에 책 제목을 말하면 해당 책을 중심으로 분석과 질문이 바뀝니다.', keywords:['책 선택','대화 시작','맞춤 전환','독서 여정'], target:'책을 고르거나 생각을 먼저 정리하고 싶은 독자', time:'책 선택 후 안내', difficulty:'책 선택 후 안내' };
            }
            const title = normalizeTitle(bookTitle);
            const known = findKnownBook(title);
            const category = known?.category || (title.match(/사피엔스|유전자|코스모스|집중력/) ? '인문·사회' : '문학·교양');
            return {
                intro: category.includes('소설') || category.includes('문학') ? `『${title}』은 인물과 사건의 결을 따라가며 나의 삶과 타인의 마음을 함께 비춰보게 하는 책입니다.` : `『${title}』은 익숙한 세계를 다른 관점으로 바라보게 하며, 독자의 질문을 넓혀 주는 책입니다.`,
                keywords: category.includes('자기') ? ['습관', '실천', '성장', '자기관리'] : category.includes('과학') || category.includes('사회') || category.includes('인문') ? ['사회', '변화', '관점', '질문'] : ['감정', '관계', '성장', '공감'],
                target: category.includes('자기') ? '꾸준한 실천과 자기 성장을 원하는 독자' : category.includes('과학') || category.includes('사회') || category.includes('인문') ? '사회 변화와 인간 이해에 관심 있는 독자' : '인물의 감정선과 삶의 의미를 함께 나누고 싶은 독자',
                time: category.includes('고전') ? '약 4~6시간' : category.includes('사회') || category.includes('과학') || title === '사피엔스' ? '약 8~10시간' : '약 3~5시간',
                difficulty: category.includes('사회') || category.includes('과학') || title === '사피엔스' ? '★★★★☆' : '★★★☆☆'
            };
        }

        function renderAIBookAnalysisCard(bookTitle = state.currentAIBook) {
            const el = document.getElementById('ai-book-analysis-card');
            if (!el) return;
            const k = state.currentAIBookKnowledge;
            if (k && (!bookTitle || normalizeTitleKey(k.bookInfo?.title || '') === normalizeTitleKey(bookTitle))) {
                const info = k.bookInfo || {};
                const a = k.analysis || {};
                const themes = Array.isArray(a.themes) && a.themes.length ? a.themes : ['분석 완료'];
                const questions = Array.isArray(a.debatePoints) && a.debatePoints.length ? a.debatePoints.slice(0,3) : (Array.isArray(a.meetingQuestions) ? a.meetingQuestions.slice(0,3) : []);
                el.innerHTML = `
                    <div class="p-3 bg-brand-ivory/60 rounded-xl border border-brand-ivoryDark leading-relaxed text-brand-navy">
                        <b class="block text-[11px] mb-1">『${escapeHTML(info.title || bookTitle)}』 분석 완료</b>
                        ${escapeHTML(a.shortIntro || a.plot || info.description || '책 정보를 바탕으로 대화를 준비했습니다.')}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="p-2 bg-brand-sageLight/40 rounded-lg"><span class="block text-[9px] text-gray-500 font-bold">저자</span><b class="text-brand-navy">${escapeHTML(info.author || '정보 없음')}</b></div>
                        <div class="p-2 bg-brand-sageLight/40 rounded-lg"><span class="block text-[9px] text-gray-500 font-bold">출처</span><b class="text-brand-navy">${escapeHTML(k.source || '책 지식 엔진')}</b></div>
                    </div>
                    <div><span class="block text-[10px] font-bold text-gray-400 mb-1">핵심 주제</span><div class="flex flex-wrap gap-1">${themes.map(t=>`<span class="bg-brand-sageLight text-brand-sageDark px-2 py-0.5 rounded-full text-[9px] font-bold">#${escapeHTML(t)}</span>`).join('')}</div></div>
                    <div class="text-[11px] text-gray-600"><b class="text-brand-navy">대화 준비 메모</b><br>${escapeHTML(a.plot || '이 책의 기본 정보와 소개를 바탕으로 대화를 시작할 수 있어요.')}</div>
                    <div class="pt-2 border-t border-brand-ivoryDark space-y-1">
                        <b class="text-brand-navy text-[11px]">바로 써볼 질문</b>
                        <ol class="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
                            ${(questions.length ? questions : ['이 책에서 가장 오래 남은 장면은 무엇인가요?']).map(q=>`<li>${escapeHTML(q)}</li>`).join('')}
                        </ol>
                    </div>`;
                return;
            }
            const data = getMockBookAnalysis(bookTitle);
            el.innerHTML = `
                <div class="p-3 bg-brand-ivory/60 rounded-xl border border-brand-ivoryDark leading-relaxed text-brand-navy">${data.intro}</div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="p-2 bg-brand-sageLight/40 rounded-lg"><span class="block text-[9px] text-gray-500 font-bold">예상 독서시간</span><b class="text-brand-navy">${data.time}</b></div>
                    <div class="p-2 bg-brand-sageLight/40 rounded-lg"><span class="block text-[9px] text-gray-500 font-bold">난이도</span><b class="text-brand-navy">${data.difficulty}</b></div>
                </div>
                <div><span class="block text-[10px] font-bold text-gray-400 mb-1">핵심 키워드</span><div class="flex flex-wrap gap-1">${data.keywords.map(k=>`<span class="bg-brand-sageLight text-brand-sageDark px-2 py-0.5 rounded-full text-[9px] font-bold">#${k}</span>`).join('')}</div></div>
                <div class="text-[11px] text-gray-600"><b class="text-brand-navy">추천 대상</b><br>${data.target}</div>
                <div class="pt-2 border-t border-brand-ivoryDark space-y-1">
                    <b class="text-brand-navy text-[11px]">${getAIMode().title} 가이드</b>
                    <ol class="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
                        ${getAIModeGuideHTML()}
                    </ol>
                </div>`;
        }

        function resetAIChat(bookTitle = state.currentAIBook, modeKey = state.currentAIMode || 'moa') {
            state.currentAIBook = bookTitle || '';
            state.currentAIBookMeta = null;
            state.currentAIBookKnowledge = null;
            state.currentAIMode = 'debate';
            state.aiChatTurns = 0;
            state.pendingAIBookValidation = null;
            setAISetupStage('chat');
            renderAIModeSelector();
            renderAIHistoryList();
            
            safeSetText('ai-note-status', '대화 분석 대기');
            const impEl = document.getElementById('note-impressive');
            if(impEl) impEl.innerHTML = '<span class="text-gray-400 text-[10px] font-normal not-italic">(대화를 나누면 AI가 핵심 문장을 스크랩합니다)</span>';
            const kwEl = document.getElementById('note-keywords');
            if(kwEl) kwEl.innerHTML = '<span class="text-gray-400 text-[10px] p-1 inline-block border border-dashed border-gray-200 rounded-md w-full text-center">키워드 추출 대기 중...</span>';
            const perEl = document.getElementById('note-perspective');
            if(perEl) perEl.innerHTML = '<span class="text-brand-sage/50 text-[10px] font-normal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">(확장된 시각이 이곳에 정리됩니다)</span>';

            const headerBookEl = document.getElementById('ai-chat-header-book');
            const mode = getAIMode();
            if (headerBookEl) headerBookEl.innerText = `${state.currentAIBook ? `『${state.currentAIBook}』` : 'AI 독서파트너 모아'}`;
            updateAIHeaderStatus();
            renderAIBookAnalysisCard(state.currentAIBook);
            renderAIRightSidebar();

            const scroller = document.getElementById('ai-chat-scroller');
            const welcomeMsg = getAIModeOpening(bookTitle, state.currentAIMode).replace(/\n/g, '<br>');

            state.aiChatHistory = [
                { role: "user", parts: [{ text: `안녕하세요. 오늘 BOOKMATE AI와 독서 대화를 시작하고 싶어요.` }] },
                { role: "model", parts: [{ text: welcomeMsg.replace(/<br>/g, '\n') }] }
            ];

            if (scroller) {
                scroller.innerHTML = `
                    <div class="flex gap-3 max-w-[85%] animate-fadeIn">
                        ${getAIAvatarHTML('w-7 h-7', 'flex-shrink-0')}
                        <div class="bg-brand-ivory rounded-2xl p-4 text-xs leading-relaxed text-brand-navy border border-brand-ivoryDark">
                            ${welcomeMsg}
                        </div>
                    </div>
                `;
            }
        }

        async function analyzeUserThoughtsWithAI(userText) {
            const status = document.getElementById('ai-note-status');
            if (status) {
                status.innerText = "사유 분석 중...";
                status.classList.add('animate-pulse');
            }

            try {
                if (!apiKey) throw new Error("No API Key");

                const systemPrompt = `사용자의 독서 감상 텍스트를 분석하여 다음 JSON 형식으로만 응답해. 마크다운 없이 순수 JSON 문자열만 반환해야 해.
{
  "impressive": "사용자 입력 내용 중 가장 핵심이 되는 문장 1개 발췌",
  "keywords": ["텍스트에서 추출한 핵심 사유 키워드 2개"],
  "perspective": "이 사용자의 관점에서 한 단계 더 철학적으로 확장된 새로운 질문이나 관점 1문장"
}`;
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
                const payload = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: "user", parts: [{ text: userText }] }]
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error("API Error");
                const data = await response.json();
                let jsonText = data.candidates[0].content.parts[0].text;
                jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(jsonText);

                if (result.impressive) {
                    document.getElementById('note-impressive').innerHTML = `"${result.impressive}"`;
                }
                
                if (result.keywords && Array.isArray(result.keywords)) {
                    const kwContainer = document.getElementById('note-keywords');
                    let kwHtml = kwContainer.innerHTML.includes('대기 중') ? '' : kwContainer.innerHTML;
                    result.keywords.forEach((kw, i) => {
                        kwHtml += `<span class="bg-brand-sageLight text-brand-sageDark px-2 py-1 rounded-md text-[10px] font-bold border border-brand-sage/20 shadow-sm animate-fadeIn" style="animation-delay: ${i*0.1}s">#${kw}</span> `;
                    });
                    kwContainer.innerHTML = kwHtml;
                }
                
                if (result.perspective) {
                    document.getElementById('note-perspective').innerHTML = `<span class="animate-fadeIn block text-brand-navy leading-relaxed">${result.perspective}</span>`;
                }

                if (status) {
                    status.innerText = "분석 완료";
                    status.classList.remove('animate-pulse');
                }

            } catch (e) {
                console.log("AI 분석 실패, 로컬 키워드 추출로 대체합니다.", e);
                const words = userText.split(' ').filter(w => w.length > 1);
                const keywords = words.slice(0, 2).map(w => w.replace(/[^가-힣a-zA-Z0-9]/g, ''));
                const excerpt = userText.length > 40 ? userText.substring(0, 40) + "..." : userText;
                
                document.getElementById('note-impressive').innerHTML = `"${excerpt}"`;
                
                if (keywords.length > 0) {
                    const kwContainer = document.getElementById('note-keywords');
                    let kwHtml = kwContainer.innerHTML.includes('대기 중') ? '' : kwContainer.innerHTML;
                    keywords.forEach((kw, i) => {
                        if(kw) kwHtml += `<span class="bg-brand-sageLight text-brand-sageDark px-2 py-1 rounded-md text-[10px] font-bold border border-brand-sage/20 shadow-sm animate-fadeIn" style="animation-delay: ${i*0.1}s">#${kw}</span> `;
                    });
                    kwContainer.innerHTML = kwHtml;
                }
                
                document.getElementById('note-perspective').innerHTML = `<span class="animate-fadeIn block text-brand-sage/80 italic">"${keywords[0] || '이 부분'}"에 대해 다른 독자들과 비교해보면 새로운 시각이 열릴 수 있습니다.</span>`;
                
                if (status) {
                    status.innerText = "분석 완료";
                    status.classList.remove('animate-pulse');
                }
            }
        }

        async function fetchGeminiResponse(history) {
            const conversationText = aiHistoryToPlainText(history, true).slice(-6000);
            const latest = getLatestUserMessage(history);
            const systemPrompt = `너는 BOOKMATE의 AI 독서파트너 '모아'이다.
너는 단순 질의응답 AI가 아니라, 사용자와 함께 책을 읽고 생각을 나누는 독서 친구이다. 자신을 AI 모델이라고 소개하지 말고 항상 '모아'로 대화한다.

현재 책: ${state.currentAIBook ? `'${state.currentAIBook}'` : '아직 정하지 않음'}.

대화 원칙:
1. 모드 선택을 요구하지 않는다. 사용자의 의도를 파악해 설명, 토론, 생각정리, 글쓰기 코칭, 독서모임 준비, 책 추천을 자연스럽게 오간다.
2. 답부터 길게 말하기보다 사용자가 헷갈리는 지점을 먼저 잡는다. 질문은 한 번에 하나만 한다.
3. 사용자의 의견에 바로 맞다/틀리다 하지 않는다. 공감 → 질문 → 생각 확장 순서로 이어간다.
4. 스포일러 가능성이 있으면 먼저 확인한다. 사용자가 읽는 중이면 결말을 말하지 않는다.
5. 책의 세부 장면이나 정확한 문장을 모르면 지어내지 않는다. “조금 더 알려주시면 함께 이야기해볼게요.”라고 말한다.
6. 답변은 기본적으로 3~6문장으로 간결하게 한다. 사용자가 요청할 때만 표, 목록, 긴 정리를 제공한다.
7. 과도한 칭찬이나 “좋은 질문입니다” 반복을 피한다.
8. 독서성향 분석과 추천도서는 대화가 충분히 쌓인 뒤에만 한다. 추천할 때는 반드시 이유를 붙인다.
9. 로컬 안내문처럼 “모드를 고르지 않아도...” 같은 설명을 반복하지 않는다. 사용자의 마지막 말에 바로 이어서 답한다.
10. 한국어로, 도서관 사서처럼 차분하고 따뜻하게 말한다.`
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: latest, history: history, book: state.currentAIBook || '', systemPrompt, conversationText })
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                return data.reply || data.text || '답변을 불러오지 못했어요.';
            } catch (error) {
                console.warn('[BOOKMATE AI] Netlify Function 호출 실패', error);
                showToast('AI 연결이 잠시 불안정합니다. 잠시 후 다시 시도해주세요.', 'error');
                return buildLocalAIModeResponse(history);
            }
        }

        async function sendAIChatMessage() {
            const input = document.getElementById('ai-chat-input');
            const scroller = document.getElementById('ai-chat-scroller');
            const typingIndicator = document.getElementById('ai-typing-indicator');
            const txt = input.value.trim();
            
            if (!txt) return;

            appendAIMessageToScroller('user', txt);
            input.value = '';
            scroller.scrollTop = scroller.scrollHeight;

            if (typeof analyzeUserThoughtsWithAI === 'function') {
                analyzeUserThoughtsWithAI(txt);
            }

            state.aiChatHistory.push({ role: "user", parts: [{ text: txt }] });
            // v3.2: 모드/단계 선택 없이 하나의 AI 독서파트너로 바로 대화합니다.
            state.aiSetupStage = 'chat';

            if (state.aiSetupStage === 'askBook') {
                let setupReply = '';
                const pendingBook = resolvePendingBookByUserText(txt);
                if (pendingBook) {
                    await setAIBookFromBook(pendingBook, true);
                    setPendingBookValidation(null);
                    setupReply = getModeChoicePrompt(pendingBook.title);
                    setAISetupStage('askMode');
                } else if (isNoBookAnswer(txt)) {
                    setupReply = `괜찮아요. 그렇다면 최근에 읽은 책은 무슨 책이신가요? 그 책에 대해서 이야기 나눠보는 건 어떠세요?
최근에 읽은 책도 없다면 “추천해줘”라고 말씀해주세요. 큐레이터 AI가 책 선택부터 도와드릴게요.`;
                    state.aiSetupStage = 'askRecentBook';
                    setAISetupStage('askRecentBook');
                } else {
                    const validation = await validateBookInput(txt);
                    if (validation.status === 'confirmed') {
                        await setAIBookFromBook(validation.book, true);
                        setPendingBookValidation(null);
                        setupReply = getModeChoicePrompt(validation.book.title);
                        setAISetupStage('askMode');
                    } else if (validation.status === 'suggest') {
                        setPendingBookValidation(validation);
                        setupReply = buildBookSuggestReply(validation);
                        setAISetupStage('askBook');
                    } else if (validation.status === 'multiple') {
                        setPendingBookValidation(validation);
                        setupReply = buildBookMultipleReply(validation);
                        setAISetupStage('askBook');
                    } else {
                        setPendingBookValidation(null);
                        setupReply = buildBookNotFoundReply(validation.query || txt);
                        setAISetupStage('askBook');
                    }
                }
                state.aiChatHistory.push({ role: 'model', parts: [{ text: setupReply }] });
                appendAIMessageToScroller('model', setupReply);
                scroller.scrollTop = scroller.scrollHeight;
                return;
            }

            if (state.aiSetupStage === 'askRecentBook') {
                const pendingBook = resolvePendingBookByUserText(txt);
                if (pendingBook) {
                    await setAIBookFromBook(pendingBook, true);
                    setPendingBookValidation(null);
                    const setupReply = `좋아요. 그럼 『${pendingBook.title}』으로 이야기 나눠볼게요.
${getModeChoicePrompt(pendingBook.title)}`;
                    setAISetupStage('askMode');
                    state.aiChatHistory.push({ role: 'model', parts: [{ text: setupReply }] });
                    appendAIMessageToScroller('model', setupReply);
                    scroller.scrollTop = scroller.scrollHeight;
                    return;
                }
                if (isNoBookAnswer(txt) || /추천|골라|찾아/.test(txt)) {
                    switchAIPartner('curator', '책 선택부터 함께 도와드릴게요.');
                    setAISetupStage('chat');
                    const setupReply = `좋아요. 큐레이터 AI가 이어받겠습니다.
요즘 어떤 분위기의 책을 읽고 싶으신가요? 가볍게 읽고 싶은지, 깊이 생각하고 싶은지, 또는 관심 있는 주제가 있는지만 알려주셔도 괜찮아요.`;
                    state.aiChatHistory.push({ role: 'model', parts: [{ text: setupReply }] });
                    appendAIMessageToScroller('model', setupReply);
                    scroller.scrollTop = scroller.scrollHeight;
                    return;
                } else {
                    const validation = await validateBookInput(txt);
                    let setupReply = '';
                    if (validation.status === 'confirmed') {
                        await setAIBookFromBook(validation.book, true);
                        setPendingBookValidation(null);
                        setupReply = `좋아요. 그럼 최근에 읽으신 『${validation.book.title}』으로 이야기 나눠볼게요.
${getModeChoicePrompt(validation.book.title)}`;
                        setAISetupStage('askMode');
                    } else if (validation.status === 'suggest') {
                        setPendingBookValidation(validation);
                        setupReply = buildBookSuggestReply(validation);
                        setAISetupStage('askRecentBook');
                    } else if (validation.status === 'multiple') {
                        setPendingBookValidation(validation);
                        setupReply = buildBookMultipleReply(validation);
                        setAISetupStage('askRecentBook');
                    } else {
                        setPendingBookValidation(null);
                        setupReply = buildBookNotFoundReply(validation.query || txt);
                        setAISetupStage('askRecentBook');
                    }
                    state.aiChatHistory.push({ role: 'model', parts: [{ text: setupReply }] });
                    appendAIMessageToScroller('model', setupReply);
                    scroller.scrollTop = scroller.scrollHeight;
                    return;
                }
            }

            if (state.aiSetupStage === 'askMode') {
                setAISetupStage('chat');
            }

            const pendingBookInChat = resolvePendingBookByUserText(txt);
            if (pendingBookInChat) {
                await setAIBookFromBook(pendingBookInChat, true);
                setPendingBookValidation(null);
                const setupReply = `좋아요. 『${pendingBookInChat.title}』로 대화 주제를 설정했어요.\n이제 ${getAIMode().title}의 역할로 이어가볼게요.`;
                state.aiChatHistory.push({ role: 'model', parts: [{ text: setupReply }] });
                appendAIMessageToScroller('model', setupReply);
                scroller.scrollTop = scroller.scrollHeight;
                return;
            }

            if (isBookExistenceQuestion(txt)) {
                const validation = await validateBookInput(txt);
                let factReply = '';
                if (validation.status === 'confirmed') {
                    await setAIBookFromBook(validation.book, true);
                    setPendingBookValidation(null);
                    factReply = `네, ${bookDisplay(validation.book)}은 실제로 확인되는 책이에요.\n이 책으로 대화를 이어갈까요? 원하시면 바로 ${getAIMode().title}로 시작할 수 있어요.`;
                } else if (validation.status === 'suggest') {
                    setPendingBookValidation(validation);
                    factReply = `정확히는 ${bookDisplay(validation.book)}이 확인돼요.\n혹시 이 책을 말씀하신 걸까요?`;
                } else if (validation.status === 'multiple') {
                    setPendingBookValidation(validation);
                    factReply = buildBookMultipleReply(validation);
                } else {
                    setPendingBookValidation(null);
                    factReply = buildBookNotFoundReply(validation.query || txt);
                }
                state.aiChatHistory.push({ role: 'model', parts: [{ text: factReply }] });
                appendAIMessageToScroller('model', factReply);
                scroller.scrollTop = scroller.scrollHeight;
                return;
            }

            const guessedBook = guessBookTitleFromText(txt);
            if (!state.currentAIBook && guessedBook) {
                
                const validation = await validateBookInput(guessedBook);
                if (validation.status === 'confirmed') {
                    await setAIBookFromBook(validation.book, true);
                } else if (validation.status === 'suggest' || validation.status === 'multiple') {
                    setPendingBookValidation(validation);
                    const reply = validation.status === 'suggest' ? buildBookSuggestReply(validation) : buildBookMultipleReply(validation);
                    state.aiChatHistory.push({ role: 'model', parts: [{ text: reply }] });
                    appendAIMessageToScroller('model', reply);
                    scroller.scrollTop = scroller.scrollHeight;
                    return;
                }

            }
            // v3.2: 화면상 모드는 제거했습니다. 의도 전환은 Gemini 프롬프트가 내부적으로 처리합니다.

            typingIndicator.classList.remove('hidden');
            scroller.scrollTop = scroller.scrollHeight;

            const replyText = await fetchGeminiResponse(state.aiChatHistory);

            typingIndicator.classList.add('hidden');

            state.aiChatHistory.push({ role: "model", parts: [{ text: replyText }] });

            const aiDiv = document.createElement('div');
            aiDiv.className = "flex gap-3 max-w-[85%] animate-fadeIn mt-2";
            aiDiv.innerHTML = `
                ${getAIAvatarHTML('w-7 h-7', 'flex-shrink-0')}
                <div class="bg-brand-ivory rounded-2xl p-4 text-xs leading-relaxed text-brand-navy border border-brand-ivoryDark shadow-sm space-y-2">
                    <p>${replyText.replace(/\n/g, '<br>')}</p>
                </div>
            `;
            scroller.appendChild(aiDiv);
            scroller.scrollTop = scroller.scrollHeight;

            if (!state.aiChatTurns) state.aiChatTurns = 0;
            state.aiChatTurns++;
            renderAIRightSidebar();
            if (isGuestUser() && state.aiChatTurns === 2) {
                setTimeout(() => { appendGuestAIJoinCard(scroller); }, 800);
            }
            if (false && !isGuestUser() && state.aiChatTurns === 2) { // 실제 독자 매칭 구현 전까지 비활성화
                setTimeout(() => {
                    const cardWrap = document.createElement('div');
                    cardWrap.className = "max-w-[85%] animate-fadeIn mt-4 mb-2 ml-10";
                    cardWrap.innerHTML = `
                        <div class="bg-gradient-to-br from-[#EAF2E8] to-white p-4 rounded-2xl border border-brand-sage/30 shadow-sm relative overflow-hidden group">
                            <div class="absolute -right-4 -top-4 text-brand-sage/5 transition-transform group-hover:scale-110 duration-500 pointer-events-none">
                                <i data-lucide="users" class="w-28 h-28"></i>
                            </div>
                            <div class="relative z-10 space-y-4">
                                <div>
                                    <h4 class="text-[11px] font-bold text-brand-sageDark flex items-center gap-1.5 mb-1"><i data-lucide="link" class="w-3.5 h-3.5"></i> 사유가 맞닿은 독자 추천</h4>
                                    <p class="text-[10px] text-gray-500 leading-snug">방금 정리하신 관점과 유사한 문장을 스크랩한 독자가 있습니다. 인사를 건네볼까요?</p>
                                </div>
                                
                                <div class="bg-white/80 backdrop-blur p-3 rounded-xl border border-brand-sage/20 flex items-center justify-between shadow-sm">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center font-serif shrink-0">사</div>
                                        <div class="overflow-hidden">
                                            <h5 class="text-xs font-bold text-brand-navy truncate">사유올빼미</h5>
                                            <p class="text-[9px] text-brand-sage font-medium">"고통은 회피할 때보다 마주할 때..."</p>
                                        </div>
                                    </div>
                                    <button onclick="openDirectMessage('사유올빼미',{source:'ai'})" class="px-3 py-1.5 bg-brand-navy text-white text-[10px] font-bold rounded-lg hover:bg-brand-navyLight shrink-0 transition-colors">쪽지 보내기</button>
                                </div>

                                <div class="pt-3 border-t border-brand-sage/20">
                                    <h4 class="text-[11px] font-bold text-brand-navy mb-2 flex items-center gap-1.5"><i data-lucide="message-square-plus" class="w-3.5 h-3.5 text-brand-sage"></i> 지금 이야기 나누기 좋은 토론방</h4>
                                    <div class="bg-white/80 backdrop-blur p-3 rounded-xl border border-brand-ivoryDark flex items-center justify-between cursor-pointer hover:border-brand-sage shadow-sm transition-colors" onclick="enterMeetingRoom('${state.currentAIBook}')">
                                        <div>
                                            <span class="inline-flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[8px] font-bold mb-1">
                                                <span class="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> LIVE
                                            </span>
                                            <h5 class="text-[11px] font-bold text-brand-navy truncate">${state.currentAIBook} 사색 소모임</h5>
                                        </div>
                                        <i data-lucide="chevron-right" class="w-4 h-4 text-brand-sage"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    scroller.appendChild(cardWrap);
                    lucide.createIcons();
                    scroller.scrollTop = scroller.scrollHeight;
                }, 2000);
            }
        }



        // BOOKMATE v3.4: AI conversation insights, recommendations, share modal, archive save
        const AI_ARCHIVE_KEY = 'bookmate_v3_ai_archives';
        let aiShareDraft = { type: 'summary', text: '', title: '' };

        function getAIUserTurns(history = state.aiChatHistory) {
            return (history || []).filter(h => h.role === 'user').length;
        }

        function getAIPlainMessages(history = state.aiChatHistory) {
            return (history || []).filter(h => h && h.parts && h.parts[0] && h.parts[0].text).map(h => ({ role: h.role, text: String(h.parts[0].text || '').trim() }));
        }

        function aiHistoryToPlainText(history = state.aiChatHistory) {
            const rows = getAIPlainMessages(history).filter((m, idx) => !(idx === 0 && m.text.includes('독서 대화를 시작')));
            if (!rows.length) return '아직 기록할 대화가 없습니다.';
            return rows.map(m => `${m.role === 'model' ? '모아' : (state.currentUser?.nickname || '나')}: ${m.text}`).join('\n\n');
        }

        function summarizeAIConversation(limit = 1000) {
            const messages = getAIPlainMessages(state.aiChatHistory).filter(m => m.role === 'user');
            const book = state.currentAIBook || inferBookFromAIHistory() || '주제도서 미정';
            const userTexts = messages.map(m => m.text).filter(t => !t.includes('독서 대화를 시작'));
            if (!userTexts.length) return '아직 요약할 대화가 충분하지 않습니다. 책 제목이나 인상 깊은 장면을 조금 더 이야기해보세요.';
            const keywords = extractAIKeywords(userTexts.join(' ')).slice(0, 6);
            const questions = userTexts.filter(t => /\?|왜|어떻게|무엇|궁금|이해|설명|정리|추천|토론/.test(t)).slice(-3);
            const summary = [
                `주제도서: ${book}`,
                `관심 주제: ${keywords.length ? keywords.join(', ') : '대화 확장 중'}`,
                `대화 흐름: ${userTexts.slice(-4).map(t => compactText(t, 90)).join(' → ')}`,
                questions.length ? `주요 질문: ${questions.map(q => compactText(q, 80)).join(' / ')}` : '주요 질문: 아직 명확한 질문보다 자유 감상 중심으로 대화가 진행되고 있습니다.',
                `모아의 관찰: 현재 대화는 ${inferInterpretationStyle(userTexts.join(' '))} 경향이 보입니다. 추천도서와 독서모임은 이 흐름을 기준으로 제안됩니다.`
            ].join('\n');
            return summary.length > limit ? summary.slice(0, limit - 1) + '…' : summary;
        }

        function compactText(text, max = 120) {
            const t = String(text || '').replace(/\s+/g, ' ').trim();
            return t.length > max ? t.slice(0, max - 1) + '…' : t;
        }

        function extractAIKeywords(text) {
            const t = String(text || '');
            const candidates = [
                ['인물 심리', /인물|주인공|심리|마음|감정|관계/],
                ['사회 문제', /사회|현실|문제|구조|차별|노동|세대|폭력/],
                ['철학적 질문', /의미|존재|삶|죽음|자아|선택|자유|책임/],
                ['서평·글쓰기', /서평|독후감|문장|글|작성|다듬|표현/],
                ['토론 준비', /토론|논제|발제|질문|모임|의견/],
                ['줄거리 이해', /줄거리|내용|요약|등장인물|장면|결말/],
                ['책 추천', /추천|비슷한 책|다음 책|읽을 책/],
                ['현실 연결', /현실|나도|경험|요즘|우리|일상|적용/]
            ];
            return candidates.filter(([, re]) => re.test(t)).map(([label]) => label);
        }

        function inferBookFromAIHistory() {
            const text = getAIPlainMessages().map(m => m.text).join(' ');
            const known = (typeof findKnownBook === 'function') ? null : null;
            const titles = (state.recentBooks || []).concat(state.gatherings || []).map(x => x.title || x.book).filter(Boolean);
            return titles.find(title => text.includes(title)) || '';
        }

        function inferInterpretationStyle(text) {
            const t = String(text || '');
            if (/왜|의미|상징|주제|작가|해석|철학|존재|자아/.test(t)) return '작품의 의미와 상징을 파고드는 해석 중심';
            if (/나도|경험|현실|일상|우리|요즘|사회/.test(t)) return '책의 내용을 현실 경험과 연결하는 확장 중심';
            if (/인물|마음|감정|관계|주인공/.test(t)) return '인물의 감정선과 관계를 따라가는 인물 중심';
            if (/서평|문장|정리|글|표현/.test(t)) return '읽은 내용을 자기 언어로 정리하려는 기록 중심';
            return '질문을 통해 책의 핵심을 천천히 확인하는 탐색 중심';
        }

        function getAIInsightData() {
            const userTexts = getAIPlainMessages().filter(m => m.role === 'user').map(m => m.text).filter(t => !t.includes('독서 대화를 시작'));
            const joined = userTexts.join(' ');
            const turns = userTexts.length;
            const keywords = extractAIKeywords(joined);
            const book = state.currentAIBook || inferBookFromAIHistory();
            return {
                ready: turns >= 4,
                confidence: Math.min(100, Math.max(12, turns * 18)),
                book: book || '대화 중 파악 중',
                keywords: keywords.length ? keywords : ['대화 축적 중'],
                questionHabit: /왜|어떻게|무엇|궁금|이해|설명/.test(joined) ? '이유와 맥락을 확인하며 읽는 편' : '감상과 인상에서 출발해 생각을 넓히는 편',
                style: inferInterpretationStyle(joined)
            };
        }

        function renderAIRightSidebar() {
            const insightEl = document.getElementById('ai-insight-panel');
            const gatheringEl = document.getElementById('ai-gathering-recommendations');
            const bookEl = document.getElementById('ai-book-recommendations');
            if (!insightEl || !gatheringEl || !bookEl) return;
            const data = getAIInsightData();
            if (!data.ready) {
                const need = Math.max(0, 4 - getAIPlainMessages().filter(m => m.role === 'user' && !m.text.includes('독서 대화를 시작')).length);
                insightEl.innerHTML = `<div class="p-4 rounded-2xl bg-brand-ivory/60 border border-dashed border-brand-ivoryDark text-center"><p class="text-xs font-bold text-brand-navy">아직 분석 중입니다.</p><p class="text-[11px] text-gray-500 leading-relaxed mt-1">${need ? `대화를 ${need}번 정도 더 나누면` : '조금 더 이야기하면'} 인사이트가 열립니다.</p></div>`;
                gatheringEl.innerHTML = `<div class="p-4 rounded-2xl bg-brand-ivory/50 border border-dashed border-brand-ivoryDark text-center text-[11px] text-gray-400 leading-relaxed">대화 기반 인사이트가 쌓이면<br>추천 모임이 나타납니다.</div>`;
                bookEl.innerHTML = `<div class="p-4 rounded-2xl bg-brand-ivory/50 border border-dashed border-brand-ivoryDark text-center text-[11px] text-gray-400 leading-relaxed">대화가 더 쌓이면<br>추천도서와 이유가 나타납니다.</div>`;
                return;
            }
            insightEl.innerHTML = `<div class="space-y-3"><div class="p-3 rounded-2xl bg-brand-ivory/60 border border-brand-ivoryDark"><span class="block text-[10px] font-bold text-gray-400">주제도서</span><b class="text-xs text-brand-navy">${escapeHTML(data.book)}</b></div><div class="p-3 rounded-2xl bg-brand-sageLight/50 border border-brand-sage/20"><span class="block text-[10px] font-bold text-brand-sageDark">관심주제</span><div class="flex flex-wrap gap-1.5 mt-2">${data.keywords.slice(0,5).map(k=>`<span class="px-2 py-1 rounded-full bg-white border border-brand-ivoryDark text-[10px] font-bold text-brand-navy">${escapeHTML(k)}</span>`).join('')}</div></div><div class="grid grid-cols-1 gap-2 text-[11px]"><div class="p-3 rounded-xl bg-white border border-brand-ivoryDark"><b class="block text-brand-navy mb-1">질문 습관</b><span class="text-gray-600">${escapeHTML(data.questionHabit)}</span></div><div class="p-3 rounded-xl bg-white border border-brand-ivoryDark"><b class="block text-brand-navy mb-1">해석 방식</b><span class="text-gray-600">${escapeHTML(data.style)}</span></div></div><div><div class="flex justify-between text-[10px] font-bold text-gray-400 mb-1"><span>분석 신뢰도</span><span>${data.confidence}%</span></div><div class="h-2 rounded-full bg-brand-ivoryDark overflow-hidden"><div class="h-full bg-brand-sage rounded-full" style="width:${data.confidence}%"></div></div></div></div>`;
            renderAIGatheringRecommendations(data);
            renderAIBookRecommendations(data);
            try { lucide.createIcons(); } catch(e) {}
        }

        function renderAIGatheringRecommendations(data) {
            const el = document.getElementById('ai-gathering-recommendations'); if (!el) return;
            const currentBook = normalizeTitleKey(data.book || state.currentAIBook || '');
            const words = (data.keywords || []).join(' ');
            const scored = (state.gatherings || []).map(g => {
                let score = Number(g.suitability || 70);
                if (currentBook && normalizeTitleKey(g.book || '') === currentBook) score += 15;
                (g.keywords || []).forEach(k => { if (words.includes(k) || words.includes('사회') && k.includes('사회') || words.includes('인물') && k.includes('소설')) score += 8; });
                if (g.joined) score -= 10;
                return { ...g, aiScore: Math.min(99, score) };
            }).sort((a,b)=>b.aiScore-a.aiScore).slice(0,2);
            el.innerHTML = scored.map(g => `<button onclick="openGatheringDetail(${g.id})" class="w-full text-left p-3 rounded-2xl bg-brand-ivory/60 border border-brand-ivoryDark hover:border-brand-sage transition-all"><div class="flex justify-between gap-2"><b class="text-xs text-brand-navy line-clamp-2">${escapeHTML(g.title)}</b><span class="shrink-0 text-[10px] font-bold text-brand-sageDark">${g.aiScore}%</span></div><p class="text-[10px] text-gray-500 mt-1 line-clamp-2">${escapeHTML(g.book || '')} · ${escapeHTML(g.schedule || '')}</p><p class="text-[10px] text-brand-sageDark mt-2">현재 대화의 관심 주제와 맞닿아 있어요.</p></button>`).join('');
        }

        function renderAIBookRecommendations(data) {
            const el = document.getElementById('ai-book-recommendations'); if (!el) return;
            const current = normalizeTitleKey(state.currentAIBook || data.book || '');
            const pool = [
                { title:'데미안', reason:'자아와 성장의 의미를 깊게 묻는 대화 흐름과 잘 맞아요.' },
                { title:'아몬드', reason:'인물의 감정과 공감의 방식을 함께 생각하기 좋아요.' },
                { title:'불편한 편의점', reason:'일상 속 관계와 회복을 현실 경험과 연결해 읽기 좋아요.' },
                { title:'소년이 온다', reason:'사회적 폭력과 기억의 문제를 진지하게 확장할 수 있어요.' },
                { title:'모모', reason:'시간, 관계, 삶의 속도에 대한 질문을 이어가기 좋아요.' },
                { title:'1984', reason:'사회 구조와 개인의 자유에 대한 토론으로 확장하기 좋아요.' },
                { title:'동물농장', reason:'권력과 사회 풍자를 짧고 선명하게 토론할 수 있어요.' },
                { title:'노인과 바다', reason:'인간의 의지와 고독을 상징적으로 읽기 좋아요.' }
            ].filter(b => normalizeTitleKey(b.title) !== current).slice(0,3);
            el.innerHTML = pool.map(b => `<button onclick="sendAIChip('${escapeAttr(b.title)}를 왜 추천하는지 설명해줘')" class="w-full text-left p-3 rounded-2xl bg-brand-ivory/60 border border-brand-ivoryDark hover:border-brand-sage transition-all"><b class="text-xs text-brand-navy">『${escapeHTML(b.title)}』</b><p class="text-[10px] text-gray-500 leading-relaxed mt-1">${escapeHTML(b.reason)}</p></button>`).join('');
        }

        function openAIShareModal(type = 'summary') {
            if (!state.aiChatHistory || state.aiChatHistory.length < 2) { showToast('공유할 대화가 없습니다.', 'error'); return; }
            const isFull = type === 'full';
            const text = isFull ? aiHistoryToPlainText(state.aiChatHistory) : summarizeAIConversation(1000);
            aiShareDraft = { type, text, title: isFull ? '전체 기록' : '대화 요약' };
            safeSetText('ai-share-modal-title', aiShareDraft.title);
            safeSetText('ai-share-modal-eyebrow', isFull ? 'FULL TRANSCRIPT' : 'SUMMARY · 1000자 이내');
            const area = document.getElementById('ai-share-modal-content'); if (area) area.value = text;
            const modal = document.getElementById('ai-share-modal');
            if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
            setTimeout(()=>{ try { lucide.createIcons(); } catch(e) {} },0);
        }

        function closeAIShareModal() { const modal=document.getElementById('ai-share-modal'); if(modal){ modal.classList.add('hidden'); modal.classList.remove('flex'); } }
        function copyAIShareContent() { const area=document.getElementById('ai-share-modal-content'); if(!area)return; area.select(); document.execCommand('copy'); showToast('내용을 복사했습니다.'); }
        function shareAIConversationAsNote() { const text=document.getElementById('ai-share-modal-content')?.value || aiShareDraft.text; showToast('쪽지 공유용 내용이 준비되었습니다.'); copyTextFallback(text); }
        function shareAIConversationAsLink() {
            if (isGuestUser()) { showGuestJoinPrompt('ai'); return; }
            const text=document.getElementById('ai-share-modal-content')?.value || aiShareDraft.text;
            state.socialPosts.unshift({ id: Date.now(), author: state.currentUser.nickname, time:'방금', category:'감상', book: state.currentAIBook || '', text: escapeHTML(`[AI 모아 ${aiShareDraft.title}]\n${text}`).replace(/\n/g,'<br>'), likes:0, liked:false, showComments:false, comments:[] });
            persistSocialState(); renderSocialFeed(); closeAIShareModal(); showToast('토론방에 공유 링크 형태로 등록했습니다.');
        }
        function copyTextFallback(text) { try { navigator.clipboard?.writeText(text); } catch(e) {} }

        function loadAIArchives() { try { return JSON.parse(localStorage.getItem(AI_ARCHIVE_KEY) || '[]'); } catch(e) { return []; } }
        function saveAIArchives(list) { localStorage.setItem(AI_ARCHIVE_KEY, JSON.stringify(list || [])); }
        function saveAIChatToArchive() {
            if (isGuestUser()) { showGuestJoinPrompt('archive'); return; }
            if (!state.aiChatHistory || state.aiChatHistory.length < 2) { showToast('저장할 대화가 없습니다.', 'error'); return; }
            const item = { id: Date.now(), title: `${state.currentAIBook || 'AI 독서 대화'} 기록`, book: state.currentAIBook || '', summary: summarizeAIConversation(1000), full: aiHistoryToPlainText(state.aiChatHistory), createdAt: new Date().toLocaleDateString('ko-KR') };
            const list = loadAIArchives(); saveAIArchives([item, ...list].slice(0, 30));
            state.recentArchives = [{ id: item.id, title: item.title, role: 'AI 대화', date: `${item.createdAt} 저장`, comments: 0 }, ...(state.recentArchives || [])].slice(0, 8);
            renderSavedAIArchives(); renderMyPageRecentArchives(); showToast('현재 대화가 내 아카이브에 저장되었습니다.');
        }

        function renderSavedAIArchives() {
            const view = document.getElementById('view-archive'); if (!view) return;
            let box = document.getElementById('saved-ai-archive-list');
            const list = loadAIArchives();
            if (!box) {
                const anchor = view.querySelector('.space-y-4');
                if (!anchor) return;
                box = document.createElement('div'); box.id = 'saved-ai-archive-list'; box.className = 'space-y-3';
                anchor.prepend(box);
            }
            if (!list.length) { box.innerHTML = ''; return; }
            box.innerHTML = `<div class="bg-white rounded-2xl border border-brand-sage/30 overflow-hidden shadow-sm"><div class="p-5 bg-brand-sageLight/40 border-b border-brand-ivoryDark"><h3 class="serif-title font-bold text-brand-navy">AI 모아 대화 아카이브</h3><p class="text-xs text-gray-500 mt-1">AI 독서파트너와 나눈 대화를 저장한 기록입니다.</p></div><div class="divide-y divide-brand-ivoryDark">${list.map(item=>`<div class="p-5"><div class="flex items-start justify-between gap-3"><div><span class="text-[10px] bg-brand-ivoryDark text-brand-navy px-2 py-0.5 rounded font-bold">${escapeHTML(item.createdAt || '저장됨')}</span><h4 class="font-bold text-brand-navy mt-1">${escapeHTML(item.title)}</h4><p class="text-xs text-gray-500 mt-1">${escapeHTML(item.book || '주제도서 미정')}</p></div><button onclick="openSavedAIArchive(${item.id})" class="px-3 py-2 rounded-xl bg-brand-navy text-white text-[11px] font-bold">보기</button></div><p class="text-xs text-gray-600 leading-relaxed mt-3 line-clamp-3">${escapeHTML(item.summary)}</p></div>`).join('')}</div></div>`;
        }
        function openSavedAIArchive(id) { const item=loadAIArchives().find(x=>x.id===id); if(!item)return; aiShareDraft={type:'full',title:item.title,text:item.full}; safeSetText('ai-share-modal-title', item.title); safeSetText('ai-share-modal-eyebrow','ARCHIVE RECORD'); const area=document.getElementById('ai-share-modal-content'); if(area) area.value = `요약
${item.summary}

전체 기록
${item.full}`; const modal=document.getElementById('ai-share-modal'); if(modal){modal.classList.remove('hidden');modal.classList.add('flex');} }

        function escapeAttr(value) { return String(value || '').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
