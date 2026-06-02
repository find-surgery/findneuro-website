import { LOADER_HIDE_DELAY, FORMSPREE_URL } from './constants.ts';

/** CTA switcher labels, titles, and descriptions */
const ctaLabels: Record<string, string> = {
  demo: 'Request a Demo',
  deck: 'Request Investor Deck',
  general: 'Send Message',
};
const ctaTitles: Record<string, string> = {
  demo: "Let's discuss how FIND Neuro can support your clinical program.",
  deck: "Interested in investing in the future of precision neurosurgery?",
  general: "We'd love to hear from you.",
};
const ctaTexts: Record<string, string> = {
  demo: "Schedule a personalized demo to see how our platform integrates into your epilepsy surgery workflow.",
  deck: "Request our investor deck to learn about our technology, market opportunity, and growth strategy.",
  general: "Whether you're a clinician, researcher, or potential partner - reach out and let's start a conversation.",
};

function setCTA(type: string): void {
  document.querySelectorAll('.contact__pill').forEach(p => {
    p.classList.toggle('contact__pill--active', (p as HTMLElement).dataset.cta === type);
  });
  const hidden = document.querySelector('[name=cta-type]') as HTMLInputElement | null;
  if (hidden) hidden.value = type;
  const btn = document.querySelector('.btn--submit');
  if (btn) btn.textContent = ctaLabels[type] || 'Send Message';
  const title = document.getElementById('contact-title');
  if (title) title.textContent = ctaTitles[type] || ctaTitles.general;
  const text = document.getElementById('contact-text');
  if (text) text.textContent = ctaTexts[type] || ctaTexts.general;
}

function initLoader(): void {
  const hide = () => document.getElementById('loader')?.classList.add('hidden');
  window.addEventListener('load', () => {
    setTimeout(hide, LOADER_HIDE_DELAY);
  });
  // Safety: hide loader after 6s no matter what, so a script failure can't trap users.
  setTimeout(hide, 6000);
}

function initContactForm(): void {
  const contactForm = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!contactForm) return;

  contactForm.addEventListener('submit', async function(this: HTMLFormElement, e: Event) {
    e.preventDefault();
    const btn = this.querySelector('.btn--submit') as HTMLButtonElement;
    const status = document.getElementById('form-status') as HTMLElement;
    const origText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    status.classList.remove('form-status--success', 'form-status--error');
    try {
      const resp = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: new FormData(this),
        headers: { 'Accept': 'application/json' },
      });
      if (resp.ok) {
        btn.textContent = 'Sent!';
        btn.classList.add('is-success');
        status.classList.add('form-status--success');
        status.hidden = false;
        status.textContent = 'Thank you! We will be in touch shortly.';
        this.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch {
      btn.textContent = origText;
      btn.disabled = false;
      status.classList.add('form-status--error');
      status.hidden = false;
      status.textContent = 'Something went wrong. Please email us at info@findneuro.com';
    }
  });
}

function initCTAButtons(): void {
  document.querySelectorAll<HTMLElement>('.contact__pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.cta;
      if (type) setCTA(type);
    });
  });
  document.querySelectorAll<HTMLElement>('[data-set-cta]').forEach(el => {
    el.addEventListener('click', () => {
      const type = el.dataset.setCta;
      const hidden = document.querySelector('[name=cta-type]') as HTMLInputElement | null;
      if (hidden && type) hidden.value = type;
    });
  });
}

function initMobileMenu(): void {
  const mobileToggle = document.getElementById('mobile-toggle')!;
  const mobileMenu = document.getElementById('mobile-menu')!;
  const close = () => {
    mobileToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
  };
  mobileToggle.addEventListener('click', () => {
    const open = !mobileToggle.classList.contains('active');
    mobileToggle.classList.toggle('active', open);
    mobileMenu.classList.toggle('active', open);
    mobileToggle.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

function activateKeyboard(el: HTMLElement, action: () => void): void {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  });
}

function initDotNav(): void {
  const dots = document.querySelectorAll<HTMLElement>('.dot-nav__item');
  const sectionIds = Array.from(dots).map(d => d.dataset.section!);

  dots.forEach(dot => {
    const label = dot.dataset.label || 'Section';
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-label', `Go to ${label} section`);
    const go = () => {
      const target = document.getElementById(dot.dataset.section!);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    };
    dot.addEventListener('click', go);
    activateKeyboard(dot, go);
  });

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        dots.forEach(d => {
          const isActive = d.dataset.section === id;
          d.classList.toggle('active', isActive);
          if (isActive) d.setAttribute('aria-current', 'true');
          else d.removeAttribute('aria-current');
        });
      }
    });
  }, { threshold: 0.3 });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });
}

function initScrollReveals(): void {
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.r').forEach(el => revealObs.observe(el));
}

function initFlipCards(selector: string, ignoreSelector: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach(card => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Flip card to see more');
    const flip = () => {
      const flipped = card.classList.toggle('flipped');
      card.setAttribute('aria-pressed', String(flipped));
    };
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest(ignoreSelector)) return;
      flip();
    });
    activateKeyboard(card, flip);
  });
}

export function initUI(): void {
  initLoader();
  initContactForm();
  initCTAButtons();
  initMobileMenu();
  initDotNav();
  initScrollReveals();
  initFlipCards('.pub-card', '.pub-card__link');
  initFlipCards('.t-card', '.t-card__linkedin');
}
