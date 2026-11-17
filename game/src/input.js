// input.js — Keyboard and mouse, reduced to a small action bitmask plus a
// "pressed this frame" set for one-shot keys. WASD and arrows move, Enter
// and Space confirm, E enters and exits cars, F punches, Q saves, M mutes,
// Shift runs, P and Escape pause, C continues from the title, T returns to
// the title from pause. R changes the radio station, 1-4 switch weapons,
// and the mouse aims and fires.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER_CAR = 4;
export const ACTION_PUNCH = 8;
export const ACTION_SAVE = 16;
export const ACTION_MUTE = 32;

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: 640, y: 360, down: false, clicked: false },
    actions: 0,
  };
  const keyMap = {
    Enter: ACTION_CONFIRM,
    Space: ACTION_CONFIRM,
    KeyP: ACTION_PAUSE,
    Escape: ACTION_PAUSE,
    KeyE: ACTION_ENTER_CAR,
    KeyF: ACTION_PUNCH,
    KeyQ: ACTION_SAVE,
    KeyM: ACTION_MUTE,
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) {
      input.pressed.add(e.code);
      if (keyMap[e.code]) input.actions |= keyMap[e.code];
    }
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    input.mouse.down = true;
    input.mouse.clicked = true;
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    if (e.button === 0) e.preventDefault();
  });
  window.addEventListener('mouseup', () => {
    input.mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}

export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  return { x, y };
}

export function isRunning(input) {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}

export function endFrame(input) {
  input.pressed.clear();
  input.actions = 0;
  input.mouse.clicked = false;
}
