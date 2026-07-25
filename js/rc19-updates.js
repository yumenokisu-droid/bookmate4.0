/* BOOKMATE RC20 — known-good 북라운지 복원 + 최신 기능 연결 */
(function(){
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const originalNavigate = typeof window.navigate === 'function' ? window.navigate : null;
  let explicitLoungeVisit = false;

  function currentNickname(){
    return (typeof state !== 'undefined' && state.currentUser && state.currentUser.nickname) || '달빛독서가';
  }

  function acquiredLoungeItems(){
    const names=['기본 배경','모아1'];
    try{
      const progress=typeof getLoungeProgress==='function'?getLoungeProgress():{};
      if(typeof LOUNGE_MISSIONS!=='undefined'){
        LOUNGE_MISSIONS.forEach(m=>{
          if(typeof isMissionAcquired==='function' && isMissionAcquired(m,progress)) names.push(m.reward);
        });
      }
      if(typeof getLibraryMissionRewards==='function'){
        getLibraryMissionRewards().forEach(name=>names.push(name));
      }
    }catch(e){ console.warn('lounge item sync',e); }
    return [...new Set(names)];
  }

  function renderLoungeMeta(){
    const visiting=window.bookmateVisitedLoungeAuthor||'';
    const owner=visiting||currentNickname();
    const ownerLabel=document.getElementById('lounge-owner-label');
    if(ownerLabel) ownerLabel.textContent=`${owner}의 북라운지`;
    const items=document.getElementById('lounge-current-items');
    if(items) items.innerHTML=acquiredLoungeItems().map(name=>`<span class="lounge-current-item">${esc(name)}</span>`).join('');
    const back=document.getElementById('lounge-own-return');
    if(back) back.classList.toggle('hidden',!visiting);
    const count=document.getElementById('mypage-lounge-item-count');
    if(count) count.textContent=`아이템 ${acquiredLoungeItems().length}개`;
  }

  function renderRestoredLounge(){
    try{
      if(typeof loadLoungeBookmates==='function') loadLoungeBookmates();
      if(typeof window.renderOfficialLounge==='function') window.renderOfficialLounge();
      renderLoungeMeta();
      if(window.lucide) window.lucide.createIcons();
    }catch(e){ console.error('북라운지 렌더링 오류',e); }
  }

  window.visitBookmateLounge=function(name){
    if(!name) return;
    window.bookmateVisitedLoungeAuthor=name;
    explicitLoungeVisit=true;
    if(originalNavigate) originalNavigate('booklounge');
    explicitLoungeVisit=false;
    setTimeout(renderRestoredLounge,0);
    if(typeof showToast==='function') showToast(`${name}님의 북라운지로 이동했습니다.`);
  };
  window.visitMemberLounge=window.visitBookmateLounge;

  window.returnToMyLounge=function(){
    window.bookmateVisitedLoungeAuthor='';
    renderRestoredLounge();
    if(typeof showToast==='function') showToast('나의 북라운지로 돌아왔습니다.');
  };

  window.openMyLounge=function(){
    window.bookmateVisitedLoungeAuthor='';
    if(originalNavigate) originalNavigate('booklounge');
    setTimeout(renderRestoredLounge,0);
  };

  if(originalNavigate){
    window.navigate=function(viewName){
      if(viewName==='booklounge' && !explicitLoungeVisit) window.bookmateVisitedLoungeAuthor='';
      const result=originalNavigate.apply(this,arguments);
      if(viewName==='booklounge') setTimeout(renderRestoredLounge,0);
      if(viewName==='library' && typeof renderMyLibraryHub==='function') setTimeout(renderMyLibraryHub,0);
      return result;
    };
  }

  /* 북메이트는 내 서재에 유지하고 라운지 방문·쪽지를 연결합니다. */
  window.renderBookmates=function(){
    const list=document.getElementById('mypage-bookmates-list');
    const modalList=document.getElementById('bookmates-modal-list');
    const active=typeof getActiveBookmates==='function'?getActiveBookmates():[];
    const avatarFor=m=>typeof getAvatarHTML==='function'?getAvatarHTML(m,'w-10 h-10'):`<span class="w-10 h-10 rounded-full bg-brand-ivory"></span>`;
    const actions=m=>`<span class="bookmate-row-actions"><button class="bookmate-lounge-btn" onclick="visitBookmateLounge('${esc(m.name)}')">🏡 라운지</button><button class="bookmate-note-btn" onclick="openDirectMessage('${esc(m.name)}',{source:'mypage'})">✉ 쪽지</button></span>`;
    if(list){
      list.innerHTML=active.slice(0,3).map(m=>`<article class="mypage-bookmate-row-v2">${avatarFor(m)}<span class="copy"><b>${esc(m.name)}</b><small>${esc(m.gathering||'BOOKMATE 독서모임')}</small></span>${actions(m)}</article>`).join('')||'<p class="timeline-empty">아직 연결된 북메이트가 없습니다.</p>';
    }
    if(modalList){
      const all=(typeof loungeBookmates!=='undefined'?loungeBookmates:[])||[];
      modalList.innerHTML=all.map((m,idx)=>`<article class="mypage-bookmate-row-v2">${avatarFor(m)}<span class="copy"><b>${esc(m.name)}</b><small>${m.status==='pending'?'초대 수락 대기':`${esc(m.since||'2026.06.01')}부터 북메이트 · ${esc(m.gathering||'BOOKMATE 독서모임')}`}</small></span><span class="bookmate-row-actions">${m.status==='pending'?`<button class="bookmate-note-btn" onclick="acceptBookmate(${idx})">수락</button>`:`<button class="bookmate-lounge-btn" onclick="closeBookmatesModal();visitBookmateLounge('${esc(m.name)}')">🏡 라운지</button><button class="bookmate-note-btn" onclick="openDirectMessage('${esc(m.name)}',{source:'mypage'})">✉ 쪽지</button>`}<button class="bookmate-note-btn" onclick="removeBookmate(${idx})">삭제</button></span></article>`).join('');
    }
    if(window.lucide) window.lucide.createIcons();
  };

  function patchMyLoungeLinks(){
    const preview=document.querySelector('.mypage-lounge-card');
    if(preview) preview.setAttribute('onclick','openMyLounge()');
    document.querySelectorAll('#view-mypage button').forEach(btn=>{
      if(btn.textContent.trim()==='북라운지 보기') btn.setAttribute('onclick','openMyLounge()');
    });
  }

  function refreshAll(){
    patchMyLoungeLinks();
    renderRestoredLounge();
    try{ window.renderBookmates(); }catch(e){}
    try{ if(typeof renderMyLibraryHub==='function' && typeof state!=='undefined' && state.currentView==='library') renderMyLibraryHub(); }catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshAll,0),{once:true});
  else setTimeout(refreshAll,0);
  window.addEventListener('load',()=>{setTimeout(refreshAll,80);setTimeout(refreshAll,500);},{once:true});
  window.syncBookmateRC20=refreshAll;
})();
