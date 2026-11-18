// Porto Verde v6 — keyboard + mouse. One frame's worth of actions is taken with
// takeActions; held keys are readable any time through isDown.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER_CAR = 4;
export const ACTION_PUNCH = 8;
export const ACTION_SAVE = 16;
export const ACTION_MUTE = 32;

const CONFIRM_KEYS = new Set(['Enter', 'Space']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const down = new Set();
  const queued = new Set();
  const mouse = { x: 0, y: 0, clicked: false, down: false };

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) queued.add(e.code);
    down.add(e.code);
  }
  function onKeyUp(e) { down.delete(e.code); }
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }
  function onMouseDown(e) { onMouseMove(e); mouse.down = true; mouse.clicked = true; }
  function onMouseUp() { mouse.down = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    mouse,
    isDown(code) { return down.has(code); },
    pressed(code) {
      if (queued.has(code)) { queued.delete(code); return true; }
      return false;
    },
    direction() {
      let x = 0;
      let y = 0;
      if (down.has('KeyA') || down.has('ArrowLeft')) x -= 1;
      if (down.has('KeyD') || down.has('ArrowRight')) x += 1;
      if (down.has('KeyW') || down.has('ArrowUp')) y -= 1;
      if (down.has('KeyS') || down.has('ArrowDown')) y += 1;
      return { x, y };
    },
    takeActions() {
      let actions = 0;
      for (const code of [...queued]) {
        if (CONFIRM_KEYS.has(code)) actions |= ACTION_CONFIRM;
        else if (PAUSE_KEYS.has(code)) actions |= ACTION_PAUSE;
        else if (code === 'KeyE') actions |= ACTION_ENTER_CAR;
        else if (code === 'KeyF') actions |= ACTION_PUNCH;
        else if (code === 'KeyQ') actions |= ACTION_SAVE;
        else if (code === 'KeyM') actions |= ACTION_MUTE;
        queued.delete(code);
      }
      return actions;
    },
    takeClick() {
      const c = mouse.clicked;
      mouse.clicked = false;
      return c;
    },
  };
}
