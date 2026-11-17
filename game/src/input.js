// Keyboard and mouse state for Emberlight Arena. The game reads this one
// object every fixed step: which movement keys are held, where the mouse
// aims in canvas pixels, whether the fire button is held, and which keys
// were just pressed this frame (for menus, dash, pause and restart).
export function createInput() {
  return {
    keys: new Set(),
    justPressed: new Set(),
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    clicked: false,
    clickX: 0,
    clickY: 0,

    down(code) {
      return this.keys.has(code);
    },

    pressed(code) {
      return this.justPressed.has(code);
    },

    // Movement vector from WASD or the arrow keys, normalised.
    moveVector() {
      let x = 0;
      let y = 0;
      if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
      if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
      if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
      if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },

    beginFrame() {
      this.justPressed.clear();
      this.clicked = false;
    },
  };
}

// Wire the DOM events of a canvas to an input object. Coordinates are
// translated into the canvas's own 1280x720 space whatever its CSS size.
export function attachInput(input, canvas, scaleOf) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      input.keys.add(event.code);
      input.justPressed.add(event.code);
    }
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouseDown = false;
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scale = scaleOf();
    input.mouseX = (event.clientX - rect.left) / scale;
    input.mouseY = (event.clientY - rect.top) / scale;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scale = scaleOf();
    input.mouseX = (event.clientX - rect.left) / scale;
    input.mouseY = (event.clientY - rect.top) / scale;
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = input.mouseX;
    input.clickY = input.mouseY;
    if (event.button === 0) event.preventDefault();
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}
