// API Key 설정 - Canvas 환경에서 자동 연동
        const apiKey = ""; 

        const state = {
            currentUser: {
                nickname: '달빛독서가',
                library: '익산시립도서관',
                avatarType: 'moa',
                avatarId: 1,
                avatarImage: '',
                readBooksCount: 47,
                gatheringCount: 3,
                chatMessagesCount: 1284
            },
            aiChatHistory: [],
            aiChatTurns: 0,
            currentAIBook: '',
            currentAIMode: 'debate',
            currentView: 'home',
            searchedQuery: '',
            createGatheringState: {
                scope: '공개',
                type: '정기모임',
                method: '온라인',
                keywords: []
            },
            activeSocialCategory: '감상',
            socialFilter: '전체',
            meetingState: {
                myMicOn: true,
                myCamOn: false,
                currentAiStage: 1,
                readyMembersCount: 0,
                promptResponses: 0
            },
            notifications: [
                { id: 1, type: 'hello', from: '사유올빼미', initial: '사', message: '달러구트 모임에서 좋은 말씀 감사했어요!', time: '10분 전', isRead: false },
                { id: 2, type: 'invite_rx', from: '지혜의등대', initial: '지', gathering: '사피엔스: 인간 본성의 비밀 추적', message: '사피엔스 모임에 초대합니다. 성향이 잘 맞으실 일 것 같아요!', time: '2시간 전', isRead: false },
                { id: 3, type: 'invite_tx', to: '한줄수집가', initial: '한', gathering: '도둑맞은 집중력 회복 모임', status: '수락 대기중', time: '1일 전', isRead: true }
            ],
            recentBooks: [
                { id: 1, title: "불편한 편의점", author: "김호연", date: "2026.06.20 완독", review: "따뜻한 연대와 위로가 느껴지는 책. 골목길 편의점이 주는 일상의 기적.", color: "bg-[#2A4365]" },
                { id: 2, title: "사피엔스", author: "유발 하라리", date: "2026.06.12 완독", review: "인류가 만들어 온 거대한 이야기와 사회의 질서를 새롭게 바라보게 해준 책.", color: "bg-[#374151]" },
                { id: 3, title: "달러구트 꿈 백화점", author: "이미예", date: "2026.05.28 완독", review: "꿈을 사고파는 세계를 통해 지친 일상에 다정한 위로를 건네는 이야기.", color: "bg-[#701A24]" },
                { id: 4, title: "데미안", author: "헤르만 헤세", date: "2026.05.10 완독", review: "알을 깨고 나오는 고통. 내 안의 목소리를 듣는 과정에 대하여.", color: "bg-[#285E61]" },
                { id: 5, title: "아몬드", author: "손원평", date: "2026.04.28 완독", review: "감정을 배워가는 소년의 이야기를 통해 공감의 의미를 다시 생각하게 하는 책.", color: "bg-[#7C2D12]" },
                { id: 6, title: "채식주의자", author: "한강", date: "2026.04.12 완독", review: "개인의 선택과 폭력, 침묵의 감각을 강렬하게 남기는 소설.", color: "bg-[#365314]" },
                { id: 7, title: "82년생 김지영", author: "조남주", date: "2026.03.26 완독", review: "평범한 일상 속에 숨어 있던 구조적 문제를 선명하게 바라보게 하는 책.", color: "bg-[#334155]" }
            ],
            recentArchives: [
                { id: 1, title: "데미안 자아 탐구 모임", role: "발제자", date: "2026.05.10 종료", comments: 42 },
                { id: 2, title: "이기적 유전자 심층 토론", role: "참여자", date: "2026.04.22 종료", comments: 18 }
            ],
            gatherings: [
                {
                    id: 1,
                    title: "달러구트 꿈 백화점 사색 소모임",
                    book: "달러구트 꿈 백화점",
                    author: "이미예",
                    membersCount: 6,
                    maxMembers: 10,
                    scope: "공개",
                    type: "정기모임",
                    method: "온라인",
                    schedule: "매주 목요일 21:00",
                    suitability: 94,
                    desc: "현실의 노곤함을 내려놓고 포근한 꿈 백화점 속 단골손님들의 이야기를 나눕니다.",
                    keywords: ["힐링/에세이", "소설/문학"],
                    joined: true,
                    isLeader: true
                },
                {
                    id: 2,
                    title: "사피엔스: 인간 본성의 비밀 추적",
                    book: "사피엔스",
                    author: "유발 하라리",
                    membersCount: 12,
                    maxMembers: 15,
                    scope: "공개",
                    type: "정기모임",
                    method: "오프라인",
                    schedule: "격주 토요일 14:00",
                    suitability: 89,
                    desc: "인지혁명부터 이르는 사피엔스의 전반적 흐름 속에서 우리가 당연시 여기는 사회적 질서를 비평해 봅니다.",
                    keywords: ["인문학", "사회/과학"],
                    joined: true
                },
                {
                    id: 3,
                    title: "직장인 도둑맞은 집중력 회복 모임",
                    book: "도둑맞은 집중력",
                    author: "요한 하리",
                    membersCount: 4,
                    maxMembers: 8,
                    scope: "도서관 전용",
                    library: "익산시립도서관",
                    type: "정기모임",
                    method: "오프라인",
                    schedule: "매주 수요일 19:30",
                    suitability: 92,
                    desc: "스마트폰에 빼앗긴 집중력을 되찾기 위해 도서관 모임방에 모여 2시간씩 집중 독서 후 짧은 토론을 진행합니다.",
                    keywords: ["자기계발", "사회/과학"],
                    joined: true
                },
                {
                    id: 4,
                    title: "불편한 편의점: 일상의 위로를 나누는 모임",
                    book: "불편한 편의점",
                    author: "김호연",
                    membersCount: 15,
                    maxMembers: 20,
                    scope: "공개",
                    type: "1회성",
                    method: "온라인",
                    schedule: "7월 15일(토) 20:00",
                    suitability: 85,
                    desc: "편의점이라는 익숙한 공간 속에서 만나는 사람들의 상처와 회복, 일상의 위로를 함께 나눕니다.",
                    keywords: ["소설/문학", "인문학"],
                    joined: false
                },
                {
                    id: 5,
                    title: "집중력 회복 북클럽 (서울시립 전용)",
                    book: "도둑맞은 집중력",
                    author: "요한 하리",
                    membersCount: 10,
                    maxMembers: 12,
                    scope: "도서관 전용",
                    library: "서울시립 도서관",
                    type: "정기모임",
                    method: "온라인",
                    schedule: "격주 금요일 21:00",
                    suitability: 78,
                    desc: "디지털 환경 속에서 흐트러진 집중력을 회복하고, 나만의 몰입 루틴을 함께 찾아가는 모임입니다. (서울시립도서관 인증 회원 전용)",
                    keywords: ["자기계발", "힐링/에세이"],
                    joined: false
                },
                {
                    id: 6,
                    title: "데미안 자아 탐구 독서모임",
                    book: "데미안",
                    author: "헤르만 헤세",
                    membersCount: 7,
                    maxMembers: 10,
                    scope: "공개",
                    type: "정기모임",
                    method: "오프라인",
                    schedule: "매월 첫째주 일요일 15:00",
                    suitability: 95,
                    desc: "자기 내면의 목소리와 성장의 의미를 함께 읽고 나누는 고전 문학 독서모임입니다.",
                    keywords: ["소설/문학", "사회/과학"],
                    joined: false
                },
                {
                    id: 7,
                    title: "아몬드: 공감 감각을 깨우는 모임",
                    book: "아몬드",
                    author: "손원평",
                    membersCount: 9,
                    maxMembers: 12,
                    scope: "공개",
                    type: "1회성",
                    method: "온라인",
                    schedule: "7월 20일(월) 20:00",
                    suitability: 91,
                    desc: "감정을 느끼고 표현하는 방식, 공감의 언어를 함께 나누는 소설 독서모임입니다.",
                    keywords: ["소설/문학", "힐링/에세이"],
                    joined: false
                },
                {
                    id: 8,
                    title: "채식주의자 깊이 읽기",
                    book: "채식주의자",
                    author: "한강",
                    membersCount: 6,
                    maxMembers: 10,
                    scope: "공개",
                    type: "정기모임",
                    method: "오프라인",
                    schedule: "격주 화요일 19:00",
                    suitability: 87,
                    desc: "인간의 욕망과 폭력, 침묵의 감각을 문장 단위로 천천히 읽어봅니다.",
                    keywords: ["소설/문학", "인문학"],
                    joined: false
                },
                {
                    id: 9,
                    title: "82년생 김지영 사회 읽기",
                    book: "82년생 김지영",
                    author: "조남주",
                    membersCount: 11,
                    maxMembers: 15,
                    scope: "도서관 전용",
                    library: "익산시립도서관",
                    type: "1회성",
                    method: "온라인",
                    schedule: "7월 27일(월) 21:00",
                    suitability: 84,
                    desc: "소설 속 일상 장면을 통해 세대, 돌봄, 노동의 문제를 차분히 이야기합니다.",
                    keywords: ["소설/문학", "사회/과학"],
                    joined: false
                }
            ],
            socialPosts: [
                {
                    id: 101,
                    author: "사유올빼미",
                    authorInitial: "사",
                    time: "3분 전",
                    category: "추천",
                    book: "달러구트 꿈 백화점",
                    text: "지친 하루의 끝에 이 소설을 읽으며 나만의 꿈 보관함을 채우는 상상을 했어요. 현실을 치유하고 싶으신가요? 이 책 강력히 추천합니다!",
                    likes: 12,
                    liked: false,
                    showComments: true,
                    comments: [
                        {
                            id: 201, author: "지혜의등대", text: "저도 정말 재미있게 읽었습니다! 힐링이 필요할 때 딱이죠.", time: "1분 전", likes: 2, liked: false, 
                            showReplyInput: false,
                            replies: [
                                { id: 301, author: "사유올빼미", text: "맞아요, 특히 페니가 처음 출근할 때 묘사가 참 좋았어요.", time: "방금", likes: 1, liked: false }
                            ]
                        }
                    ]
                },
                {
                    id: 102,
                    author: "지혜의등대",
                    authorInitial: "지",
                    time: "15분 전",
                    category: "질문",
                    book: "사피엔스",
                    text: "인지혁명 파트 읽고 있는데, 허구를 믿는 능력이 인류를 지배자로 만들었다는 부분이 잘 이해가 안 가네요. 다르게 해석하신 분 계신가요?",
                    likes: 5,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 103,
                    author: "책읽는고양이",
                    authorInitial: "책",
                    time: "1시간 전",
                    category: "추천",
                    book: "도둑맞은 집중력",
                    text: "요즘 스마트폰 때문에 책 읽기 힘들었는데, 이 책 읽고 디지털 디톡스 시작했습니다. 현대인들 필수 권장 도서입니다. 추천해요!",
                    likes: 24,
                    liked: true,
                    showComments: false,
                    comments: []
                },
                {
                    id: 104,
                    author: "활자유목민",
                    authorInitial: "활",
                    time: "2시간 전",
                    category: "추천",
                    book: "달러구트 꿈 백화점",
                    text: "주말에 몰아봤는데, 잠들기 전에 읽기 너무 좋은 소설이네요. 추천 꾹 누르고 갑니다.",
                    likes: 8,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 105,
                    author: "밤의독서가",
                    authorInitial: "밤",
                    time: "3시간 전",
                    category: "감상",
                    book: "채식주의자",
                    text: "읽는 내내 불편했지만, 그 불편함이 오래 남는 책이었습니다. 한 사람의 선택을 둘러싼 주변의 시선이 이렇게 무겁게 느껴질 수 있다는 점이 인상 깊었어요.",
                    likes: 31,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 106,
                    author: "문장수집가",
                    authorInitial: "문",
                    time: "4시간 전",
                    category: "감상",
                    book: "불편한 편의점",
                    text: "거창한 위로가 아니라, 편의점 불빛처럼 작고 가까운 위로가 좋았습니다. 주변 사람을 조금 다르게 바라보게 만드는 책이네요.",
                    likes: 19,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 107,
                    author: "책읽는고양이",
                    authorInitial: "책",
                    time: "5시간 전",
                    category: "추천",
                    book: "아몬드",
                    text: "청소년 소설로 분류되지만 어른들이 읽어도 생각할 거리가 많아요. 감정을 배워가는 과정이 담백해서 더 좋았습니다.",
                    likes: 27,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 108,
                    author: "지혜의등대",
                    authorInitial: "지",
                    time: "어제",
                    category: "질문",
                    book: "82년생 김지영",
                    text: "이 책을 개인의 이야기로 읽는 것과 사회 구조의 이야기로 읽는 것 사이에서 의견이 많이 갈리더라고요. 여러분은 어느 쪽에 더 가까우셨나요?",
                    likes: 14,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 109,
                    author: "초록책갈피",
                    authorInitial: "초",
                    time: "어제",
                    category: "추천",
                    book: "데미안",
                    text: "나를 흔드는 문장이 필요한 시기에 읽으면 좋은 고전입니다. 독서모임에서 같이 읽으면 대화가 정말 풍성해져요.",
                    likes: 22,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 110,
                    author: "밤의독서가",
                    authorInitial: "밤",
                    time: "2일 전",
                    category: "질문",
                    book: "코스모스",
                    text: "과학책을 어렵지 않게 읽는 방법이 있을까요? 코스모스는 문장은 아름다운데 분량 때문에 자꾸 멈추게 됩니다.",
                    likes: 11,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 111,
                    author: "문장수집가",
                    authorInitial: "문",
                    time: "2일 전",
                    category: "함께 읽어요",
                    scope: "내 도서관",
                    visibility: "library",
                    library: "익산시립도서관",
                    book: "불편한 편의점",
                    text: "익산시립도서관에서 『불편한 편의점』으로 오프라인 독서모임 해보실 분 계신가요? 가볍게 감상부터 나누면 좋겠어요.",
                    likes: 16,
                    liked: false,
                    showComments: false,
                    comments: []
                },
                {
                    id: 112,
                    author: "초록책갈피",
                    authorInitial: "초",
                    time: "3일 전",
                    category: "함께 읽어요",
                    scope: "전체",
                    visibility: "public",
                    library: "국립도서관",
                    book: "데미안",
                    text: "『데미안』은 혼자 읽는 것보다 같이 이야기할 때 훨씬 풍성해지는 책 같아요. 함께 읽고 각자의 ‘알을 깨는 순간’을 나눠보고 싶습니다.",
                    likes: 21,
                    liked: false,
                    showComments: false,
                    comments: []
                }
            ]
        };

        const meetingDialogueScript = {
            1: {
                message: "안녕하세요! 오늘 저희가 함께 나눌 소중한 책은 『달러구트 꿈 백화점』입니다. 다들 가벼운 인사를 건네며 대화를 시작해 볼까요?",
                stageLabel: "1단계: 반가운 환영 인사 중",
                actions: `<button onclick="meetingUserAct('greet')" class="bg-brand-sage hover:bg-brand-sageDark text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all">👋 반갑게 인사 나누기</button>`
            },
            2: {
                message: "본격적인 토론에 앞서 아이스브레이킹 시간을 가져보겠습니다. 오늘 밤 어떤 꿈을 꾸고 싶으신지 나누어 주세요!",
                stageLabel: "2단계: 아이스브레이킹",
                actions: `
                    <button onclick="meetingUserAct('ice1')" class="bg-brand-ivoryDark hover:bg-brand-ivoryDark/80 text-brand-navy text-[11px] font-bold px-3 py-2 rounded-xl border border-brand-ivoryDark">🌌 하늘을 나는 꿈</button>
                    <button onclick="proceedToNextStage()" class="bg-brand-navy hover:bg-brand-navyLight text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow">준비완료! 토론 시작 🚀</button>
                `
            },
            3: {
                message: "오늘 모임은 발제 3가지로 이루어져 있습니다. 첫 번째 발제 질문으로 이동하겠습니다!",
                stageLabel: "3단계: 모임 아젠다 브리핑",
                actions: `<button onclick="proceedToNextStage()" class="bg-brand-navy hover:bg-brand-navyLight text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow">첫 번째 토론 열기 🔑</button>`
            },
            4: {
                message: "첫 번째 질문입니다. 달러구트 백화점의 손님이라면, 어떤 종류의 꿈을 사고 싶으신가요?",
                stageLabel: "4단계: 발제 1 - 내가 사고 싶은 꿈",
                actions: `<button onclick="meetingUserAct('p1_opt1')" class="bg-brand-ivoryDark hover:bg-brand-ivoryDark/80 text-brand-navy text-[10px] font-semibold px-3 py-2 rounded-xl border border-brand-ivoryDark">"그리운 사람 만나는 꿈"</button>`
            },
            5: {
                message: "두 번째 질문입니다. 악몽이 우리 현실의 회복에 정말 도움이 된다고 생각하시나요?",
                stageLabel: "5단계: 발제 2 - 악몽의 역설적 가치",
                actions: `<button onclick="proceedToNextStage()" class="bg-brand-navy text-white text-xs font-bold px-5 py-2.5 rounded-xl">다음 발제</button>`
            },
            6: {
                message: "세 번째 질문입니다. 당신을 전진하게 만드는 에너지는 과거에서 오나요, 미래에서 오나요?",
                stageLabel: "6단계: 발제 3 - 삶을 움직이는 원동력",
                actions: `<button onclick="proceedToNextStage()" class="bg-brand-navy text-white text-xs font-bold px-5 py-2.5 rounded-xl">종료 및 요약</button>`
            },
            7: {
                message: "오늘 모임원분들과 나눈 따뜻한 무의식과 꿈의 사색에 감사드립니다. 아카이빙 서첩으로 기록하며 모임을 마칩니다.",
                stageLabel: "7단계: 총평 및 모임 종료 아카이빙",
                actions: `<button onclick="archiveAndEndMeeting()" class="bg-brand-navy text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg animate-bounce">🔒 요약본 저장 및 아카이브 서첩 발행</button>`
            }
        };
