const POSITION_KEY = "jmdev-home-scroll";
const RETURN_KEY = "jmdev-home-scroll-return";

const read = (key) => {
  try {
    return JSON.parse(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
};

const isPosition = (value) => Number.isFinite(value) && value >= 0;

export function rememberHomeScroll(path, top) {
  if (!isPosition(top)) return;
  try {
    const positions = read(POSITION_KEY);
    window.sessionStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ ...positions, [path]: top }),
    );
  } catch {
    // Native navigation remains available when storage is blocked.
  }
}

export function prepareHomeReturn(path) {
  const top = read(POSITION_KEY)?.[path];
  if (!isPosition(top)) return false;
  try {
    window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({ path, top }));
    return true;
  } catch {
    return false;
  }
}

export function takeHomeReturn(path) {
  const position = read(RETURN_KEY);
  try {
    window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    return null;
  }
  return position?.path === path && isPosition(position.top)
    ? position.top
    : null;
}
