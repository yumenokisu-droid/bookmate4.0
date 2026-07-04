/* BOOKMATE 4.0 Foundation - 가계정/게스트 데이터
   가계정은 localStorage에 저장하지 않습니다. 이 파일을 수정하면 GitHub 배포본에 바로 반영됩니다. */
(function () {
  const guestMode = {
    nickname: "게스트 독자",
    library: "소속도서관 없음",
    message: "게스트로 BOOKMATE를 둘러보고 있습니다.",

    // 게스트 화면은 기본적으로 비워두는 것이 자연스럽습니다.
    recentBooks: [],
    recentArchives: [],
    joinedGatheringIds: [],
    loungeBookmates: [],
    loungeProgress: {
      completedBooks: 0,
      libraryVerified: 0,
      aiDebates: 0,
      discussionPosts: 0,
      bookmates: 0,
      joinedGatherings: 0,
      guestbookWrites: 0,
      liveMeetings: 0
    }
  };
  const accounts = [
    {
      id: "book01",
      password: "1234",
      name: "김도윤",
      nickname: "달빛독서가",
      library: "익산시립도서관",
      libraryVerified: true,
      avatarType: "moa",
      avatarId: 1,
      tastes: ["소설", "에세이", "인문"],
      readingType: "인물의 심리와 관계를 따라 읽는 독자",
      readingTypeIcon: "📚",
      role: "따뜻한 감상글 · 독서모임 참여",
      readBooksCount: 8,
      gatheringCount: 3,
      chatMessagesCount: 540,

      // 이 계정으로 로그인했을 때 보이는 내서재입니다.
      recentBooks: [
        {
          id: 1,
          title: "불편한 편의점",
          author: "김호연",
          date: "2026.06.20 완독",
          review: "따뜻한 연대와 위로가 느껴지는 책. 골목길 편의점이 주는 일상의 기적.",
          color: "bg-[#2A4365]"
        },
        {
          id: 2,
          title: "데미안",
          author: "헤르만 헤세",
          date: "2026.05.10 완독",
          review: "알을 깨고 나오는 고통. 내 안의 목소리를 듣는 과정에 대하여.",
          color: "bg-[#285E61]"
        },
        {
          id: 3,
          title: "아몬드",
          author: "손원평",
          date: "2026.04.28 완독",
          review: "감정을 배워가는 소년의 이야기를 통해 공감의 의미를 다시 생각하게 하는 책.",
          color: "bg-[#7C2D12]"
        }
      ],

      // 이 계정으로 로그인했을 때 보이는 아카이브입니다.
      recentArchives: [
        {
          id: 1,
          title: "데미안 자아 탐구 모임",
          role: "참여자",
          date: "2026.05.10 종료",
          comments: 42
        },
        {
          id: 2,
          title: "AI 모아와 나눈 어린 왕자 대화",
          role: "AI 대화",
          date: "2026.07.03 저장",
          comments: 0
        }
      ],

      // 전체 gatherings 중 이 계정이 가입한 모임 id입니다.
      joinedGatheringIds: [1, 2],
      leadingGatheringIds: [1],

      // 이 계정의 북라운지 북메이트입니다.
      loungeBookmates: [
        { name: "사유올빼미", status: "active", since: "2026.05.13", gathering: "데미안 자아 탐구 모임", avatarType: "moa", avatarId: 2 },
        { name: "지혜의등대", status: "active", since: "2026.06.01", gathering: "한국문학 감상 소모임", avatarType: "moa", avatarId: 4 },
        { name: "책읽는기린", status: "active", since: "2026.06.14", gathering: "아몬드 공감 감각 모임", avatarType: "moa", avatarId: 3 }
      ],

      loungeProgress: {
        completedBooks: 3,
        libraryVerified: 1,
        aiDebates: 3,
        discussionPosts: 2,
        bookmates: 3,
        joinedGatherings: 2,
        guestbookWrites: 1,
        liveMeetings: 1
      }
    },

    {
      id: "book02",
      password: "1234",
      name: "이서윤",
      nickname: "사유올빼미",
      library: "전북대표도서관",
      libraryVerified: true,
      avatarType: "moa",
      avatarId: 2,
      tastes: ["철학", "심리", "인문"],
      readingType: "질문을 통해 생각을 확장하는 독자",
      readingTypeIcon: "🧠",
      role: "깊은 댓글 · 사유형 독자",
      readBooksCount: 35,
      gatheringCount: 2,
      chatMessagesCount: 856,
      recentBooks: [
        { id: 1, title: "데미안", author: "헤르만 헤세", date: "2026.06.11 완독", review: "자기 자신에게 이르는 길을 질문하게 만든 고전.", color: "bg-[#285E61]" },
        { id: 2, title: "동물농장", author: "조지 오웰", date: "2026.05.26 완독", review: "권력과 언어의 관계를 날카롭게 바라보게 하는 우화.", color: "bg-[#4B5563]" }
      ],
      recentArchives: [
        { id: 1, title: "데미안 자아 탐구 독서모임", role: "발제자", date: "2026.06.15 종료", comments: 31 }
      ],
      joinedGatheringIds: [2],
      leadingGatheringIds: [2],
      loungeBookmates: [
        { name: "달빛독서가", status: "active", since: "2026.05.13", gathering: "데미안 자아 탐구 모임", avatarType: "moa", avatarId: 1 }
      ],
      loungeProgress: {
        completedBooks: 2,
        libraryVerified: 1,
        aiDebates: 4,
        discussionPosts: 5,
        bookmates: 1,
        joinedGatherings: 1,
        guestbookWrites: 2,
        liveMeetings: 0
      }
    },

    {
      id: "book03",
      password: "1234",
      name: "박민준",
      nickname: "책읽는기린",
      library: "소속도서관 없음",
      libraryVerified: false,
      avatarType: "moa",
      avatarId: 3,
      tastes: ["판타지", "SF", "추리"],
      readingType: "세계관과 사건의 구조를 탐색하는 독자",
      readingTypeIcon: "🚀",
      role: "장르 독서 · 신간 추천",
      readBooksCount: 21,
      gatheringCount: 1,
      chatMessagesCount: 698,
      recentBooks: [
        { id: 1, title: "1984", author: "조지 오웰", date: "2026.06.01 완독", review: "감시 사회와 언어 통제에 대한 불안을 선명하게 느꼈다.", color: "bg-[#111827]" }
      ],
      recentArchives: [],
      joinedGatheringIds: [3],
      leadingGatheringIds: [],
      loungeBookmates: [],
      loungeProgress: {
        completedBooks: 1,
        libraryVerified: 0,
        aiDebates: 1,
        discussionPosts: 0,
        bookmates: 0,
        joinedGatherings: 1,
        guestbookWrites: 0,
        liveMeetings: 0
      }
    },

    {
      id: "book04",
      password: "1234",
      name: "최유진",
      nickname: "지혜의등대",
      library: "서울시립도서관",
      libraryVerified: true,
      avatarType: "moa",
      avatarId: 4,
      tastes: ["사회", "경제", "자기계발"],
      readingType: "책의 주제를 현실 문제와 연결하는 독자",
      readingTypeIcon: "💼",
      role: "토론 리더 · 질문글 작성",
      readBooksCount: 74,
      gatheringCount: 4,
      chatMessagesCount: 967,
      recentBooks: [
        { id: 1, title: "동물농장", author: "조지 오웰", date: "2026.06.22 완독", review: "권력이 어떻게 언어를 바꾸고 사람들을 움직이는지 생각하게 했다.", color: "bg-[#365314]" },
        { id: 2, title: "작별인사", author: "김영하", date: "2026.05.19 완독", review: "인간다움과 기술의 경계에 대해 묻게 하는 이야기.", color: "bg-[#334155]" }
      ],
      recentArchives: [
        { id: 1, title: "동물농장 사회비평 모임", role: "진행자", date: "2026.06.25 종료", comments: 27 }
      ],
      joinedGatheringIds: [1, 4],
      leadingGatheringIds: [4],
      loungeBookmates: [
        { name: "달빛독서가", status: "active", since: "2026.06.01", gathering: "한국문학 감상 소모임", avatarType: "moa", avatarId: 1 },
        { name: "사유올빼미", status: "active", since: "2026.06.03", gathering: "데미안 자아 탐구 모임", avatarType: "moa", avatarId: 2 }
      ],
      loungeProgress: {
        completedBooks: 2,
        libraryVerified: 1,
        aiDebates: 3,
        discussionPosts: 5,
        bookmates: 2,
        joinedGatherings: 2,
        guestbookWrites: 4,
        liveMeetings: 2
      }
    }
  ];
  window.BOOKMATE_GUEST_MODE = guestMode;
  window.BOOKMATE_ACCOUNTS = accounts;
})();
