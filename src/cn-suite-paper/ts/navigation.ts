import { SLIDE_TITLES, EXIT_LEFT_DURATION, SWIPE_THRESHOLD } from './constants';

export interface NavigationState {
  current: number;
  total: number;
  goTo: (idx: number) => void;
  navigate: (dir: number) => void;
}

function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}

const SLUG_TO_INDEX: Record<string, number> = {};
SLIDE_TITLES.forEach((t, i) => { SLUG_TO_INDEX[titleToSlug(t)] = i; });

function slideFromHash(): number {
  const hash = window.location.hash.slice(1);
  if (!hash) return -1;
  const slug = decodeURIComponent(hash).toLowerCase().replace(/\s+/g, '-');
  return slug in SLUG_TO_INDEX ? SLUG_TO_INDEX[slug] : -1;
}

export function initNavigation(
  onSlideChange: (idx: number) => void
): NavigationState {
  let current = 0;
  const slides = document.querySelectorAll<HTMLElement>('.slide');
  const total = slides.length;
  const navWrap = document.getElementById('navDots')!;
  const slideNum = document.getElementById('slideNum')!;
  const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
  const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;

  // Build nav items
  SLIDE_TITLES.forEach((title, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'nav-sep';
      sep.textContent = '/';
      navWrap.appendChild(sep);
    }
    const item = document.createElement('span');
    item.className = 'nav-item' + (i === 0 ? ' active' : '');
    item.textContent = title;
    item.addEventListener('click', () => goTo(i));
    navWrap.appendChild(item);
  });

  function updateHash(): void {
    const slug = titleToSlug(SLIDE_TITLES[current]);
    history.replaceState(null, '', '#' + slug);
  }

  function updateNav(): void {
    const items = navWrap.querySelectorAll('.nav-item');
    items.forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.classList.toggle('visited', i < current);
    });
    slideNum.textContent = `${current + 1} / ${total}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    const active = navWrap.querySelector('.nav-item.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function goTo(idx: number): void {
    if (idx < 0 || idx >= total || idx === current) return;
    const dir = idx > current ? 1 : -1;
    const prev = current;
    slides[prev].classList.remove('active');
    if (dir > 0) slides[prev].classList.add('exit-left');
    setTimeout(() => {
      slides[prev].classList.remove('exit-left');
    }, EXIT_LEFT_DURATION);

    current = idx;
    slides[current].classList.add('active');
    updateNav();
    updateHash();
    onSlideChange(idx);
  }

  function navigate(dir: number): void {
    goTo(current + dir);
  }

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      navigate(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigate(-1);
    }
  });

  // Touch/swipe support
  let touchStartX = 0;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > SWIPE_THRESHOLD) navigate(dx < 0 ? 1 : -1);
  });

  // Wire up control buttons
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));

  // Jump to hash-specified slide on load (no animation)
  const initialSlide = slideFromHash();
  if (initialSlide > 0) {
    slides[0].classList.remove('active');
    slides[initialSlide].classList.add('active');
    current = initialSlide;
    onSlideChange(initialSlide);
  }

  updateNav();
  updateHash();

  return { current, total, goTo, navigate };
}
