/* BOOKMATE RC8 - 인증 가능한 소속도서관 및 검색 연결 데이터 */
(function () {
  const libraries = [
    {
      id: 'national-library-of-korea',
      name: '국립중앙도서관',
      aliases: ['국립도서관'],
      homeUrl: 'https://www.nl.go.kr',
      buildSearchUrl(title) {
        return 'https://www.nl.go.kr/NL/contents/search.do?srchTarget=total&pageNum=1&pageSize=30&kwd=' + encodeURIComponent(title);
      }
    },
    {
      id: 'seoul-library',
      name: '서울도서관',
      aliases: ['서울시립도서관', '서울시립 도서관'],
      homeUrl: 'https://lib.seoul.go.kr',
      buildSearchUrl(title) {
        return 'https://lib.seoul.go.kr/search/tot/result?st=KWRD&si=TOTAL&sts=Y&lmt0=TOTAL&searchType=tot&q=' + encodeURIComponent(title);
      }
    },
    {
      id: 'gyeonggi-library',
      name: '경기도서관',
      aliases: ['전북대표도서관'],
      homeUrl: 'https://www.library.kr/ggl/main',
      buildSearchUrl(title) {
        const encoded = encodeURIComponent(title);
        return 'https://www.library.kr/ggl/search?searchKeyword=' + encoded + '&keyword=' + encoded;
      }
    },
    {
      id: 'iksan-library',
      name: '익산시립도서관',
      aliases: [],
      homeUrl: 'https://lib.iksan.go.kr/main',
      buildSearchUrl(title) {
        return 'https://lib.iksan.go.kr/main/site/search/bookSearch.do?cmd_name=bookandnonbooksearch&search_type=detail&search_item=search_title&search_txt=' + encodeURIComponent(title);
      }
    }
  ];

  function normalizeLibraryName(name) {
    const raw = String(name || '').trim();
    const found = libraries.find(item => item.name === raw || (item.aliases || []).includes(raw));
    return found ? found.name : raw;
  }

  function findLibrary(name) {
    const normalized = normalizeLibraryName(name);
    return libraries.find(item => item.name === normalized) || null;
  }

  window.BOOKMATE_LIBRARIES = libraries;
  window.normalizeBookmateLibraryName = normalizeLibraryName;
  window.findBookmateLibrary = findLibrary;
})();
