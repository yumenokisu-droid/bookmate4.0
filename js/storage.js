        // 사용자가 만든 모임/책/서평/선택한 표지를 브라우저에 저장
        const BOOKMATE_STORAGE_KEY = 'bookmate_v1_2_state';
        const BOOKMATE_AVATAR_MIGRATION_KEY = 'bookmate_v1_9_avatar_moa1_migration_done';

        function saveAppState() {
            try {
                const snapshot = {
                    currentUser: state.currentUser,
                    recentBooks: state.recentBooks,
                    recentArchives: state.recentArchives,
                    gatherings: state.gatherings,
                    notifications: state.notifications,
                    socialPosts: state.socialPosts,
                    aiChatHistory: state.aiChatHistory,
                    currentAIBook: state.currentAIBook
                };
                localStorage.setItem(BOOKMATE_STORAGE_KEY, JSON.stringify(snapshot));
            } catch (e) {
                console.warn('BOOKMATE 저장 실패:', e);
            }
        }

        function loadAppState() {
            try {
                const raw = localStorage.getItem(BOOKMATE_STORAGE_KEY);
                if (!raw) return;
                const saved = JSON.parse(raw);
                ['currentUser', 'recentBooks', 'recentArchives', 'gatherings', 'notifications', 'socialPosts', 'aiChatHistory', 'currentAIBook'].forEach(key => {
                    if (saved[key] !== undefined) state[key] = saved[key];
                });
                // 기존 브라우저 저장값에서 '나'가 모아4 등으로 남아 있던 문제를 1회 보정합니다.
                // 사용자가 직접 첨부한 사진은 유지하고, 모아 기본값만 모아1로 맞춥니다.
                if (!localStorage.getItem(BOOKMATE_AVATAR_MIGRATION_KEY)) {
                    if (state.currentUser && state.currentUser.avatarType !== 'upload') {
                        state.currentUser.avatarType = 'moa';
                        state.currentUser.avatarId = 1;
                        state.currentUser.avatarImage = '';
                    }
                    localStorage.setItem(BOOKMATE_AVATAR_MIGRATION_KEY, '1');
                    try { saveAppState(); } catch(e) {}
                }
            } catch (e) {
                console.warn('BOOKMATE 저장 데이터 불러오기 실패:', e);
            }
        }

        function clearAppState() {
            localStorage.removeItem(BOOKMATE_STORAGE_KEY);
            showToast('저장된 데모 데이터가 초기화되었습니다. 새로고침하면 기본 상태로 돌아갑니다.');
        }

        function rememberSelectedBook(targetId, book) {
            const el = document.getElementById(targetId);
            if (!el || !book) return;
            el.dataset.bookTitle = book.title || '';
            el.dataset.bookAuthor = book.author || '';
            el.dataset.bookCover = book.thumbnail || '';
            el.dataset.bookPublisher = book.publisher || '';
            el.dataset.bookPublishedDate = book.publishedDate || '';
            el.dataset.bookIsbn = book.isbn || '';
        }

        function getSelectedBookMeta(targetId) {
            const el = document.getElementById(targetId);
            if (!el) return {};
            const typedTitle = (el.value || '').trim();
            const selectedTitle = (el.dataset.bookTitle || '').trim();
            // 사용자가 선택 후 제목을 직접 바꾼 경우, 이전 표지가 잘못 저장되지 않도록 메타데이터를 무시합니다.
            const isSameSelectedBook = selectedTitle && selectedTitle === typedTitle;
            return {
                title: typedTitle || selectedTitle || '',
                author: isSameSelectedBook ? (el.dataset.bookAuthor || '') : '',
                coverUrl: isSameSelectedBook ? (el.dataset.bookCover || '') : '',
                publisher: isSameSelectedBook ? (el.dataset.bookPublisher || '') : '',
                publishedDate: isSameSelectedBook ? (el.dataset.bookPublishedDate || '') : '',
                isbn: isSameSelectedBook ? (el.dataset.bookIsbn || '') : ''
            };
        }
