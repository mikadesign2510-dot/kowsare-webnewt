import { storage } from './storage';

// Keep track of recent error signatures to prevent flooding
const recentErrorSignatures = new Map<string, number>();

function shouldIgnoreMessage(msg: string): boolean {
  if (!msg) return true;
  const lower = msg.toLowerCase();
  
  return (
    lower.includes('failed to fetch dynamically imported module') ||
    lower.includes('dynamically imported module') ||
    lower.includes('error loading dynamically imported module') ||
    lower.includes('failed to connect to websocket') ||
    lower.includes('[vite] failed to connect to websocket') ||
    lower.includes('vite:preloaderror') ||
    lower.includes('resizeobserver loop limit exceeded') ||
    lower.includes('aborterror') ||
    lower.includes('the user aborted a request') ||
    lower.includes('user aborted a request') ||
    lower.includes('warning:') ||
    lower.includes('non-error promise rejection captured') ||
    lower.includes('chrome-extension://') ||
    lower.includes('moz-extension://') ||
    lower.includes('safari-extension://') ||
    lower.includes('notallowederror: play() failed') ||
    lower.includes('download the react devtools')
  );
}

function isDuplicateFlood(signature: string): boolean {
  const now = Date.now();
  const lastTime = recentErrorSignatures.get(signature) || 0;
  if (now - lastTime < 10000) {
    // Suppress duplicates within 10 seconds
    return true;
  }
  recentErrorSignatures.set(signature, now);
  // Keep cache small
  if (recentErrorSignatures.size > 100) {
    for (const [k, t] of recentErrorSignatures.entries()) {
      if (now - t > 30000) recentErrorSignatures.delete(k);
    }
  }
  return false;
}

export const initErrorLogger = () => {
  if (typeof window === 'undefined') return;

  const handleChunkLoadFailure = () => {
    try {
      const lastReload = parseInt(sessionStorage.getItem('kowsar_chunk_reload') || '0', 10);
      if (Date.now() - lastReload > 8000) {
        sessionStorage.setItem('kowsar_chunk_reload', Date.now().toString());
        console.warn('Deployment chunk hash change detected. Reloading page to fetch latest bundle...');
        window.location.reload();
      }
    } catch {}
  };

  // Listen for Vite preload error
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    handleChunkLoadFailure();
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || (typeof event.reason === 'string' ? event.reason : '');
    
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      event.reason?.name === 'ChunkLoadError'
    ) {
      handleChunkLoadFailure();
      return;
    }

    if (shouldIgnoreMessage(msg)) return;
    if (isDuplicateFlood(msg)) return;

    storage.addLog({
      level: 'error',
      source: 'Unhandled Promise Rejection',
      message: msg || 'خطای ناهمگام در کلاینت (Promise Rejection)',
      details: event.reason?.stack || JSON.stringify(event.reason),
      isSuperficial: msg.includes('NetworkError') || msg.includes('Failed to fetch')
    });
  });

  // Capture global window errors
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (shouldIgnoreMessage(msg)) return;

    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('dynamically imported module') ||
      msg.includes('error loading dynamically imported module')
    ) {
      handleChunkLoadFailure();
      return;
    }

    if (isDuplicateFlood(`${msg}-${event.filename}-${event.lineno}`)) return;

    storage.addLog({
      level: 'error',
      source: 'Global Window Error',
      message: msg || 'خطای ناشناخته در اجرا',
      details: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      isSuperficial: false
    });
  });

  // Override console.error with strict filtering
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original first
    originalConsoleError.apply(console, args);

    const message = args.map(arg => 
      typeof arg === 'object' ? (arg instanceof Error ? arg.message : JSON.stringify(arg)) : String(arg)
    ).join(' ');

    if (shouldIgnoreMessage(message)) return;
    if (isDuplicateFlood(message)) return;

    storage.addLog({
      level: 'warning',
      source: 'Console Warning',
      message: message.substring(0, 200),
      details: args.map(a => typeof a === 'object' && a instanceof Error ? a.stack : '').filter(Boolean).join('\n'),
      isSuperficial: true
    });
  };
};
