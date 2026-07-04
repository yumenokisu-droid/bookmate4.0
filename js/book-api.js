// BOOKMATE v1.4H: CoverManager - direct JPG COVER_MAP first, verified fallback pipeline, cache rebuild.
function googleIsbnCover(isbn, zoom = 2) {
    return `https://books.google.com/books?vid=ISBN${cleanIsbn(isbn)}&printsec=frontcover&img=1&zoom=${zoom}&source=gbs_api`;
}

const COVER_CACHE_VERSION = '2026-06-26-v1.4h-cover-map-first';

const DIRECT_COVER_MAP = {
    // 검증 완료: 브라우저 <img>에서 바로 표시되는 image.aladin.co.kr 직접 JPG 주소만 사용합니다.
    "사피엔스": "https://image.aladin.co.kr/product/31424/4/cover500/k482832219_1.jpg",
    "달러구트 꿈 백화점": "https://image.aladin.co.kr/product/24512/70/cover/k392630952_1.jpg",
    "도둑맞은 집중력": "https://image.aladin.co.kr/product/31559/97/cover500/s102936816_3.jpg",
    "불편한 편의점": "https://image.aladin.co.kr/product/26942/84/cover500/k582730818_1.jpg",
    "데미안": "https://image.aladin.co.kr/product/26/0/cover500/s452139198_1.jpg",
    "아몬드": "https://image.aladin.co.kr/product/31893/32/cover500/k212833749_2.jpg",
    "채식주의자": "https://image.aladin.co.kr/product/29137/2/cover500/8936434594_2.jpg",
    "82년생 김지영": "https://image.aladin.co.kr/product/9476/48/cover500/8937473135_1.jpg"
};

function getDirectCoverByTitle(title) {
    const key = normalizeTitleKey(title);
    if (!key) return '';
    for (const [coverTitle, url] of Object.entries(DIRECT_COVER_MAP)) {
        const coverKey = normalizeTitleKey(coverTitle);
        if (key === coverKey || key.includes(coverKey) || coverKey.includes(key)) return url;
    }
    return '';
}

