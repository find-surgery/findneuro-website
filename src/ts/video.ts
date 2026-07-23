import { DEFAULT_SUBTITLE_LANG } from './constants.ts';

/**
 * Pitch-video subtitle picker (recognition section). The <track> elements carry
 * WebVTT subtitles (English / Japanese); the pill row drives textTracks[].mode
 * directly - one consistent, discoverable selector across browsers. The native
 * controls (whose CC menu still works, e.g. in iOS fullscreen) are kept.
 */
export function initPitchVideo(): void {
  const video = document.getElementById('pitch-video') as HTMLVideoElement | null;
  if (!video) return;
  const pills = Array.from(document.querySelectorAll<HTMLButtonElement>('.subtitle-pill'));

  let current = DEFAULT_SUBTITLE_LANG;
  const apply = (): void => {
    for (const track of Array.from(video.textTracks)) {
      track.mode = track.language === current ? 'showing' : 'disabled';
    }
    for (const pill of pills) {
      const active = (pill.dataset.subtitleLang || '') === current;
      pill.classList.toggle('subtitle-pill--active', active);
      pill.setAttribute('aria-pressed', String(active));
    }
  };

  pills.forEach((pill) => pill.addEventListener('click', () => {
    current = pill.dataset.subtitleLang || '';
    apply();
  }));
  // Tracks attach asynchronously (and no <track default> - this state is the source
  // of truth), so assert the selection both now and once metadata arrives.
  video.addEventListener('loadedmetadata', apply);
  apply();
}
