import React, { useState } from 'react';

function SignUpForm({ onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = form.su_username.value.trim();
    const email = form.su_email.value.trim();
    const password = form.su_password.value;
    const confirm = form.su_confirm.value;
    if (password !== confirm) return;
    if (typeof onSubmit === 'function') onSubmit({ username, email, password });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Username</span>
        <input name="su_username" type="text" required placeholder="your username" />
      </label>
      <label className="form-field">
        <span>Email</span>
        <input name="su_email" type="email" required placeholder="you@example.com" />
      </label>
      <label className="form-field">
        <span>Password</span>
        <div className="form-password">
          <input name="su_password" type={showPw ? 'text' : 'password'} required placeholder="min 8 characters" />
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
      <label className="form-field">
        <span>Confirm Password</span>
        <div className="form-password">
          <input name="su_confirm" type={showConfirm ? 'text' : 'password'} required placeholder="retype password" />
          <button type="button" className="pw-toggle" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'} title={showConfirm ? 'Hide password' : 'Show password'}>
            {showConfirm ? (
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
      <button className="btn btn-primary" type="submit">Sign up</button>
    </form>
  );
}

export default SignUpForm;


