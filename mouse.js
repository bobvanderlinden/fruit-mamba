export default function(g) {
  g.mouse = {
    over: false,
    x: 0,
    y: 0,
    buttons: {}
  };
  function getX(e) {
    return e.pageX - g.canvas.offsetLeft;
  }
  function getY(e) {
    return e.pageY - g.canvas.offsetTop;
  }
  g.canvas.addEventListener(
    "mouseup",
    event => {
      if (g.mouse.buttons[event.button]) {
        g.mouse.x = getX(event);
        g.mouse.y = getY(event);

        delete g.mouse.buttons[event.button];
        g.emit("mouseup", event.button, g.mouse.x, g.mouse.y);
      }
      return false;
    },
    true
  );
  g.canvas.addEventListener(
    "mousedown",
    event => {
      if (!g.mouse.buttons[event.button]) {
        g.mouse.x = getX(event);
        g.mouse.y = getY(event);
        g.mouse.buttons[event.button] = true;
        g.emit("mousedown", event.button, g.mouse.x, g.mouse.y);
      }
      return false;
    },
    true
  );
  g.canvas.addEventListener(
    "mousemove",
    event => {
      g.mouse.x = getX(event);
      g.mouse.y = getY(event);
      g.emit("mousemove", g.mouse.x, g.mouse.y);
    },
    true
  );
  g.canvas.addEventListener(
    "mousewheel",
    event => {
      g.mouse.x = getX(event);
      g.mouse.y = getY(event);
      g.emit("mousewheel", event.deltaY, g.mouse.x, g.mouse.y);
    },
    true
  );
  g.canvas.addEventListener(
    "DOMMouseScroll",
    event => {
      g.mouse.x = getX(event);
      g.mouse.y = getY(event);
      g.emit("mousewheel", -event.detail);
    },
    false
  );
}
