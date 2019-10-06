define([
  "platform",
  "game",
  "vector",
  "staticcollidable",
  "linesegment",
  "editor",
  "state",
  "level",
  "mouse",
  "collision",
  "keyboard",
  "quake",
  "resources",
  "objectmanager",
  "graphics",
  "particleemitter"
], function(
  platform,
  Game,
  Vector,
  StaticCollidable,
  LineSegment,
  editor,
  state,
  level,
  mouse,
  collision,
  keyboard,
  quake,
  resources,
  ObjectManager,
  Graphics,
  ParticleEmitter
) {
  var rs = {
    images: [
      "test",
      "square",
      "snake/head",
      "snake/grape",
      "snake/orange",
      "snake/strawberry",
      "snake/blueberry",
      "snake/banana",
      "fruit/grape",
      "fruit/orange",
      "fruit/strawberry",
      "fruit/blueberry",
      "fruit/banana",
      "fruit/golden_apple",
      "tree",
      "game_state/dead",
      "game_state/victory",
      "blocks/green",
      "blocks/yellow",
      "blocks/pink"
    ],
    audio: ["test"]
  };
  var g, game;
  platform.once("load", function() {
    var canvas = document.getElementById("main");
    game = g = new Game(startGame, canvas, [
      mouse,
      keyboard,
      resources(rs),
      state,
      level,
      collision,
      quake
    ]);
    g.resources.status.on("changed", function() {
      g.graphics.context.clearRect(0, 0, game.width, game.height);
      g.graphics.context.fillStyle = "black";
      g.graphics.context.font = "arial";
      g.graphics.fillCenteredText(
        `Preloading ${g.resources.status.ready} / ${g.resources.status.total}...`,
        400,
        300
      );
    });
    window.onresize = g.graphics.resizeCanvas.bind(g.graphics);
  });

  function startGame(err) {
    if (err) {
      console.error(err);
    }

    g.graphics.resizeCanvas();

    var images = g.resources.images;
    var audio = g.resources.audio;

    g.objects.lists.collidable = g.objects.createIndexList("collidable");
    g.objects.lists.start = g.objects.createIndexList("start");
    g.objects.lists.shadow = g.objects.createIndexList("shadow");
    g.objects.lists.background = g.objects.createIndexList("background");
    g.objects.lists.foreground = g.objects.createIndexList("foreground");
    g.objects.lists.grounded = g.objects.createIndexList("grounded");
    g.objects.lists.export = g.objects.createIndexList("export");
    g.objects.lists.cell = g.objects.createIndexList("cell");

    // Auto-refresh
    // (function() {
    //  var timeout = setTimeout(function() {
    //      document.location.reload(true);
    //  }, 3000);
    //  g.once('keydown',function() {
    //      disable();
    //  });
    //  g.once('mousemove',function() {
    //      disable();
    //  });
    //  g.chains.draw.unshift(draw);
    //  function draw(g,next) {
    //      // console.log(game.chains.draw.slice(0));
    //      g.fillStyle('#ff0000');
    //      g.fillCircle(game.width,0,30);
    //      g.fillStyle('black');
    //      next(g);
    //  }
    //  function disable() {
    //      clearTimeout(timeout);
    //      g.chains.draw.remove(draw);
    //  }
    // })();

    // Camera
    (function() {
      game.camera = new Vector(0, 0);
      // 9 tiles vertically
      game.camera.zoom = 8;
      game.camera.PTM = 512;
      game.camera.x = -(game.width * 0.5) / getPixelsPerMeter();
      game.camera.y = (game.height * 0.5) / getPixelsPerMeter();
      game.camera.smoothx = game.camera.x;
      game.camera.smoothy = game.camera.x;
      game.camera.screenToWorld = function(screenV, out) {
        var ptm = getPixelsPerMeter();
        out.x = screenV.x / ptm + game.camera.x;
        out.y = screenV.y / ptm - game.camera.y;
      };
      game.camera.worldToScreen = function(worldV, out) {
        var ptm = getPixelsPerMeter();
        out.x = (worldV.x - game.camera.x) * ptm;
        out.y = (worldV.y - game.camera.y) * ptm * -1;
      };
      game.camera.getPixelsPerMeter = getPixelsPerMeter;

      function getPixelsPerMeter() {
        return game.camera.PTM / game.camera.zoom;
      }
      game.camera.reset = function() {
        updateCamera(0.001);
        game.camera.x = game.camera.targetx;
        game.camera.y = game.camera.targety;
        game.camera.smoothx = game.camera.x;
        game.camera.smoothy = game.camera.y;
      };
      var pattern;

      function drawCamera(g, next) {
        var ptm = getPixelsPerMeter();
        // g.save();
        // g.context.translate(-x*ptm,y*ptm);
        // g.fillStyle(pattern);
        // g.fillRectangle(x*ptm,-y*ptm,game.width,game.height);
        // g.restore();
        g.save();
        g.context.scale(ptm, ptm);
        g.context.lineWidth /= ptm;
        g.context.translate(-game.camera.x, game.camera.y);
        next(g);
        g.restore();
      }

      function updateCamera(dt) {
        var ptm = getPixelsPerMeter();
        // if (!pattern) {
        //   pattern = g.context.createPattern(images.background,'repeat');
        // }
        // Follow player
        var targetx = player.position.x - (game.width * 0.5) / ptm;
        const minTargety = (game.height * 0.5) / ptm;
        var targety = Math.max(minTargety - player.position.y, minTargety);

        game.camera.targetx = targetx;
        game.camera.targety = targety;
        // Look forward
        // targetx += player.velocity.x * 10;
        // targety += player.velocity.y * 10;
        // Smooth
        var smoothx = (game.camera.smoothx =
          0.95 * game.camera.smoothx + 0.05 * targetx);
        var smoothy = (game.camera.smoothy =
          0.95 * game.camera.smoothy + 0.05 * targety);

        game.camera.x = smoothx;
        game.camera.y = smoothy;
        // No smoothing
        // game.camera.x = targetx;
        // game.camera.y = targety;
      }

      g.chains.update.push(
        (g.chains.update.camera = function(dt, next) {
          next(dt);
          updateCamera(dt);
        })
      );

      g.chains.draw.camera = drawCamera;
      g.chains.draw.insertBefore(drawCamera, g.chains.draw.objects);
    })();

    (function() {
      g.chains.update.push(
        (g.chains.update.camera = function(dt, next) {
          next(dt);
          game.objects.lists.cell.each(o => {
            if (!o instanceof Cell) {
              return;
            }
            if (o._grid) {
              return;
            }
            o._grid = true;
            o.addToGrid();
          });
        })
      );
    })();

    // Draw foreground
    (function() {
      game.chains.draw.push(function(g, next) {
        game.objects.lists.foreground.each(o => {
          o.drawTile(g);
        });
        next(g);
      });
    })();

    // Draw debug objects
    // game.chains.draw.push(function(g, next) {
    //   next(g);
    //   game.objects.lists.foreground.each(o => {
    //     if (o.child) {
    //       g.strokeStyle("red");
    //       g.strokeLine(
    //         o.position.x,
    //         o.position.y,
    //         o.child.position.x,
    //         o.child.position.y
    //       );
    //     }
    //   });
    // });
    // (function() {
    //   game.chains.draw.insertAfter(function(g, next) {
    //     next(g);
    //     game.objects.objects.each(function(o) {
    //       g.strokeStyle("red");
    //       g.strokeCircle(o.position.x, o.position.y, o.touchRadius || 10);
    //     });

    //     for(let y=-10;y<10;y++) {
    //       for(let x=-10;x<10;x++) {
    //         g.strokeCircle(x, y, 0.5);
    //       }
    //     }
    //   }, game.chains.draw.camera);
    // })();

    //#gameobjects

    let grid = {};
    function getCell(x, y) {
      return grid[`${x}x${y}`];
    }
    function getCellOf(x, y, type) {
      const cell = getCell(x, y);
      if (!cell) {
        return;
      }
      return [...cell].filter(c => c instanceof type)[0];
    }
    function hasCell(x, y, type) {
      const cell = getCell(x, y);
      if (!cell) {
        return;
      }
      return [...cell].some(c => c instanceof type);
    }
    function addToCell(x, y, value) {
      if (!grid[`${x}x${y}`]) {
        grid[`${x}x${y}`] = new Set();
      }
      grid[`${x}x${y}`].add(value);
    }
    function removeFromCell(x, y, value) {
      grid[`${x}x${y}`].delete(value);
      if (grid[`${x}x${y}`].size === 0) {
        delete grid[`${x}x${y}`];
      }
    }

    // Player

    class Cell {
      constructor({ x, y, tile }) {
        this.position = new Vector(x, y);
        this.tile = tile || this.constructor.tile;
      }

      setPosition(x, y) {
        this.removeFromGrid();
        this.position.set(x, y);
        this.addToGrid();
      }

      drawTile(g) {
        g.save();
        g.context.translate(this.position.x, this.position.y);
        g.context.scale(1 / game.camera.PTM, 1 / game.camera.PTM);
        g.drawCenteredImage(this.tile, 0, 0);
        g.restore();
      }

      addToGrid() {
        addToCell(this.position.x, this.position.y, this);
      }

      removeFromGrid() {
        removeFromCell(this.position.x, this.position.y, this);
      }
      destroy() {
        this.removeFromGrid();
        game.objects.remove(this);
      }
    }
    Cell.prototype.foreground = true;
    Cell.prototype.cell = true;

    class StaticCell extends Cell {}

    class Block extends StaticCell {
      addToGrid() {
        addToCell(this.position.x + 1, this.position.y, this);
        addToCell(this.position.x, this.position.y, this);
        addToCell(this.position.x + -1, this.position.y, this);
      }
      removeFromGrid() {
        removeFromCell(this.position.x + 1, this.position.y, this);
        removeFromCell(this.position.x, this.position.y, this);
        removeFromCell(this.position.x + -1, this.position.y, this);
      }
    }

    class PinkBlock extends Block {
      static tile = images["blocks/pink"];
    }

    class YellowBlock extends Block {
      static tile = images["blocks/yellow"];
    }

    class GreenBlock extends Block {
      static tile = images["blocks/green"];
    }

    class Segment extends Cell {
      constructor({ child }) {
        super(...arguments);
        this.child = child;
      }

      moveTo(x, y) {
        const { x: oldx, y: oldy } = this.position;
        this.setPosition(x, y);
        if (this.child) {
          this.child.moveTo(oldx, oldy);
        }
      }
    }

    class Start {
      constructor({ x, y }) {
        this.position = new Vector(x, y);
      }

      start() {
        if (this.spawned) {
          return;
        }
        player = new Player({
          x: this.position.x,
          y: this.position.y,
          tile: images["snake/head"]
        });
        game.objects.add(player);
        this.spawned = true;
      }
    }

    (function() {
      g.on("levelchanged", () => {
        game.objects.objects.each(o => {
          if (o.start) {
            o.start();
          }
        });
      });

      g.on("levelunloaded", () => {
        g.objects.objects.each(o => {
          g.objects.remove(o);
        });
        g.objects.handlePending();
      });
    })();

    class Player extends Segment {
      static updatable = true;
      static foreground = true;

      _dt = 0;

      constructor() {
        super(...arguments);
        this.velocity = new Vector(0, 0);
      }
      drawTile(g) {
        g.save();
        g.context.translate(this.position.x, this.position.y);
        g.context.scale(1 / game.camera.PTM, 1 / game.camera.PTM);
        g.context.scale(this.velocity.x >= 0 ? 1 : -1, 1);
        const hpi = Math.PI * 0.5;
        g.context.rotate(
          this.velocity.y === 0 ? 0 : this.velocity.y > 0 ? hpi : -hpi
        );
        g.drawCenteredImage(this.tile, 0, 0);
        g.restore();
      }
      isOnGround() {
        return [...getSegments(this)].some(segment =>
          hasCell(segment.position.x, segment.position.y + 1, StaticCell)
        );
      }
      update(dt) {
        this._dt += dt;

        if (this._dt > 0.5) {
          this._dt = 0;

          // Do not allow moving when not touching ground
          if (!this.isOnGround()) {
            for (let segment of getSegments(this)) {
              segment.setPosition(segment.position.x, segment.position.y + 1);
            }
          }

          if ([...getSegments(this)].every(s => s.position.y > 0)) {
            g.changeState(deadState());
          }
        }
      }
      eat(fruit) {
        fruit.eatenBy(this);
      }
    }

    class Box extends StaticCell {
      static tile = images.square;
      static export = true;
      constructor({ x, y }) {
        super({ x, y });
      }
    }

    class Fruit extends Cell {
      static export = true;
      eatenBy(player) {
        const segment = new Segment({
          x: player.position.x,
          y: player.position.y,
          tile: this.segmentTile || this.constructor.segmentTile,
          child: player.child
        });
        game.objects.add(segment);
        player.child = segment;
        player.setPosition(this.position.x, this.position.y);
        this.destroy();
      }
    }

    class Grape extends Fruit {
      static tile = images["fruit/grape"];
      static segmentTile = images["snake/grape"];
    }
    class Orange extends Fruit {
      static tile = images["fruit/orange"];
      static segmentTile = images["snake/orange"];
    }
    class Strawberry extends Fruit {
      static tile = images["fruit/strawberry"];
      static segmentTile = images["snake/strawberry"];
    }
    class Blueberry extends Fruit {
      static tile = images["fruit/blueberry"];
      static segmentTile = images["snake/blueberry"];
    }
    class Banana extends Fruit {
      static tile = images["fruit/banana"];
      static segmentTile = images["snake/banana"];
    }
    class GoldenApple extends Fruit {
      static tile = images["fruit/golden_apple"];
      eatenBy(player) {
        this.destroy();
        g.changeState(winState());
      }
    }

    class Tree extends Cell {
      static tile = images["tree"];
      static export = true;
      constructor({ x, y }) {
        super({ x, y });
      }
    }

    function* getSegments(root) {
      let segment = root;
      while (segment) {
        yield segment;
        segment = segment.child;
      }
    }

    // #editor
    function startEditor() {
      let items = [
        Box,
        Grape,
        Orange,
        Strawberry,
        Blueberry,
        Banana,
        GoldenApple,
        Tree,
        GreenBlock,
        YellowBlock,
        PinkBlock
      ];
      let item = items[0];

      var leveldef = [];

      function getPosition() {
        var tmp = new Vector();
        game.camera.screenToWorld(game.mouse, tmp);
        tmp.x = Math.round(tmp.x);
        tmp.y = Math.round(tmp.y);
        return tmp;
      }
      function place() {
        var p = getPosition();
        game.objects.add(
          new item({
            x: p.x,
            y: p.y
          })
        );
      }
      function deleteItem() {
        var p = getPosition();
        const obj = getCell(p.x, p.y);
        obj.forEach(o => o.destroy());
      }
      function exportConsole() {
        const items = [];
        game.objects.lists.export.each(obj => {
          items.push(obj);
        });
        const str = items
          .map(
            item =>
              `new ${item.constructor.name}(${item.position.x}, ${item.position.y}),`
          )
          .join("\n");
        console.log(str);
      }
      g.on("mousedown", function(button) {
        if (button === 0) {
          place();
        } else if (button === 2) {
          deleteItem();
        }
      });
      g.on("keydown", function(button) {
        if (button === "p") {
          exportConsole();
        }
        var d = (button === "]" ? 1 : 0) - (button === "[" ? 1 : 0);
        item = items[(items.indexOf(item) + d + items.length) % items.length];
      });

      game.chains.draw.push(function(g, next) {
        next(g);

        const leftTop = new Vector();
        game.camera.screenToWorld(Vector.zero, leftTop);

        const rightBottom = new Vector();
        game.camera.screenToWorld(
          new Vector(game.width, game.height),
          rightBottom
        );
        leftTop.x = Math.floor(leftTop.x);
        leftTop.y = Math.floor(leftTop.y);

        rightBottom.x = Math.ceil(rightBottom.x);
        rightBottom.y = Math.ceil(rightBottom.y);

        g.context.globalAlpha = 0.1;
        g.strokeStyle("black");
        for (let x = leftTop.x; x < rightBottom.x; x++) {
          g.strokeLine(x - 0.5, leftTop.y, x - 0.5, rightBottom.y);
        }
        for (let y = leftTop.y; y < rightBottom.y; y++) {
          g.strokeLine(leftTop.x, y - 0.5, rightBottom.x, y - 0.5);
        }
        g.context.globalAlpha = 1;

        var p = getPosition();

        g.fillStyle("black");
        g.fillCircle(p.x, p.y, 0.1);

        if (item) {
          g.context.globalAlpha = 0.5;
          item.prototype.drawTile.call(
            {
              position: { x: p.x, y: p.y },
              tile: item.tile
            },
            g
          );
          g.context.globalAlpha = 1;
        }
      });
    }
    var editorStarted = false;
    game.on("keydown", function(button) {
      if (button === "e" && !editorStarted) {
        editorStarted = true;
        startEditor();
      }
    });

    //#states
    function gameplayState() {
      const me = {
        enabled: false,
        enable: enable,
        disable: disable
      };
      function enable() {
        game.camera.reset();
        game.camera.smoothx += 300;
        g.chains.draw.unshift(draw);
        g.on("keydown", keydown);
      }

      function disable() {
        g.chains.draw.remove(draw);
        g.removeListener("keydown", keydown);
      }

      function keydown(key) {
        const movement = new Vector(
          (key === "right" ? 1 : 0) - (key === "left" ? 1 : 0),
          (key === "down" ? 1 : 0) - (key === "up" ? 1 : 0)
        );

        if (movement.equalsV(Vector.zero)) {
          return;
        }

        // don't allow moving while in air
        if (!player.isOnGround()) {
          return;
        }

        const x = player.position.x + movement.x;
        const y = player.position.y + movement.y;

        // Do not allow moving into body and also do not allow moving into ground
        if (hasCell(x, y, Segment) || hasCell(x, y, StaticCell)) {
          return;
        }

        const fruit = getCellOf(x, y, Fruit);
        if (fruit) {
          player.eat(fruit);
          player.velocity.setV(movement);
          return;
        }

        player.moveTo(x, y);
        player.velocity.setV(movement);
      }

      function mousedown() {}

      function draw(g, next) {
        // Draw HUD
        next(g);
      }

      return me;
    }

    function winState() {
      const me = {
        enabled: false,
        enable: enable,
        disable: disable
      };
      var time = 0;
      let body = document.body;
      function enable() {
        g.chains.update.insertBefore(update, g.chains.update.objects);
        g.chains.draw.unshift(draw);
        g.on("keydown", keydown);
      }
      function draw(g, next) {
        // Draw HUD
        next(g);
        g.drawImage(images["game_state/victory"], 0, 0, 1024, 512);
      }
      function keydown(key) {
        if (key === "enter") {
          g.objects.handlePending();
          g.changeLevel(level_sym1());
          g.changeState(gameplayState());
        }
      }
      function update(dt, next) {
        // next(dt)
      }
      function disable() {
        g.chains.update.remove(update);
        g.chains.draw.remove(draw);
        g.removeListener("keydown", keydown);
      }
      return me;
    }

    function deadState() {
      const me = {
        enabled: false,
        enable: enable,
        disable: disable
      };
      var time = 0;
      let body = document.body;
      function enable() {
        body.classList.add("dead");
        g.chains.update.insertBefore(update, g.chains.update.objects);
        g.chains.draw.unshift(draw);
        g.on("keydown", keydown);
      }
      function draw(g, next) {
        // Draw HUD
        next(g);
        g.drawImage(images["game_state/dead"], 400, 300, 1024, 512);
      }
      function keydown(key) {
        if (key === "enter") {
          g.objects.handlePending();
          g.changeLevel(level_sym1());
          g.changeState(gameplayState());
        }
      }
      function update(dt, next) {
        // next(dt)
      }
      function disable() {
        body.classList.remove("dead");
        g.chains.update.remove(update);
        g.chains.draw.remove(draw);
        g.removeListener("keydown", keydown);
      }
      return me;
    }

    function level_sym1() {
      return {
        name: "Level1",
        objects: [
          new Start({
            x: 2,
            y: -1
          }),
          new GreenBlock({
            x: 2,
            y: 0
          })
        ],
        clone: arguments.callee,
        nextLevel: null
      };
    }

    var player;

    g.changeLevel(level_sym1());
    g.changeState(gameplayState());
    game.objects.handlePending();
    g.start();

    window.game = game;
  }
});
