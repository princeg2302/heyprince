/**
 * Advanced Client-Side Security & Inspection Protection
 *
 * Protects website intellectual property and integrity:
 * 1. Blocks right-click context menu (Inspect / View Page Source prevention)
 * 2. Blocks developer tools keyboard shortcuts (F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S, Ctrl+P)
 * 3. DevTools opening detection & debugger trapping
 * 4. Silences all console outputs in production and clears console history
 * 5. Disables image dragging and protects UI selection while keeping form inputs functional
 */

export function initSecurityShield(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Disable Right-Click Context Menu globally
  const blockContextMenu = (e: MouseEvent) => {
    // Allow context menu only if explicitly right-clicking inside an input/textarea if needed,
    // but the user asked to stop right click completely to prevent inspect.
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  document.addEventListener('contextmenu', blockContextMenu, true);
  window.addEventListener('contextmenu', blockContextMenu, true);

  // 2. Disable DevTools & Source View Keyboard Shortcuts
  const blockShortcuts = (e: KeyboardEvent) => {
    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl + Shift + I (Inspect)
    // Ctrl + Shift + J (Console)
    // Ctrl + Shift + C (Element selector)
    // Ctrl + Shift + K (Firefox console)
    if (isCtrlOrMeta && e.shiftKey) {
      const k = e.key.toUpperCase();
      if (k === 'I' || k === 'J' || k === 'C' || k === 'K') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl + U (View Source)
    // Ctrl + S (Save Webpage)
    // Ctrl + P (Print / Save PDF)
    if (isCtrlOrMeta) {
      const k = e.key.toUpperCase();
      if (k === 'U' || k === 'S' || k === 'P') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };
  window.addEventListener('keydown', blockShortcuts, true);
  document.addEventListener('keydown', blockShortcuts, true);

  // 3. Disable image dragging & unauthorized drag extraction
  document.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SVG' || target.closest('img'))) {
        e.preventDefault();
      }
    },
    true
  );

  // 4. Console Silencing & Security Notice
  try {
    const bannerStyle =
      'color: #ff2a55; font-size: 20px; font-weight: 800; font-family: Anton, sans-serif; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);';
    const subStyle =
      'color: #ffffff; font-size: 13px; font-family: sans-serif; font-weight: 600; line-height: 1.6;';

    const noop = () => {};

    // Override console output functions
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.dir = noop;
    console.table = noop;
    console.trace = noop;

    const printSecurityNotice = () => {
      try {
        console.clear();
        console.warn('%c⚠ SECURITY SHIELD ACTIVE — HEYPRINCE.IN', bannerStyle);
        console.warn(
          '%cDirect DOM inspection and console debugging are disabled to protect proprietary software architecture and intellectual property.',
          subStyle
        );
      } catch (_) {}
    };

    printSecurityNotice();
    setInterval(printSecurityNotice, 4000);

    // 5. DevTools Detection & Anti-Debugging Trap
    // When DevTools is open, hitting a debugger statement interrupts the inspector
    const debuggerTrap = () => {
      try {
        const start = performance.now();
        (function () {
          // eslint-disable-next-line no-debugger
          debugger;
        })();
        const duration = performance.now() - start;
        // If debugger paused or outer vs inner dimension delta indicates docked DevTools:
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        if (duration > 100 || widthThreshold || heightThreshold) {
          try {
            console.clear();
          } catch (_) {}
        }
      } catch (_) {}
    };

    setInterval(debuggerTrap, 1000);
  } catch (_) {}
}

