'use client';

/*
  Minimal toast for mobile action feedback ("Moved to Dining ✓").
  Renders above the bottom tab bar, auto-dismisses. No provider needed —
  call showToast('message') from any client component.
*/

let activeToast: HTMLDivElement | null = null;

export function showToast(message: string) {
  if (typeof document === 'undefined') return;

  // replace any existing toast
  if (activeToast) { activeToast.remove(); activeToast = null; }

  const el = document.createElement('div');
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(96px + env(safe-area-inset-bottom))',
    transform: 'translateX(-50%) translateY(12px)',
    background: '#0F2044',
    color: '#ffffff',
    border: '1px solid rgba(46,211,198,0.45)',
    borderRadius: '100px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--font-body, sans-serif)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    zIndex: '2000',
    opacity: '0',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    pointerEvents: 'none',
    maxWidth: '86vw',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSStyleDeclaration);

  document.body.appendChild(el);
  activeToast = el;

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(12px)';
    setTimeout(() => { el.remove(); if (activeToast === el) activeToast = null; }, 220);
  }, 2200);
}
