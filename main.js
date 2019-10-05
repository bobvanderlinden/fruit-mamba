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
      "snake/head",
      "snake/grape",
      "snake/orange",
      "snake/strawberry",
      "snake/blueberry",
      "snake/banana"
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
      game.camera.zoom = 4;
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
        var targety = (game.height * 0.5) / ptm;

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

    // Player
    class Segment {
      constructor({ child, x, y, tile }) {
        this.child = child;
        this.position = new Vector(x, y);
        this.tile = tile;
      }

      setPosition(x, y) {
        const { x: oldx, y: oldy } = this.position;
        setCell(this.position.x, this.position.y, undefined);
        this.position.set(x, y);
        setCell(this.position.x, this.position.y, this);

        if (this.child) {
          this.child.setPosition(oldx, oldy);
        }
      }

      drawTile(g) {
        g.save();
        g.context.translate(this.position.x, this.position.y);
        g.context.scale(1 / game.camera.PTM, 1 / game.camera.PTM);
        g.drawCenteredImage(this.tile, 0, 0);
        g.restore();
      }
    }
    Segment.prototype.foreground = true;

    class Player extends Segment {
      constructor({ x, y, tile, child }) {
        super(...arguments);
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.tile = tile;
        this.child = child;
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
    }
    Player.prototype.foreground = true;

    player = new Player({ x: 0, y: 0, tile: images["snake/head"] });
    g.objects.add(player);

    let child = undefined;
    const segmentImages = [
      images["snake/grape"],
      images["snake/orange"],
      images["snake/strawberry"],
      images["snake/blueberry"],
      images["snake/banana"]
    ];
    for (let i = 0; i < 5; i++) {
      const segment = new Segment({
        child,
        x: 5 - i,
        y: 0,
        tile: segmentImages[i % segmentImages.length]
      });
      g.objects.add(segment);
      child = segment;
    }
    player.child = child;

    let grid = {};
    function getCell(x, y) {
      return grid[`${x}x${y}`];
    }
    function setCell(x, y, value) {
      if (!value) {
        delete grid[`${x}x${y}`];
      } else {
        grid[`${x}x${y}`] = value;
      }
    }

    //#states
    function gameplayState() {
      var me = {
        enabled: false,
        enable: enable,
        disable: disable
      };
      function enable() {
        game.camera.reset();
        game.camera.smoothx += 300;
        g.chains.update.push(update);
        g.chains.draw.unshift(draw);
        g.on("keydown", keydown);
      }

      function disable() {
        g.chains.update.remove(update);
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

        const x = player.position.x + movement.x;
        const y = player.position.y + movement.y;

        if (getCell(x, y)) {
          return;
        }

        player.setPosition(x, y);
        player.velocity.setV(movement);
      }

      function mousedown() {}

      function update(dt, next) {
        next(dt);
      }

      function draw(g, next) {
        // Draw HUD
        next(g);
      }

      return me;
    }

    var player;

    g.changeState(gameplayState());
    game.objects.handlePending();
    g.start();

    window.game = game;
  }
});
