// register-fix.js
// Listen for registration form submissions and persist user profile locally.
// Stores profile in localStorage under 'my_loan_user' and sets window.user.

(function () {
  function saveProfile(obj) {
    try {
      localStorage.setItem('my_loan_user', JSON.stringify(obj));
      window.user = obj;
      // Optional: if you have a UI function to update user display, call it
      if (typeof window.updateUserUI === 'function') window.updateUserUI(obj);
      console.log('User profile saved locally:', obj);
      return true;
    } catch (e) {
      console.error('Failed to save profile', e);
      return false;
    }
  }

  async function onFormSubmit(e) {
    try {
      const form = e.target;
      // Only handle element forms
      if (!(form && form.tagName && form.tagName.toLowerCase() === 'form')) return;

      // Heuristic: if the form is inside .auth-box or contains 'register' 'signup' in id/name
      const isAuth = !!form.closest('.auth-box') || /register|sign.?up|create.?account/i.test(form.id + ' ' + form.name + ' ' + (form.className||''));
      if (!isAuth) return;

      // Collect form fields
      const fd = new FormData(form);
      const obj = {};
      for (const [k, v] of fd.entries()) {
        obj[k] = v;
      }

      // Minimal profile normalization
      if (!obj.name && (obj.fullname || obj.username)) obj.name = obj.fullname || obj.username;
      if (!obj.email && obj.mail) obj.email = obj.mail;

      // Save profile locally (non-blocking)
      saveProfile(obj);

      // Also keep a backup in the loans store if Storage exists (so it persists in our DB structure)
      if (window.Storage && typeof window.Storage.addLoan === 'function') {
        try {
          const profileRecord = { id: 'profile-' + (obj.email || Date.now()), type: 'profile', profile: obj, createdAt: new Date().toISOString() };
          // addLoan won't create duplicates; it will put if already exists
          await window.Storage.addLoan(profileRecord);
        } catch (e) {
          console.warn('Failed to save profile to Storage', e);
        }
      }

      // Allow the form to continue its normal submission (do not prevent default)
    } catch (err) {
      console.error('register-fix submit handler error', err);
    }
  }

  document.addEventListener('submit', onFormSubmit, true);

  // On load, restore user into window.user if present
  (function restore() {
    try {
      const raw = localStorage.getItem('my_loan_user');
      if (raw) {
        window.user = JSON.parse(raw);
        if (typeof window.updateUserUI === 'function') window.updateUserUI(window.user);
        console.log('Restored user from localStorage', window.user);
      } else if (window.Storage && typeof window.Storage.loadAllLoans === 'function') {
        // try to recover profile record from loans store
        window.Storage.loadAllLoans().then((arr) => {
          if (!Array.isArray(arr)) return;
          const p = arr.find(x => x && x.type === 'profile');
          if (p && p.profile) {
            window.user = p.profile;
            localStorage.setItem('my_loan_user', JSON.stringify(window.user));
            if (typeof window.updateUserUI === 'function') window.updateUserUI(window.user);
            console.log('Recovered user from Storage', window.user);
          }
        }).catch(()=>{});
      }
    } catch (e) { console.warn('restore user failed', e); }
  })();
})();
