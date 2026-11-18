// Keyboard + mouse input. One shared state object; the game loop reads it,
// never the DOM directly, so playtests can drive the same paths.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER_CAR = 4;
export const ACTION_PUNCH = 8;
export const ACTION_SAVE = 16;
export const ACTION_MUTE = 32;

export function createInput() {
  return {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: 640, y: 360, down: false, clicked: false, wx: 0, wy: 0 },
    actions: 0,
  };
}

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM, Space: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  KeyE: ACTION_ENTER_CAR, KeyF: ACTION_PUNCH,
  KeyQ: ACTION_SAVE, KeyM: ACTION_MUTE,
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
    if (!e.repeat) {
      input.pressed.add(e.code);
      if (KEY_ACTIONS[e.code]) input.actions |= KEY_ACTIONS[e.code];
    }
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    input.mouse.down = true;
    input.mouse.clicked = true;
    if (e.button === 0) input.mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => { input.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Movement vector from WASD / arrows, normalised.
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
  return { x, y };
}

export function consumeActions(input) {
  const a = input.actions;
  input.actions = 0;
  input.pressed.clear();
  input.mouse.clicked = false;
  return a;
}
