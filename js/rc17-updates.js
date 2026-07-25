/* BOOKMATE RC17 — 독서모임 예시 통일 및 내 서재 방명록 바로가기 */
(function () {
  const MIGRATION_KEY = 'bookmate_rc17_two_communities_migrated';

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (e) { return value; }
  }

  function canonicalGatherings() {
    return Array.isArray(window.BOOKMATE_GROUPS) ? clone(window.BOOKMATE_GROUPS) : [];
  }

  function syncCurrentAccountGatherings() {
    if (typeof state === 'undefined' || !Array.isArray(state.gatherings)) return;
    const canonical = canonicalGatherings();
    if (!canonical.length) return;

    const existingById = new Map((state.gatherings || []).map(group => [Number(group.id), group]));
    const currentNickname = state.currentUser?.nickname || '';
    const isMoonReader = currentNickname === '달빛독서가';

    state.gatherings = canonical.map(seed => {
      const existing = existingById.get(Number(seed.id)) || {};
      const merged = { ...existing, ...seed, members: clone(seed.members || existing.members || []) };
      if (isMoonReader) {
        merged.joined = Number(seed.id) === 1 || Number(seed.id) === 2;
        merged.isLeader = Number(seed.id) === 1;
      } else if (typeof existing.joined === 'boolean') {
        merged.joined = existing.joined;
        merged.isLeader = !!existing.isLeader;
      }
      return merged;
    });

    if (isMoonReader) {
      state.currentUser.gatheringCount = 2;
      const count = document.getElementById('my-gathering-count-val');
      if (count) count.textContent = '2';
    }

    try { if (typeof renderHomeConnectedData === 'function') renderHomeConnectedData(); } catch (e) {}
    try { if (typeof renderMyPageGatherings === 'function') renderMyPageGatherings(); } catch (e) {}
    try { if (typeof renderGatheringsGrid === 'function') renderGatheringsGrid(); } catch (e) {}
    try { if (typeof renderMyLibraryHub === 'function') renderMyLibraryHub(); } catch (e) {}
    try { if (typeof updateUIProfileData === 'function') updateUIProfileData(); } catch (e) {}
    try { if (typeof saveAppState === 'function') saveAppState(); } catch (e) {}
  }

  function installLoginHook() {
    if (typeof window.applyLoggedInUser !== 'function' || window.applyLoggedInUser.__rc17Wrapped) return;
    const original = window.applyLoggedInUser;
    const wrapped = function (user) {
      const result = original.apply(this, arguments);
      setTimeout(syncCurrentAccountGatherings, 0);
      return result;
    };
    wrapped.__rc17Wrapped = true;
    window.applyLoggedInUser = wrapped;
  }

  function boot() {
    installLoginHook();
    syncCurrentAccountGatherings();
    try { localStorage.setItem(MIGRATION_KEY, '1'); } catch (e) {}
    try { if (window.lucide) lucide.createIcons(); } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0), { once:true });
  else setTimeout(boot, 0);
  window.addEventListener('load', () => setTimeout(boot, 80), { once:true });
  window.syncBookmateRC17Data = syncCurrentAccountGatherings;
})();
