import { useEffect, useState } from 'react';

/**
 * DelayedFallback:
 * Prevents jarring "flash-of-loading" flickers on fast connections.
 * It delays rendering its fallback content by `delay` milliseconds (default: 300ms).
 * If the lazy-loaded chunk resolves before the delay expires, React unmounts
 * the fallback before it ever renders, delivering a smooth, flicker-free experience.
 */
function DelayedFallback({ delay = 300, children }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return null;
  }

  return children;
}

export default DelayedFallback;
