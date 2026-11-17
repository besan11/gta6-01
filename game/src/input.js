// Keyboard + mouse input: one bitmask of actions per frame plus a live movement vector.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER_CAR = 4;
export const ACTION_PUNCH = 8;
export const ACTION_SAVE = 16;
export const ACTION_MUTE = 32;
export const ACTION_RADIO = 64;
export const ACTION_WEAPON1 = 128;
export const ACTION_WEAPON2 = 256;
export const ACTION_WEAPON3 = 512;
export const ACTION_WEAPON4 = 1024;
export const ACTION_CONTINUE = 2048;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseX = 0;
  let mouseY = 0;
  let mouseDown = false;
  let clicked = false;

  function press(code) {
    if (code === 'Enter' || code === 'Space') actions |= ACTION_CONFIRM;
    else if (code === 'KeyP' || code === 'Escape') actions |= ACTION_PAUSE;
    else if (code === 'KeyE') actions |= ACTION_ENTER_CAR;
    else if (code === 'KeyF') actions |= ACTION_PUNCH;
    else if (code === 'KeyQ') actions |= ACTION_SAVE;
    else if (code === 'KeyM') actions |= ACTION_MUTE;
    else if (code === 'KeyR') actions |= ACTION_RADIO;
    else if (code === 'Digit1') actions |= ACTION_WEAPON1;
    else if (code === 'Digit2') actions |= ACTION_WEAPON2;
    else if (code === 'Digit3') actions |= ACTION_WEAPON3;
    else if (code === 'Digit4') actions |= ACTION_WEAPON4;
    else if (code === 'KeyC') actions |= ACTION_CONTINUE;
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys.add(e.code);
    press(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    clicked = true;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    e.preventDefault();
  });
  window.addEventListener('mouseup', () => { mouseDown = false; });
  window.addEventListener('blur', () => keys.clear());

  return {
    takeActions() {
      const a = actions;
      actions = 0;
      return a;
    },
    move() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
      return { x, y };
    },
    running() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    has(code) { return keys.has(code); },
    mouse() { return { x: mouseX, y: mouseY, down: mouseDown }; },
    takeClick() {
      const c = clicked;
      clicked = false;
      return c;
    },
  };
}
