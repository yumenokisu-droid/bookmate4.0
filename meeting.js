const $ = (s) => document.querySelector(s);
const $all = (s) => [...document.querySelectorAll(s)];
const STORAGE_KEY = 'bookmate_meeting_phase3';
const REPORT_KEY = 'bookmate_live_reports';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const baseState = {
  aiMode:'퍼실리테이터',
  book:{title:'작별인사',author:'김영하',publisher:'복복서가',date:'7월 11일 오후 8시',points:'인간다움, 선택, 작별의 의미'},
  nextBook:{title:'아몬드',author:'손원평'},
  monthBooks:[
    {month:'7월',title:'작별인사',author:'김영하',note:'현재 주제도서'},
    {month:'8월',title:'아몬드',author:'손원평',note:'다음 주제도서'},
    {month:'9월',title:'소년이 온다',author:'한강',note:'역사와 기억'},
    {month:'10월',title:'1984',author:'조지 오웰',note:'사회와 감시'}
  ],
  chat:[{user:'민지',text:'이번 책은 마지막 장면 이야기가 제일 많을 것 같아요.'},{user:'AI 모아',text:'필요하면 “모아야”라고 불러주세요. 줄거리나 등장인물 정리를 도와드릴게요.'}],
  posts:[{id:1,category:'공지',title:'7월 LIVE 독서토론 안내',body:'토요일 오후 8시에 LIVE ROOM에서 만나요. 이어폰이 없어도 AI 음성 요약으로 흐름을 볼 수 있어요.',likes:3,comments:['확인했습니다.']}],
  schedules:[{date:'7.11',title:'작별인사 LIVE 토론',meta:'20:00 · LIVE ROOM'},{date:'7.18',title:'아몬드 사전 대화',meta:'20:00 · 일반 채팅방'},{date:'8.03',title:'월별 도서 선정 회의',meta:'19:30 · 온라인'}]
};
let state = loadState();
function loadState(){try{return {...baseState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}}catch(e){return structuredClone(baseState)}}
function saveState(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}
function toast(text){const el=$('#toast'); if(!el) return; el.textContent=text; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1700)}
function coverTitle(t){return esc(t).replace(/(.{2,4})/g,'$1<br/>').replace(/<br\/>$/,'')}
function switchView(view){$all('.view').forEach(v=>v.classList.toggle('active', v.id===`view-${view}`)); $all('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.view===view)); if(view==='live') renderReportPreview(); window.scrollTo({top:0,behavior:'smooth'});}
function syncBook(){
 const b=state.book;
 ['#heroBookTitle','#homeBookTitle','#bookTitle','#liveBookTitle'].forEach(sel=>{const el=$(sel); if(el) el.textContent=b.title});
 const author=$('#heroBookAuthor'); if(author) author.textContent=b.author;
 const homeInfo=$('#homeBookInfo'); if(homeInfo) homeInfo.textContent=`${b.author} · ${b.publisher}`;
 const meta=$('#bookMeta'); if(meta) meta.textContent=`${b.author} · ${b.publisher}`;
 const date=$('#bookDiscussDate'); if(date) date.textContent=`토론일: ${b.date}`;
 const points=$('#bookDiscussionPoints'); if(points) points.textContent=`논제: ${b.points}`;
 const cover=$('#bookCoverTitle'); if(cover) cover.innerHTML=coverTitle(b.title);
 const next=$('#nextBookText'); if(next) next.textContent=`${state.nextBook.title} · ${state.nextBook.author}`;
 const month=$('#monthGoalText'); if(month) month.textContent=`${state.monthBooks[0]?.month||'이번 달'}: ${state.monthBooks.slice(0,2).map(x=>x.title).join(' → ')}`;
 renderMonthBooks();
}
function syncAiMode(){['#sidebarAiMode','#adminAiMode','#communityAiMode'].forEach(sel=>{const el=$(sel); if(el) el.textContent=state.aiMode});}
function renderActivity(){const items=['윤님이 독후감을 작성했습니다.','민지님이 LIVE 참여 예정으로 표시했습니다.',`AI 모아가 ${state.aiMode} 모드로 LIVE 발제문을 준비했습니다.`, 'LIVE 종료 리포트가 아카이브와 연동됩니다.']; const el=$('#activityList'); if(el) el.innerHTML=items.map(x=>`<li>${esc(x)}</li>`).join('');}
function renderChat(){const el=$('#chatFeed'); if(!el) return; el.innerHTML=state.chat.map(m=>`<div class="message ${m.user==='나'?'me':m.user.includes('AI')?'ai':''}"><small>${esc(m.user)}</small>${esc(m.text)}</div>`).join(''); el.scrollTop=el.scrollHeight;}
function renderPosts(){const el=$('#postList'); if(!el) return; el.innerHTML=state.posts.map(p=>`<article class="post" data-id="${p.id}"><div class="post-header"><div><span class="role">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div></div><div class="post-actions"><button class="small-button like-btn">좋아요 ${p.likes}</button><button class="small-button">댓글 ${p.comments.length}</button></div><div>${p.comments.map(c=>`<div class="comment">${esc(c)}</div>`).join('')}</div><form class="comment-box"><input placeholder="댓글 쓰기"/><button class="small-button" type="submit">등록</button></form></article>`).join('');}
function renderMonthBooks(){const el=$('#monthBookList'); if(!el) return; el.innerHTML=state.monthBooks.map((b,i)=>`<article class="month-book"><span class="role">${esc(b.month)}</span><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p><p class="muted">${esc(b.note||'')}</p>${i>1?`<button class="small-button remove-month" data-index="${i}">삭제</button>`:''}</article>`).join('');}
function renderMembers(){const members=[['윤','모임장'],['민지','부모임장'],['수현','회원'],['지훈','회원'],['AI','AI 모아'],['서연','회원'],['도윤','회원'],['하린','회원']]; const el=$('#memberGrid'); if(el) el.innerHTML=members.map(([n,r])=>`<article class="member-card"><div class="avatar">${esc(n[0])}</div><div><strong>${esc(n)}</strong><br/><span class="role">${esc(r)}</span></div></article>`).join('');}
function renderSchedule(){const el=$('#scheduleList'); if(!el) return; el.innerHTML=state.schedules.map((s,i)=>`<article class="schedule-item"><div class="schedule-date">${esc(s.date)}</div><div><strong>${esc(s.title)}</strong><p class="muted">${esc(s.meta)}</p></div><button class="small-button delete-schedule" data-index="${i}">관리</button></article>`).join('');}
function getReports(){try{return JSON.parse(localStorage.getItem(REPORT_KEY)||'[]')}catch(e){return []}}
function renderReportPreview(){const el=$('#reportPreviewList'); if(!el) return; const reports=getReports(); if(!reports.length){el.innerHTML='<div class="archive-sync-note">아직 저장된 LIVE 리포트가 없습니다. LIVE ROOM에서 종료 리포트를 생성하면 이곳과 아카이브에 표시됩니다.</div>'; return;} el.innerHTML=reports.slice(0,4).map(r=>`<article class="report-card"><span class="role">${esc(r.date)}</span><h3>${esc(r.title)}</h3><p class="muted">『${esc(r.book)}』 · ${esc(r.duration)} · 참여 ${r.participants?.length||0}명</p><p>${esc(r.summary)}</p><div class="keywords">${(r.keywords||[]).map(k=>`<span>#${esc(k)}</span>`).join('')}</div></article>`).join('');}
function copyInvite(){navigator.clipboard?.writeText(location.href).then(()=>toast('초대링크를 복사했어요.')).catch(()=>toast('초대링크: meeting.html'))}
function boot(){
 $all('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
 $all('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
 $('#copyInviteBtn')?.addEventListener('click',copyInvite); $('#adminInviteBtn')?.addEventListener('click',copyInvite);
 $('#chatForm')?.addEventListener('submit',e=>{e.preventDefault(); const input=$('#chatInput'), text=input.value.trim(); if(!text) return; state.chat.push({user:'나',text}); if(text.includes('모아')) state.chat.push({user:'AI 모아',text:'좋아요. 이 장면은 인물의 선택과 관계의 변화에 집중해 보면 이해하기 쉬워요.'}); input.value=''; saveState(); renderChat();});
 $('#addPhotoMessageBtn')?.addEventListener('click',()=>{state.chat.push({user:'나',text:'📷 사진을 첨부했습니다.'}); saveState(); renderChat(); toast('사진 메시지를 추가했어요.')});
 $('#postForm')?.addEventListener('submit',e=>{e.preventDefault(); const title=$('#postTitle').value.trim(), body=$('#postBody').value.trim(), category=$('#postCategory').value; if(!title||!body) return toast('제목과 내용을 입력해주세요.'); state.posts.unshift({id:Date.now(),category,title,body,likes:0,comments:[]}); $('#postTitle').value=''; $('#postBody').value=''; saveState(); renderPosts(); toast('게시글을 등록했어요.')});
 $('#postList')?.addEventListener('click',e=>{const post=e.target.closest('.post'); if(!post) return; const p=state.posts.find(x=>x.id==post.dataset.id); if(e.target.classList.contains('like-btn')){p.likes++; saveState(); renderPosts();}});
 $('#postList')?.addEventListener('submit',e=>{if(!e.target.classList.contains('comment-box')) return; e.preventDefault(); const p=state.posts.find(x=>x.id==e.target.closest('.post').dataset.id), input=e.target.querySelector('input'), text=input.value.trim(); if(!text) return; p.comments.push(text); saveState(); renderPosts();});
 $('#bookForm')?.addEventListener('submit',e=>{e.preventDefault(); const title=$('#newBookTitle').value.trim(), author=$('#newBookAuthor').value.trim(), date=$('#newBookDate').value.trim(), points=$('#newBookPoints').value.trim(); if(!title||!author) return toast('도서명과 저자를 입력해주세요.'); state.book={title,author,publisher:'모임장 지정',date:date||'토론일 미정',points:points||'논제 미정'}; ['#newBookTitle','#newBookAuthor','#newBookDate','#newBookPoints'].forEach(s=>$(s).value=''); saveState(); syncBook(); toast('현재 주제도서를 변경했어요.');});
 $('#monthBookForm')?.addEventListener('submit',e=>{e.preventDefault(); const month=$('#monthBookMonth').value.trim(), title=$('#monthBookTitleInput').value.trim(), author=$('#monthBookAuthorInput').value.trim(); if(!month||!title||!author) return toast('월, 도서명, 저자를 입력해주세요.'); state.monthBooks.push({month,title,author,note:'모임장 지정'}); ['#monthBookMonth','#monthBookTitleInput','#monthBookAuthorInput'].forEach(s=>$(s).value=''); saveState(); syncBook(); renderActivity(); toast('월별 도서를 추가했어요.');});
 $('#monthBookList')?.addEventListener('click',e=>{if(!e.target.classList.contains('remove-month')) return; state.monthBooks.splice(Number(e.target.dataset.index),1); saveState(); syncBook();});
 $('#scheduleForm')?.addEventListener('submit',e=>{e.preventDefault(); const date=$('#scheduleDate').value.trim(), title=$('#scheduleTitle').value.trim(), meta=$('#scheduleMeta').value.trim(); if(!date||!title) return toast('날짜와 일정명을 입력해주세요.'); state.schedules.unshift({date,title,meta:meta||'세부 미정'}); ['#scheduleDate','#scheduleTitle','#scheduleMeta'].forEach(s=>$(s).value=''); saveState(); renderSchedule(); toast('일정을 등록했어요.');});
 $('#openArchivePreviewBtn')?.addEventListener('click',renderReportPreview); $('#previewLiveReportBtn')?.addEventListener('click',renderReportPreview);
 syncBook(); syncAiMode(); renderActivity(); renderChat(); renderPosts(); renderMembers(); renderSchedule(); renderReportPreview();
}
document.addEventListener('DOMContentLoaded',boot);
