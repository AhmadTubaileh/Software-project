// Simple Toastify wrapper to keep consistent style/position across app
window.toast = function toast(message, variant = 'default', durationMs = 2500) {
  try {
    Toastify({
      text: message,
      duration: durationMs,
      gravity: 'top',
      position: 'center',
      className: variant === 'success' ? 'toast-custom toast-success' : variant === 'error' ? 'toast-custom toast-error' : 'toast-custom'
    }).showToast();
  } catch (e) {
    // Fallback
    alert(message);
  }
};


