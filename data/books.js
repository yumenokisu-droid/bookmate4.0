/* BOOKMATE RC8 - 메인/AI/모임에서 함께 사용하는 기본 책 정보 */
(function () {
  const books = [
    {
      title: '작별인사', author: '김영하', publisher: '복복서가', publicationYear: '2022',
      category: ['소설', '한국소설', 'SF'], cover: 'assets/images/books/farewell.jpg',
      themes: ['인간다움', '기억', '존재', '선택', '관계'],
      description: '익숙했던 세계가 무너진 뒤 자신의 존재와 삶의 조건을 새롭게 마주하는 인물들의 이야기입니다. 인간다움이 기억에서 비롯되는지, 관계와 선택에서 완성되는지를 차분하게 묻습니다. 낯선 미래를 배경으로 상실과 작별의 의미를 되돌아보게 합니다.',
      recommendations: ['아몬드', '1984', '데미안'],
      scene: '철이가 자신이 인간이 아닐 수 있다는 사실과 마주하는 장면',
      question: '그 순간 철이가 내린 선택을 어떻게 보셨나요? 당신이라면 어떤 선택을 했을까요?'
    },
    {
      title: '달러구트 꿈 백화점', author: '이미예', publisher: '팩토리나인', publicationYear: '2020',
      category: ['소설', '장르소설', '판타지'], cover: 'assets/images/books/dallergut-purple.jpg',
      themes: ['꿈', '위로', '선택', '기억', '일상'],
      description: '잠든 사람만 들어갈 수 있는 꿈 백화점에서 신입사원 페니가 다양한 손님과 꿈 제작자들을 만나는 판타지 소설입니다. 꿈을 사고파는 독특한 세계관 안에 일상의 고민과 감정을 다정하게 담았습니다. 지친 독자에게 휴식과 작은 용기를 건네는 이야기입니다.',
      recommendations: ['불편한 편의점', '아몬드', '어린 왕자'],
      scene: '페니가 손님에게 꼭 필요한 꿈이 무엇인지 고민하는 장면',
      question: '지금의 당신에게 가장 필요한 꿈은 어떤 모습일까요?'
    },
    {
      title: '1984', author: '조지 오웰', publisher: '민음사', publicationYear: '2007',
      category: ['소설', '세계문학', '디스토피아'], cover: 'assets/images/books/1984-minumsa.jpg',
      themes: ['감시', '권력', '언어', '자유', '진실'],
      description: '개인의 행동뿐 아니라 생각과 언어까지 통제하는 전체주의 사회를 그린 디스토피아 고전입니다. 윈스턴의 저항과 좌절을 따라가며 권력이 진실을 어떻게 바꾸는지 보여줍니다. 자유와 기억, 인간의 존엄을 지키는 일이 무엇인지 질문하게 합니다.',
      recommendations: ['동물농장', '작별인사', '멋진 신세계'],
      scene: '윈스턴이 빅브라더의 감시 속에서도 자신의 생각을 기록하기 시작하는 장면',
      question: '기록하는 행위는 저항이 될 수 있을까요?'
    },
    {
      title: '데미안', author: '헤르만 헤세', publisher: '민음사', publicationYear: '2000',
      category: ['소설', '세계문학', '성장소설'], cover: 'assets/images/books/demian.jpg',
      themes: ['자아', '성장', '내면', '선악', '독립'],
      description: '싱클레어가 익숙한 가치와 규범을 벗어나 자기 안의 목소리를 찾아가는 성장소설입니다. 데미안과의 만남을 통해 선과 악, 밝음과 어둠이 공존하는 내면을 받아들입니다. 자기 자신에게 이르는 길이 왜 외롭고도 필요한지 보여줍니다.',
      recommendations: ['어린 왕자', '작별인사', '노인과 바다'],
      scene: '싱클레어가 익숙한 세계의 바깥으로 한 걸음 나아가는 장면',
      question: '성장을 위해 기존의 나를 깨뜨리는 경험이 꼭 필요할까요?'
    },
    {
      title: '아몬드', author: '손원평', publisher: '창비', publicationYear: '2017',
      category: ['소설', '한국소설', '청소년문학'], cover: 'assets/images/books/almond.jpg',
      themes: ['감정', '공감', '관계', '성장', '상처'],
      description: '감정을 잘 느끼고 표현하지 못하는 소년 윤재가 타인과 관계를 맺으며 변화하는 성장소설입니다. 서로 다른 상처를 가진 윤재와 곤의 만남을 통해 공감의 의미를 되묻습니다. 감정은 타고나는 것인지 관계 속에서 배우는 것인지 생각하게 합니다.',
      recommendations: ['작별인사', '불편한 편의점', '데미안'],
      scene: '윤재가 곤이의 감정을 이해하려고 처음으로 다가가는 장면',
      question: '공감은 타고나는 감정일까요, 관계 속에서 배우는 능력일까요?'
    },
    {
      title: '소년이 온다', author: '한강', publisher: '창비', publicationYear: '2014',
      category: ['소설', '한국문학', '역사소설'], cover: 'assets/images/books/human-acts.jpg',
      themes: ['기억', '폭력', '증언', '애도', '존엄'],
      description: '1980년 광주를 배경으로 한 소년과 남겨진 사람들의 목소리를 따라가는 장편소설입니다. 국가 폭력이 한 사람의 몸과 기억에 무엇을 남기는지 여러 시점으로 증언합니다. 잊지 않는 일과 애도하는 일의 의미를 깊이 되새기게 합니다.',
      recommendations: ['작별인사', '채식주의자', '1984'],
      scene: '동호가 남겨진 사람들을 위해 도청에 머무르기로 선택하는 장면',
      question: '그 선택을 책임감이라고 보시나요, 다른 이름의 사랑이라고 보시나요?'
    },
    {
      title: '노인과 바다', author: '어니스트 헤밍웨이', publisher: '민음사', publicationYear: '2012',
      category: ['소설', '세계문학', '고전'], cover: 'assets/images/books/old-man-and-the-sea.png',
      themes: ['존엄', '도전', '인내', '패배', '고독'],
      description: '오랫동안 고기를 잡지 못한 늙은 어부 산티아고가 거대한 청새치와 벌이는 사투를 그린 고전입니다. 결과를 잃더라도 끝까지 포기하지 않는 태도에서 인간의 존엄을 발견합니다. 성공과 패배를 바라보는 기준을 다시 생각하게 합니다.',
      recommendations: ['데미안', '어린 왕자', '1984'],
      scene: '산티아고가 거대한 청새치와 홀로 맞서는 장면',
      question: '결과를 잃었더라도 그 도전은 성공이었다고 말할 수 있을까요?'
    },
    {
      title: '불편한 편의점', author: '김호연', publisher: '나무옆의자', publicationYear: '2021',
      category: ['소설', '한국소설', '휴먼드라마'], cover: 'assets/images/books/uncomfortable-store.jpg',
      themes: ['연대', '위로', '일상', '관계'],
      description: '서울역 근처 작은 편의점을 배경으로 상처 입은 사람들이 서로에게 온기를 건네는 이야기입니다. 낯선 사람과의 만남이 일상을 조금씩 바꾸는 과정을 유쾌하고 따뜻하게 담았습니다. 공동체와 돌봄의 의미를 편안하게 생각하게 합니다.',
      recommendations: ['달러구트 꿈 백화점', '아몬드', '작별인사'],
      scene: '독고가 편의점의 손님과 직원들에게 조용히 도움을 건네는 장면',
      question: '작은 친절이 한 사람의 삶을 바꿀 수 있다고 느낀 순간이 있나요?'
    },
    {
      title: '어린 왕자', author: '앙투안 드 생텍쥐페리', publisher: '열린책들', publicationYear: '2015',
      category: ['소설', '세계문학', '우화'], cover: '', themes: ['관계', '사랑', '책임', '성장'],
      description: '여러 별을 여행하는 어린 왕자의 눈을 통해 어른들의 세계와 관계의 의미를 돌아보는 작품입니다. 소중한 존재를 알아보는 마음과 관계에 책임지는 태도를 간결한 문장에 담았습니다. 읽는 시기에 따라 새로운 의미를 발견하게 하는 고전입니다.',
      recommendations: ['데미안', '달러구트 꿈 백화점', '노인과 바다'], scene: '어린 왕자가 여우와 관계를 맺는 장면', question: '누군가와 관계를 맺는다는 것은 어떤 책임을 만드는 일일까요?'
    },
    {
      title: '동물농장', author: '조지 오웰', publisher: '민음사', publicationYear: '1998',
      category: ['소설', '세계문학', '우화'], cover: '', themes: ['권력', '혁명', '선전', '불평등'],
      description: '농장의 동물들이 인간을 몰아내고 새로운 질서를 세우지만 또 다른 권력에 지배되는 과정을 그린 정치 우화입니다. 이상이 어떻게 왜곡되고 언어가 권력의 도구로 바뀌는지 날카롭게 보여줍니다. 짧지만 토론할 주제가 풍부한 고전입니다.',
      recommendations: ['1984', '소년이 온다', '작별인사'], scene: '동물들이 처음 세운 원칙이 조금씩 바뀌는 장면', question: '공동체의 원칙은 누가, 어떻게 지켜야 할까요?'
    },
    {
      title: '82년생 김지영', author: '조남주', publisher: '민음사', publicationYear: '2016',
      category: ['소설', '한국소설', '사회소설'], cover: 'assets/images/books/82-kim-jiyoung.jpg', themes: ['일상', '돌봄', '노동', '성평등', '사회'],
      description: '평범한 여성 김지영의 삶을 따라가며 일상에 스며든 차별과 돌봄의 무게를 보여주는 소설입니다. 개인의 경험처럼 보이는 장면들이 사회 구조와 어떻게 연결되는지를 차분하게 드러냅니다. 서로 다른 세대의 삶과 목소리를 함께 이야기하게 만드는 작품입니다.',
      recommendations: ['불편한 편의점', '소년이 온다', '아몬드'], scene: '김지영의 일상 속 경험들이 가족과 사회의 구조로 이어지는 장면', question: '개인의 어려움이 사회의 문제로 보이기 시작한 순간은 언제였나요?'
    }
  ];
  window.BOOKMATE_BOOKS = books;
  window.BOOKMATE_BOOKS_BY_TITLE = books.reduce((acc, item) => { acc[item.title] = item; return acc; }, {});
})();
