import { useEffect, useRef } from 'react';

/**
 * Keeps the dialog body scroll position when switching browser tabs.
 *
 * MUI gives both Paper and DialogContent `overflow-y: auto`. Prefer one scrollport:
 * Paper `overflowY: 'hidden'` and DialogContent `minHeight: 0` so `scrollTop` on Content is real.
 *
 * Browsers often zero scrollTop before `visibilitychange` fires; we track the last
 * non-zero position from `scroll` events and never downgrade stored scroll on tab hide.
 * Restore runs several times (rAF + timeouts + delayed passes) so focus/layout cannot
 * snap the dialog back to the top after tab return.
 */
export function useDialogScrollThroughVisibility(open, contentRef, readStoredScroll, writeStoredScroll) {
  const readRef = useRef(readStoredScroll);
  const writeRef = useRef(writeStoredScroll);
  const lastScrollTopRef = useRef(0);
  readRef.current = readStoredScroll;
  writeRef.current = writeStoredScroll;

  useEffect(() => {
    if (!open) {
      lastScrollTopRef.current = 0;
      return;
    }
    const stored = readRef.current();
    if (Number.isFinite(stored) && stored > 0) {
      lastScrollTopRef.current = Math.max(lastScrollTopRef.current, stored);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let el = contentRef.current;
    let rafId = 0;
    let cancelled = false;

    const onScroll = () => {
      const node = contentRef.current;
      if (!node) return;
      const y = Math.max(0, node.scrollTop || 0);
      lastScrollTopRef.current = Math.max(lastScrollTopRef.current, y);
      writeRef.current(lastScrollTopRef.current);
    };

    const attach = () => {
      if (cancelled) return;
      el = contentRef.current;
      if (!el) {
        rafId = requestAnimationFrame(attach);
        return;
      }
      el.addEventListener('scroll', onScroll, { passive: true });
    };

    attach();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (el) {
        try {
          el.removeEventListener('scroll', onScroll);
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, [open, contentRef]);

  useEffect(() => {
    if (!open) return;

    const flush = () => {
      const node = contentRef.current;
      const fromDom = node ? Math.max(0, node.scrollTop || 0) : 0;
      const fromMemory = lastScrollTopRef.current;
      const fromStorage = readRef.current();
      const y = Math.max(fromDom, fromMemory, Number.isFinite(fromStorage) ? fromStorage : 0);
      lastScrollTopRef.current = y;
      if (y > 0) {
        writeRef.current(y);
      }
    };

    const applyScroll = (y) => {
      const node = contentRef.current;
      if (!node || !Number.isFinite(y) || y <= 0) return;
      try {
        node.scrollTop = y;
      } catch (e) {
        /* ignore */
      }
    };

    const restore = () => {
      flush();
      const fromStorage = readRef.current();
      const y = Math.max(
        lastScrollTopRef.current,
        Number.isFinite(fromStorage) ? fromStorage : 0
      );
      if (!Number.isFinite(y) || y <= 0) return;
      lastScrollTopRef.current = y;

      const schedule = () => applyScroll(y);
      schedule();
      requestAnimationFrame(() => {
        schedule();
        requestAnimationFrame(() => {
          schedule();
          setTimeout(schedule, 0);
          setTimeout(schedule, 32);
          setTimeout(schedule, 100);
          setTimeout(schedule, 250);
          setTimeout(schedule, 500);
          setTimeout(schedule, 800);
        });
      });
    };

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      } else {
        restore();
      }
    };

    const onFocus = () => restore();

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('focus', onFocus);
    };
  }, [open, contentRef]);
}
