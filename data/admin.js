/*
  BOOKMATE 데이터 관리 연결 파일
  ------------------------------------------------------------
  실제로 자주 수정할 파일은 data/bookmate-data.js 입니다.
  이 파일은 관리자 페이지와 기존 코드가 같은 데이터를 읽도록 연결만 합니다.
*/
window.BOOKMATE_ADMIN_CONFIG = {
  datasetKey: 'bookmate_admin_dataset_v1',
  authUsersKey: 'bookmate_v2_auth_users',
  authSessionKey: 'bookmate_v2_auth_session',
  version: '3.6-readable-data'
};

window.BOOKMATE_ADMIN_TEMPLATE = window.BOOKMATE_DATA || {
  users: [],
  gatherings: [],
  recentBooks: [],
  recentArchives: [],
  loungeBookmates: []
};
