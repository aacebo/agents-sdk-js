export function debounce(cb: (...args: any[]) => void, duration = 0) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const fn = (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    timeout = setTimeout(() => {
      cb(...args);
      timeout = undefined;
    }, duration);
  };

  return fn;
}
