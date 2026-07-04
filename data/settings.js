/* BOOKMATE 4.0 Foundation - 데이터 조립 파일
   기존 코드 호환을 위해 분리된 데이터를 window.BOOKMATE_DATA로 합칩니다. */
(function () {
  const accounts = window.BOOKMATE_ACCOUNTS || [];
  window.BOOKMATE_DATA = {
    version: '4.0-foundation',
    defaultMode: 'guest',
    guestMode: window.BOOKMATE_GUEST_MODE || {},
    accounts,
    users: accounts,
    gatherings: window.BOOKMATE_GROUPS || [],
    socialPosts: window.BOOKMATE_SOCIAL_POSTS || [],
    notifications: window.BOOKMATE_NOTIFICATIONS || [],
    currentAIBook: '',
    currentAIMode: 'moa',
    aiChatHistory: []
  };
})();
