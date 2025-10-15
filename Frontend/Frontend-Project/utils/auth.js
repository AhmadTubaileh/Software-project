window.auth = (function(){
  const KEY = 'frontend_user';
  function getSession() { return window.storage.get(KEY, null); }
  function setSession(user) { window.storage.set(KEY, user); }
  function clearSession() { window.storage.remove(KEY); }
  return { getSession, setSession, clearSession };
})();


