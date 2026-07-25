/* BOOKMATE RC15 - 소속도서관 허브/독서미션 공통 예시 데이터 */
(function () {
  const hubs = {
    '익산시립도서관': {
      intro: '도서관에서 발견한 책을 BOOKMATE에서 함께 읽고, 생각과 기록으로 이어가세요.',
      mission: {
        id: 'iksan-2026-08-korean-literature',
        label: '8월 독서미션',
        title: '우리 곁의 한국문학 한 권 읽기',
        description: '익산시립도서관 사서가 고른 한국문학 중 한 권을 읽고, 오래 남은 장면을 다른 독자들과 나눠보세요.',
        period: '2026. 8. 1. ~ 8. 31.',
        participants: 32,
        books: ['소년이 온다', '작별인사', '아몬드', '불편한 편의점'],
        steps: [
          { id: 'choose', title: '추천도서 한 권 선택하기', desc: '사서 추천 책장에서 마음에 드는 책을 골라요.' },
          { id: 'read', title: '읽은 책으로 등록하기', desc: '책을 다 읽은 뒤 내 서재에 읽은 책으로 등록해요.' },
          { id: 'reflect', title: '나의 생각 남기기', desc: '100자 독서기록, AI 대화 저장, 토론 참여 중 한 가지를 완료해요.' }
        ],
        rewards: [
          { icon: '🏅', title: '지역을 읽는 독자', type: '도서관 독서 배지' },
          { icon: '🖼️', title: '익산의 밤', type: '북라운지 액자' }
        ]
      },
      recommendations: ['소년이 온다', '작별인사', '아몬드', '불편한 편의점', '달러구트 꿈 백화점'],
      programs: [
        { type: '북토크', title: '한 문장으로 시작하는 우리들의 책 이야기', date: '8. 13.(목) 19:00', place: '영등도서관 시청각실', status: '신청 중' },
        { type: '독서모임', title: '인생갈피, 책에서 찾다', date: '격주 목요일 10:00', place: '영등도서관 문화교실 3', status: '운영 예정' },
        { type: '북큐레이션', title: '여름밤에 읽는 한국소설', date: '8. 1. ~ 8. 31.', place: '익산시립도서관 전시서가', status: '전시 중' }
      ],
      badges: [
        { icon: '🏛️', title: '익산시립도서관 인증 회원', kind: 'verified', desc: '소속도서관 인증 완료' },
        { icon: '📖', title: '한국문학 첫걸음', stepId: 'choose', desc: '8월 추천도서 선택 완료' },
        { icon: '✍️', title: '장면을 기록하는 독자', stepId: 'record', desc: '인상 깊은 장면 기록 완료' },
        { icon: '💬', title: '함께 읽는 북메이트', stepId: 'connect', desc: '다른 독자의 기록에 공감 완료' },
        { icon: '🌙', title: '지역을 읽는 독자', requiresAll: true, desc: '8월 독서미션 최종 완료' }
      ],
      stats: { missions: 3, programs: 2, badges: 1, books: 8 }
    },
    '서울도서관': {
      intro: '서울도서관의 장서와 프로그램을 BOOKMATE 독서활동으로 이어보세요.',
      mission: {
        id: 'seoul-2026-08-city-reading',
        label: '8월 독서미션',
        title: '도시를 바라보는 새로운 시선',
        description: '도시의 삶과 관계를 다룬 책 한 권을 읽고, 내가 사는 도시에서 발견한 장면을 기록해보세요.',
        period: '2026. 8. 1. ~ 8. 31.', participants: 48,
        books: ['불편한 편의점', '82년생 김지영', '1984', '아몬드'],
        steps: [
          { id: 'choose', title: '도시를 다룬 책 선택하기', desc: '추천 책장에서 한 권을 골라요.' },
          { id: 'record', title: '나의 도시 장면 기록하기', desc: '책과 연결되는 일상의 장면을 한 문단으로 남겨요.' },
          { id: 'connect', title: '서울 독자 기록 둘러보기', desc: '다른 참여자의 기록 한 편에 공감을 남겨요.' }
        ],
        rewards: [{ icon:'🏅', title:'도시를 읽는 독자', type:'도서관 독서 배지' }, { icon:'🪟', title:'서울의 창', type:'북라운지 창문 아이템' }]
      },
      recommendations: ['불편한 편의점', '82년생 김지영', '1984', '아몬드'],
      programs: [
        { type:'강연', title:'도시와 문학이 만나는 저녁', date:'8. 20.(목) 19:00', place:'서울도서관 생각마루', status:'신청 중' },
        { type:'독서모임', title:'서울을 읽는 사람들', date:'격주 토요일 14:00', place:'온라인', status:'모집 중' }
      ],
      badges: [{icon:'🏛️',title:'서울도서관 인증 회원',kind:'verified',desc:'소속도서관 인증 완료'},{icon:'📖',title:'도시 책 선택자',stepId:'choose',desc:'도시를 다룬 책 선택 완료'},{icon:'✍️',title:'도시 장면 기록자',stepId:'record',desc:'나의 도시 장면 기록 완료'},{icon:'🏙️',title:'도시를 읽는 독자',requiresAll:true,desc:'8월 독서미션 최종 완료'}],
      stats: { missions:2, programs:1, badges:2, books:6 }
    },
    '경기도서관': {
      intro: '경기도서관의 주제 큐레이션과 지역 독서공동체를 만나보세요.',
      mission: {
        id:'gyeonggi-2026-08-together', label:'8월 독서미션', title:'함께 살아가는 마음 읽기',
        description:'공감과 관계를 다룬 책을 읽고, 공동체를 더 따뜻하게 만드는 한 문장을 나눠보세요.',
        period:'2026. 8. 1. ~ 8. 31.', participants:39,
        books:['아몬드','불편한 편의점','달러구트 꿈 백화점','어린 왕자'],
        steps:[
          {id:'choose',title:'공감 도서 한 권 선택하기',desc:'추천도서에서 함께 읽을 책을 골라요.'},
          {id:'record',title:'마음을 움직인 문장 남기기',desc:'문장과 그 이유를 독서기록에 남겨요.'},
          {id:'connect',title:'다른 독자에게 다정한 댓글 남기기',desc:'같은 미션 참여자에게 댓글을 건네요.'}
        ],
        rewards:[{icon:'🏅',title:'함께 읽는 시민',type:'도서관 독서 배지'},{icon:'🌿',title:'마음의 정원',type:'북라운지 식물'}]
      },
      recommendations:['아몬드','불편한 편의점','달러구트 꿈 백화점','어린 왕자'],
      programs:[
        {type:'북큐레이션',title:'함께 살아가는 기술',date:'8. 1. ~ 8. 31.',place:'경기도서관 주제서가',status:'전시 중'},
        {type:'독서모임',title:'경기 북메이트 온라인 라운드',date:'매주 수요일 20:00',place:'온라인',status:'모집 중'}
      ],
      badges:[{icon:'🏛️',title:'경기도서관 인증 회원',kind:'verified',desc:'소속도서관 인증 완료'},{icon:'📖',title:'공감 도서 선택자',stepId:'choose',desc:'공감 도서 선택 완료'},{icon:'💚',title:'다정한 기록자',stepId:'record',desc:'마음을 움직인 문장 기록 완료'},{icon:'🌿',title:'함께 읽는 시민',requiresAll:true,desc:'8월 독서미션 최종 완료'}],
      stats:{missions:1,programs:1,badges:1,books:4}
    },
    '국립중앙도서관': {
      intro: '국가대표도서관의 깊이 있는 장서와 BOOKMATE의 대화를 연결합니다.',
      mission: {
        id:'nlk-2026-08-classic', label:'8월 독서미션', title:'시대를 건너온 고전 깊이 읽기',
        description:'오래 읽힌 고전 한 권을 선택하고, 오늘의 삶과 연결되는 질문을 기록해보세요.',
        period:'2026. 8. 1. ~ 8. 31.', participants:71,
        books:['1984','데미안','노인과 바다','동물농장'],
        steps:[
          {id:'choose',title:'고전 한 권 선택하기',desc:'국립중앙도서관 소장자료에서 책을 찾아요.'},
          {id:'record',title:'오늘의 질문 한 가지 기록하기',desc:'지금의 삶과 연결되는 질문을 남겨요.'},
          {id:'connect',title:'고전 토론에 참여하기',desc:'관련 토론방에 의견 한 편을 남겨요.'}
        ],
        rewards:[{icon:'🏅',title:'고전 탐험가',type:'도서관 독서 배지'},{icon:'🕰️',title:'시간의 서가',type:'북라운지 시계'}]
      },
      recommendations:['1984','데미안','노인과 바다','동물농장'],
      programs:[
        {type:'온라인 전시',title:'한국인이 사랑한 세계문학',date:'상시',place:'국립중앙도서관 누리집',status:'관람 가능'},
        {type:'강연',title:'고전을 오늘의 언어로 읽는 법',date:'8. 27.(목) 19:00',place:'온라인',status:'신청 중'}
      ],
      badges:[{icon:'🏛️',title:'국립중앙도서관 인증 회원',kind:'verified',desc:'소속도서관 인증 완료'},{icon:'📖',title:'고전 첫걸음',stepId:'choose',desc:'고전 한 권 선택 완료'},{icon:'❓',title:'오늘의 질문 기록자',stepId:'record',desc:'고전에서 발견한 질문 기록 완료'},{icon:'🕰️',title:'고전 탐험가',requiresAll:true,desc:'8월 독서미션 최종 완료'}],
      stats:{missions:2,programs:1,badges:1,books:5}
    }
  };

  window.BOOKMATE_LIBRARY_HUBS = hubs;
  window.getBookmateLibraryHub = function (libraryName) {
    const normalized = typeof window.normalizeBookmateLibraryName === 'function'
      ? window.normalizeBookmateLibraryName(libraryName)
      : String(libraryName || '').trim();
    return hubs[normalized] || hubs['익산시립도서관'];
  };
})();