const KNOWN_BOOKS = {
    // 시연 화면의 핵심 도서는 API보다 먼저 검증된 실제 표지 URL을 우선 사용합니다.
    "사피엔스": { author: "유발 하라리", isbn: "9788934972464", alternateIsbns: ["9788934972464", "9788934972624", "9788934972976"], category: "인문·사회", fixedCoverUrl: "https://image.aladin.co.kr/product/31424/4/cover500/k482832219_1.jpg" },
    "달러구트 꿈 백화점": { author: "이미예", isbn: "9791165341909", alternateIsbns: ["9791165341909"], category: "소설", fixedCoverUrl: "https://image.aladin.co.kr/product/24512/70/cover/k392630952_1.jpg" },
    "도둑맞은 집중력": { author: "요한 하리", isbn: "9791167740984", alternateIsbns: ["9791167740984", "9791167740991"], category: "사회·과학", fixedCoverUrl: "https://image.aladin.co.kr/product/31559/97/cover500/s102936816_3.jpg" },
    "아주 작은 습관의 힘": { author: "제임스 클리어", isbn: "9791162540640", alternateIsbns: ["9791162540640"], category: "자기계발" },
    "불편한 편의점": { author: "김호연", isbn: "9791161571188", alternateIsbns: ["9791161571188"], category: "소설", fixedCoverUrl: "https://image.aladin.co.kr/product/26942/84/cover500/k582730818_1.jpg" },
    "역행자": { author: "자청", isbn: "9791191043761", alternateIsbns: ["9791191043761", "9791191891207"], category: "자기계발" },
    "모순": { author: "양귀자", isbn: "9788998441012", alternateIsbns: ["9788998441012"], category: "소설" },
    "데미안": { author: "헤르만 헤세", isbn: "9788937460449", alternateIsbns: ["9788937460449", "9788937460005", "9788937462344"], category: "고전", fixedCoverUrl: "https://image.aladin.co.kr/product/26/0/cover500/s452139198_1.jpg" },
    "노인과 바다": { author: "어니스트 헤밍웨이", isbn: "9788937462788", alternateIsbns: ["9788937462788"], category: "고전" },
    "클라라와 태양": { author: "가즈오 이시구로", isbn: "9788937417566", alternateIsbns: ["9788937417566"], category: "소설" },
    "이기적 유전자": { author: "리처드 도킨스", isbn: "9788932471631", alternateIsbns: ["9788932471631", "9788932473901"], category: "과학" },
    "아몬드": { author: "손원평", isbn: "9788936434267", alternateIsbns: ["9788936434267"], category: "소설", fixedCoverUrl: "https://image.aladin.co.kr/product/31893/32/cover500/k212833749_2.jpg" },
    "소년이 온다": { author: "한강", isbn: "9788936434120", alternateIsbns: ["9788936434120"], category: "소설" },
    "채식주의자": { author: "한강", isbn: "9788936433598", alternateIsbns: ["9788936433598", "9788936434595"], category: "소설", fixedCoverUrl: "https://image.aladin.co.kr/product/29137/2/cover500/8936434594_2.jpg" },
    "82년생 김지영": { author: "조남주", isbn: "9788937473135", alternateIsbns: ["9788937473135"], category: "소설", fixedCoverUrl: "https://image.aladin.co.kr/product/9476/48/cover500/8937473135_1.jpg" },
    "미드나잇 라이브러리": { author: "매트 헤이그", isbn: "9791191056556", alternateIsbns: ["9791191056556"], category: "소설" },
    "총, 균, 쇠": { author: "재레드 다이아몬드", isbn: "9788934942467", alternateIsbns: ["9788934942467", "9788934942023"], category: "인문·사회" },
    "팩트풀니스": { author: "한스 로슬링", isbn: "9791155811852", alternateIsbns: ["9791155811852"], category: "인문·사회" },
    "어린 왕자": { author: "생텍쥐페리", isbn: "9788932917245", alternateIsbns: ["9788932917245", "9788954602970"], category: "고전" },
    "해리 포터와 마법사의 돌": { author: "J.K. 롤링", isbn: "9788983927620", alternateIsbns: ["9788983927620", "9788983925541"], category: "소설" },
    "코스모스": { author: "칼 세이건", isbn: "9788983711892", alternateIsbns: ["9788983711892"], category: "과학" }
};

function cleanIsbn(value) {
    return String(value || '').split(',')[0].replace(/[^0-9Xx]/g, '').trim();
}

