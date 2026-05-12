const toggle = document.getElementById('nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

const form = document.getElementById('old-contact') as HTMLFormElement | null;
const formStatus = document.getElementById('form-status') as HTMLElement | null;
if (form && formStatus) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    formStatus.hidden = true;
    formStatus.className = 'form-status';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        formStatus.textContent = 'Thank you! We will be in touch shortly.';
        formStatus.classList.add('success');
        formStatus.hidden = false;
        btn.textContent = 'Sent';
      } else {
        throw new Error('submit failed');
      }
    } catch {
      formStatus.textContent = 'Something went wrong. Please email info@findneuro.com.';
      formStatus.classList.add('error');
      formStatus.hidden = false;
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
}
