// Standalone Login form component (no bundler). Exposes window.LoginForm
const { useState } = React;

function LoginForm({ onSubmit }) {
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = form.querySelector('input[name="username"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    if (typeof onSubmit === 'function') onSubmit({ username, password });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Username or Email</span>
        <input className="px-4 py-3 rounded-lg border border-brand/25 bg-[#0c1427] text-white outline-none focus:ring-4 ring-brand/20" name="username" type="text" required placeholder="name or email" />
      </label>
      <label className="form-field">
        <span>Password</span>
        <div className="form-password">
          <input className="px-4 py-3 rounded-lg border border-brand/25 bg-[#0c1427] text-white outline-none focus:ring-4 ring-brand/20" name="password" type={showPw ? 'text' : 'password'} required placeholder="••••••••" />
          <button
            type="button"
            className="pw-toggle"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            title={showPw ? 'Hide password' : 'Show password'}
          >
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
      <button className="btn btn-primary px-4 py-2 rounded-lg border border-brand bg-brand text-white shadow hover:brightness-105 transition" type="submit">Log in</button>
    </form>
  );
}

window.LoginForm = LoginForm;


