import type { TooltipApi } from './types';

export function initTooltip(): TooltipApi {
  const el = document.createElement('div');
  el.className = 'chart-tooltip';
  document.body.appendChild(el);

  function show(evt: MouseEvent, html: string): void {
    el.innerHTML = html;
    el.classList.add('visible');
    const x = Math.min(evt.clientX + 14, window.innerWidth - 260);
    const y = Math.max(evt.clientY - 40, 8);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  function hide(): void {
    el.classList.remove('visible');
  }

  return { show, hide };
}