function normalizeTitle(title) {
    return String(title || '')
        .replace(/[『』《》〈〉]/g, '')
        .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, '')
        .split(/[:：|｜]/)[0]
        .replace(/\s[-–—]\s.*$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeTitleKey(value) {
    return normalizeTitle(value).replace(/["'\s:：·,\-–—|｜]/g, '').toLowerCase();
}

function rebuildCoverCacheIfNeeded() {
    try {
        const version = localStorage.getItem('bookmate_cover_cache_version');
        if (version !== COVER_CACHE_VERSION) {
            localStorage.removeItem('bookmate_cover_cache');
            localStorage.setItem('bookmate_cover_cache_version', COVER_CACHE_VERSION);
            console.info('[BOOKMATE Cover] 표지 캐시 재구성:', COVER_CACHE_VERSION);
        }
    } catch(e) {}
}

function readCoverCache() {
    rebuildCoverCacheIfNeeded();
    try { return JSON.parse(localStorage.getItem('bookmate_cover_cache') || '{}'); }
    catch { return {}; }
}

function writeCoverCache(cache) {
    rebuildCoverCacheIfNeeded();
    try { localStorage.setItem('bookmate_cover_cache', JSON.stringify(cache)); } catch(e) {}
}

function dropCoverCache(key) {
    const cache = readCoverCache();
    if (cache[key]) {
        delete cache[key];
        writeCoverCache(cache);
    }
}
function coverCacheKey(book) {
    const isbn = cleanIsbn(book?.isbn || book?.industryIdentifier || '');
    if (isbn) return `isbn:${isbn}`;
    return `title:${normalizeTitleKey(book?.title || book?.bookTitle || book || '')}`;
}

function findKnownBook(titleOrKeyword) {
    const normalized = normalizeTitleKey(titleOrKeyword);
    if (!normalized) return null;
    for (const [title, meta] of Object.entries(KNOWN_BOOKS)) {
        const key = normalizeTitleKey(title);
        if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
            return {
                title, author: meta.author || '', publisher: meta.publisher || '', publishedDate: meta.publishedDate || '',
                description: meta.description || 'BOOKMATE 시연용으로 등록된 대표 도서입니다.',
                thumbnail: getDirectCoverByTitle(title) || meta.fixedCoverUrl || '', isbn: meta.isbn, alternateIsbns: meta.alternateIsbns || [], fixedCoverUrl: getDirectCoverByTitle(title) || meta.fixedCoverUrl || '', category: meta.category || '', source: 'known'
            };
        }
    }
    return null;
}

const STATIC_COVERS = Object.fromEntries(Object.entries(KNOWN_BOOKS).map(([title, meta]) => [title, getDirectCoverByTitle(title) || meta.fixedCoverUrl || '']).filter(([, url]) => Boolean(url)));
const BOOK_API_CACHE = {};
let bookSearchContext = null;
let bookSearchResults = [];
let bookSearchTimer = null;

function normalizeBookThumbnail(url) {
    if (!url) return null;
    return String(url).replace('http://', 'https://').replace('zoom=1', 'zoom=2').replace('&edge=curl', '');
}

function buildGoogleBooksQuery(keyword) {
    return `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent((keyword || '').trim())}&maxResults=12&printType=books&orderBy=relevance`;
}

function buildGoogleBooksIsbnQuery(isbn) {
    return `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(cleanIsbn(isbn))}&maxResults=3&printType=books`;
}

function scoreBookResult(book, query) {
    const q = normalizeTitleKey(query);
    const t = normalizeTitleKey(book.title);
    let score = 0;
    if (book.thumbnail) score += 30;
    if (t === q) score += 100;
    else if (t.includes(q) || q.includes(t)) score += 60;
    if (book.author && normalizeTitleKey(book.author).includes(q)) score += 10;
    if ((book.publisher || '').match(/민음|김영사|창비|문학동네|마음산책|열린책들/)) score += 5;
    return score;
}

function parseGoogleBookItem(item) {
    const info = item.volumeInfo || {};
    const saleInfo = item.saleInfo || {};
    const images = info.imageLinks || {};
    const thumbnail = normalizeBookThumbnail(images.thumbnail || images.smallThumbnail || images.medium || images.large || images.extraLarge);
    return {
        id: item.id, title: info.title || '제목 없음', author: (info.authors || ['미상']).join(', '),
        publisher: info.publisher || '', publishedDate: info.publishedDate || '', description: info.description || '',
        thumbnail, infoLink: info.infoLink || '', previewLink: info.previewLink || '',
        isbn: (info.industryIdentifiers || []).map(v => v.identifier).join(', '), ebookAvailable: saleInfo.isEbook || false
    };
}

async function fetchGoogleBooks(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Google Books API 요청 실패');
    const data = await response.json();
    return (data.items || []).map(parseGoogleBookItem).filter(b => b.title);
}

async function searchGoogleBooks(keyword) {
    const query = normalizeTitle(keyword || '');
    if (!query) return [];
    const cacheKey = `search:${query}`;
    if (BOOK_API_CACHE[cacheKey]) return BOOK_API_CACHE[cacheKey];
    const known = findKnownBook(query);
    let books = known ? [known] : [];
    try {
        const apiBooks = (await fetchGoogleBooks(buildGoogleBooksQuery(query))).sort((a, b) => scoreBookResult(b, query) - scoreBookResult(a, query));
        const seen = new Set(books.map(b => normalizeTitleKey(b.title) + ':' + (b.isbn || '')));
        apiBooks.forEach(book => {
            const key = normalizeTitleKey(book.title) + ':' + (book.isbn || '');
            if (!seen.has(key)) { seen.add(key); books.push(book); }
        });
    } catch (e) { console.warn('[BOOKMATE Cover] Google Books search failed:', e); }
    BOOK_API_CACHE[cacheKey] = books;
    return books;
}

async function resolveImage(url, label = 'cover') {
    return new Promise(resolve => {
        if (!url) return resolve(null);
        let settled = false;
        const finish = value => {
            if (settled) return;
            settled = true;
            resolve(value);
        };
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
            const validSize = (img.naturalWidth || 0) >= 8 && (img.naturalHeight || 0) >= 8;
            finish(validSize ? url : null);
        };
        img.onerror = () => finish(null);
        img.src = url;
        setTimeout(() => finish(null), 2600);
    });
}

function uniqueIsbns(...values) {
    const seen = new Set();
    return values.flatMap(v => Array.isArray(v) ? v : String(v || '').split(','))
        .map(cleanIsbn)
        .filter(v => v && !seen.has(v) && seen.add(v));
}

async function firstVerifiedCandidate(candidates, title, cache, key, memoryKey) {
    for (const c of candidates.filter(v => v && v.url)) {
        const ok = await resolveImage(c.url, c.label);
        if (ok) {
            console.info(`[BOOKMATE Cover] ${c.label} 성공:`, title, ok);
            cache[key] = ok;
            writeCoverCache(cache);
            BOOK_API_CACHE[memoryKey] = ok;
            return ok;
        }
        console.info(`[BOOKMATE Cover] ${c.label} 실패:`, title, c.url);
    }
    return null;
}

async function getBookCover(bookOrTitle, author = '') {
    const book = typeof bookOrTitle === 'object' ? bookOrTitle : { title: bookOrTitle, author };
    const rawTitle = book.title || book.book || book.bookTitle || '';
    const title = normalizeTitle(rawTitle);
    const known = findKnownBook(title);
    const isbns = uniqueIsbns(book.isbn || '', known?.isbn || '', known?.alternateIsbns || []);
    const key = coverCacheKey({ title, isbn: isbns[0] || '' });
    const memoryKey = `cover:${key}:${author || book.author || ''}`;
    if (BOOK_API_CACHE[memoryKey] !== undefined) return BOOK_API_CACHE[memoryKey];

    const cache = readCoverCache();

    if (book.coverUrl) {
        const verifiedDirectCover = await resolveImage(book.coverUrl, '직접 전달 coverUrl');
        if (verifiedDirectCover) {
            console.info('[BOOKMATE Cover] 직접 전달 coverUrl 성공:', title, verifiedDirectCover);
            cache[key] = verifiedDirectCover;
            writeCoverCache(cache);
            BOOK_API_CACHE[memoryKey] = verifiedDirectCover;
            return verifiedDirectCover;
        }
        console.info('[BOOKMATE Cover] 직접 전달 coverUrl 실패, fallback 진행:', title, book.coverUrl);
    }


    // 0) COVER_MAP: 검증된 직접 JPG만 API보다 먼저 즉시 적용합니다.
    // wcover.aspx / Google image-not-available 류의 동적 주소는 여기에 넣지 않습니다.
    const directMappedCover = getDirectCoverByTitle(title) || known?.fixedCoverUrl || '';
    if (directMappedCover) {
        console.info('[BOOKMATE Cover] COVER_MAP 직접 JPG 적용:', title, directMappedCover);
        cache[key] = directMappedCover;
        writeCoverCache(cache);
        BOOK_API_CACHE[memoryKey] = directMappedCover;
        return directMappedCover;
    }

    if (cache[key]) {
        const verifiedCachedCover = await resolveImage(cache[key], '캐시');
        if (verifiedCachedCover) {
            console.info('[BOOKMATE Cover] 캐시 성공:', title, verifiedCachedCover);
            BOOK_API_CACHE[memoryKey] = verifiedCachedCover;
            return verifiedCachedCover;
        }
        console.info('[BOOKMATE Cover] 캐시 URL 깨짐, 삭제 후 재탐색:', title, cache[key]);
        dropCoverCache(key);
    }

    // 1) OpenLibrary ISBN → 2) Google ISBN(static) → 3) Google Books API → 4) OpenLibrary title
    const openLibraryIsbnCandidates = isbns.map(isbn => ({
        label: `OpenLibrary ISBN ${isbn}`,
        url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
    }));
    const openLibraryHit = await firstVerifiedCandidate(openLibraryIsbnCandidates, title, cache, key, memoryKey);
    if (openLibraryHit) return openLibraryHit;

    const googleStaticCandidates = isbns.map(isbn => ({
        label: `Google ISBN ${isbn}`,
        url: googleIsbnCover(isbn, 2)
    }));
    const googleStaticHit = await firstVerifiedCandidate(googleStaticCandidates, title, cache, key, memoryKey);
    if (googleStaticHit) return googleStaticHit;

    try {
        const googleQueries = [];
        isbns.forEach(isbn => googleQueries.push(buildGoogleBooksIsbnQuery(isbn)));
        googleQueries.push(buildGoogleBooksQuery(`${title} ${book.author || author || known?.author || ''}`.trim()));

        for (const queryUrl of googleQueries) {
            const googleBooks = await fetchGoogleBooks(queryUrl);
            const sorted = googleBooks.filter(b => b.thumbnail).sort((a,b)=>scoreBookResult(b,title)-scoreBookResult(a,title));
            const googleApiCandidates = sorted.map(b => ({ label: `Google API ${b.title}`, url: b.thumbnail }));
            const googleApiHit = await firstVerifiedCandidate(googleApiCandidates, title, cache, key, memoryKey);
            if (googleApiHit) return googleApiHit;
        }
    } catch(e) { console.info('[BOOKMATE Cover] Google API 실패:', title, e); }

    try {
        const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=12`);
        if (!response.ok) throw new Error('OpenLibrary 제목 검색 실패');
        const data = await response.json();
        const docs = (data.docs || []).filter(d => d.cover_i || (d.isbn && d.isbn.length));
        const openLibraryTitleCandidates = docs.flatMap(d => {
            const urls = [];
            if (d.cover_i) urls.push({ label: `OpenLibrary 제목 cover_i ${d.cover_i}`, url: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg?default=false` });
            (d.isbn || []).slice(0, 3).forEach(isbn => urls.push({ label: `OpenLibrary 제목 ISBN ${isbn}`, url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` }));
            return urls;
        });
        const openLibraryTitleHit = await firstVerifiedCandidate(openLibraryTitleCandidates, title, cache, key, memoryKey);
        if (openLibraryTitleHit) return openLibraryTitleHit;
    } catch(e) { console.info('[BOOKMATE Cover] OpenLibrary 제목 실패:', title, e); }

    console.info('[BOOKMATE Cover] 전체 실패, 타이포그래피 표지 사용:', title);
    BOOK_API_CACHE[memoryKey] = null;
    return null;
}

async function getBookCoverUrl(bookTitle, author = '') { return getBookCover({ title: bookTitle, author }); }

function preloadBookCovers(books = []) {
    books.slice(0, 16).forEach(book => getBookCover(book).catch(()=>{}));
}
