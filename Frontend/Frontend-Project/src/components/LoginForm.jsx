import React, { useState } from 'react';

function LoginForm({ onSubmit }) {
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = form.username.value.trim();
    const password = form.password.value;
    if (typeof onSubmit === 'function') onSubmit({ username, password });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Username or Email</span>
        <input name="username" type="text" required placeholder="name or email" />
      </label>
      <label className="form-field">
        <span>Password</span>
        <div className="form-password">
          <input name="password" type={showPw ? 'text' : 'password'} required placeholder="••••••••" />
          <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} title={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 12s4-7 11-7c2.2 0 4.1.7 5.6 1.6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M23 12s-4 7-11 7c-2.2 0-4.1-.7-5.6-1.6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
      </label>
      <button className="btn btn-primary" type="submit">Log in</button>
    </form>
  );
}

export default LoginForm;


