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

/** Switch the contact form CTA type (demo/deck/general) */
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

/** Initialize the loader hide animation */
function initLoader(): void {
  window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('loader')!.classList.add('hidden'), LOADER_HIDE_DELAY);
  });
}

/** Initialize the Formspree contact form submission */
function initContactForm(): void {
  const contactForm = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!contactForm) return;

  contactForm.addEventListener('submit', async function(this: HTMLFormElement, e: Event) {
    e.preventDefault();
    const btn = this.querySelector('.btn--submit') as HTMLButtonElement;
    const status = document.getElementById('form-status')!;
    const origText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      const resp = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: new FormData(this),
        headers: { 'Accept': 'application/json' },
      });
      if (resp.ok) {
        btn.textContent = 'Sent!';
        btn.style.background = '#059669';
        status.style.display = 'block';
        status.style.color = '#059669';
        status.textContent = 'Thank you! We will be in touch shortly.';
        this.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch {
      btn.textContent = origText;
      btn.disabled = false;
      status.style.display = 'block';
      status.style.color = '#ef4444';
      status.textContent = 'Something went wrong. Please email us at info@findneuro.com';
    }
  });
}

/** Initialize mobile menu hamburger toggle */
function initMobileMenu(): void {
  const mobileToggle = document.getElementById('mobile-toggle')!;
  const mobileMenu = document.getElementById('mobile-menu')!;
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
  }));
}

/** Initialize dot navigation and section tracking via IntersectionObserver */
function initDotNav(): void {
  const dots = document.querySelectorAll('.dot-nav__item');
  const sectionIds = Array.from(dots).map(d => (d as HTMLElement).dataset.section!);

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = document.getElementById((dot as HTMLElement).dataset.section!);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        dots.forEach(d => d.classList.toggle('active', (d as HTMLElement).dataset.section === id));
      }
    });
  }, { threshold: 0.3 });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });
}

/** Initialize scroll-reveal animations for elements with class 'r' */
function initScrollReveals(): void {
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.r').forEach(el => revealObs.observe(el));
}

/** Initialize publication card flip behavior */
function initPubCards(): void {
  document.querySelectorAll('.pub-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't flip when clicking the paper link
      if ((e.target as HTMLElement).closest('.pub-card__link')) return;
      card.classList.toggle('flipped');
    });
  });
}

/** Initialize all UI components (no Three.js dependencies) */
export function initUI(): void {
  // Expose setCTA globally for onclick handlers in HTML
  window.setCTA = setCTA;

  initLoader();
  initContactForm();
  initMobileMenu();
  initDotNav();
  initScrollReveals();
  initPubCards();
}
