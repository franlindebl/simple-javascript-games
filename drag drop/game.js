(function (window, undefined) {
  "use strict";

  var assetsURI = "assets/";

  var canvas = null,
    ctx = null,
    lastUpdate = 0,
    lastPress = null,
    lastRelease = null,
    pause = true,
    score = 0,
    timer = 0,
    mouse = { x: 0, y: 0 },
    pointer = { x: 0, y: 0 },
    hole = null,
    dragging = null,
    draggables = [],
    spritesheet = new Image(),
    i = 0,
    l = 0;
  spritesheet.src = assetsURI + "draganddrop.png";

  function Circle(x, y, radius) {
    this.x = x === undefined ? 0 : x;
    this.y = y === undefined ? 0 : y;
    this.radius = radius === undefined ? 0 : radius;
  }

  Circle.prototype.distance = function (circle) {
    if (circle !== undefined) {
      var dx = this.x - circle.x,
        dy = this.y - circle.y,
        circleRadius = circle.radius || 0;
      return Math.sqrt(dx * dx + dy * dy) - (this.radius + circleRadius);
    }
  };

  Circle.prototype.stroke = function (ctx) {
    if (ctx !== undefined) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
      ctx.stroke();
    }
  };

  Circle.prototype.drawImageArea = function (ctx, img, sx, sy, sw, sh) {
    if (img.width) {
      ctx.drawImage(img, sx, sy, sw, sh, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    } else {
      this.stroke(ctx);
    }
  };

  function getAbsX(e) {
    var x = 0;
    while (e !== null) {
      x += e.offsetLeft;
      e = e.offsetParent;
    }
    return x;
  }

  function getAbsY(e) {
    var y = 0;
    while (e !== null) {
      y += e.offsetTop;
      e = e.offsetParent;
    }
    return y;
  }

  function enableInputs() {
    document.addEventListener(
      "mousemove",
      function (evt) {
        mouse.x = evt.pageX - getAbsX(canvas);
        mouse.y = evt.pageY - getAbsY(canvas);
      },
      false
    );

    document.addEventListener(
      "mouseup",
      function (evt) {
        lastRelease = evt.which;
      },
      false
    );

    canvas.addEventListener(
      "mousedown",
      function (evt) {
        evt.preventDefault();
        lastPress = evt.which;
      },
      false
    );

    canvas.addEventListener(
      "touchmove",
      function (evt) {
        evt.preventDefault();
        var t = evt.targetTouches;
        mouse.x = t[0].pageX - getAbsX(canvas);
        mouse.y = t[0].pageY - getAbsY(canvas);
      },
      false
    );

    canvas.addEventListener(
      "touchstart",
      function (evt) {
        evt.preventDefault();
        lastPress = 1;
        var t = evt.targetTouches;
        mouse.x = t[0].pageX - getAbsX(canvas);
        mouse.y = t[0].pageY - getAbsY(canvas);
      },
      false
    );

    canvas.addEventListener(
      "touchend",
      function (evt) {
        lastRelease = 1;
      },
      false
    );

    canvas.addEventListener(
      "touchcancel",
      function (evt) {
        lastRelease = 1;
      },
      false
    );
  }

  function random(max) {
    return ~~(Math.random() * max);
  }

  function reset() {
    draggables.length = 0;
    for (i = 0; i < 5; i += 1) {
      draggables.push(new Circle(random(canvas.width), random(canvas.height), 20));
    }
    timer = 15;
    score = 0;
    pause = false;
  }

  function paint(ctx) {
    // Clean canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";

    // Draw hole
    //hole.stroke(ctx);
    hole.drawImageArea(ctx, spritesheet, 40, 0, 40, 40);

    // Draw circles
    ctx.strokeStyle = "#00f";
    for (i = 0, l = draggables.length; i < l; i += 1) {
      //draggables[i].stroke(ctx);
      draggables[i].drawImageArea(ctx, spritesheet, 0, 0, 40, 40);
    }

    // Debug pointer position
    //ctx.fillStyle = '#0f0';
    //ctx.fillRect(pointer.x - 1, pointer.y - 1, 2, 2);

    // HUD
    ctx.fillStyle = "#fff";
    //ctx.fillText('Dragging: ' + dragging, 0, 10);
    ctx.fillText("Score: " + score, 0, 10);
    if (timer > 0) {
      ctx.fillText("Time: " + timer.toFixed(1), 150, 10);
    } else {
      ctx.fillText("Time: 0.0", 150, 10);
    }
    if (pause) {
      ctx.textAlign = "center";
      ctx.fillText("DRAG & DROP", 100, 135);
      if (timer < -1) {
        ctx.fillText("CLICK TO START", 100, 155);
      }
      ctx.fillText("Score: " + score, 100, 175);
      ctx.textAlign = "left";
    }
  }

  function act(deltaTime) {
    // Set pointer to mouse
    pointer.x = mouse.x;
    pointer.y = mouse.y;

    // Limit pointer into canvas
    if (pointer.x < 0) {
      pointer.x = 0;
    }
    if (pointer.x > canvas.width) {
      pointer.x = canvas.width;
    }
    if (pointer.y < 0) {
      pointer.y = 0;
    }
    if (pointer.y > canvas.height) {
      pointer.y = canvas.height;
    }

    // Reset game when time is over
    timer -= deltaTime;
    if (lastPress === 1 && timer < -1) {
      reset();
    }

    if (!pause) {
      for (i = 0, l = draggables.length; i < l; i += 1) {
        // Fall into hole
        if (draggables[i].distance(hole) < 0) {
          draggables[i].x = hole.x;
          draggables[i].y = hole.y;
          draggables[i].radius -= deltaTime * 20;
          // Reset ball somewhere else
          if (draggables[i].radius < 1) {
            draggables[i].x = random(canvas.width);
            draggables[i].y = random(canvas.height);
            draggables[i].radius = 20;
            score += 1;
          }
        } else if (draggables[i].radius > 10) {
          // Fall to ground
          draggables[i].radius -= deltaTime * 20;
        }

        // Check for current dragging circle
        if (lastPress === 1) {
          if (draggables[i].distance(pointer) < 0) {
            dragging = i;
            break;
          }
        }
      }

      // Release current dragging circle
      if (lastRelease === 1) {
        dragging = null;
      }

      // Move current dragging circle
      if (dragging !== null) {
        draggables[dragging].x = pointer.x;
        draggables[dragging].y = pointer.y;
        draggables[dragging].radius = 12;
      }

      // End game
      if (timer <= 0) {
        pause = true;
      }
    }
  }

  function run() {
    window.requestAnimationFrame(run);

    var now = Date.now(),
      deltaTime = (now - lastUpdate) / 1000;
    if (deltaTime > 1) {
      deltaTime = 0;
    }
    lastUpdate = now;

    act(deltaTime);
    paint(ctx);

    lastPress = null;
    lastRelease = null;
  }

  function init() {
    canvas = document.getElementById("canvas");
    canvas.style.background = "#9cc";
    ctx = canvas.getContext("2d");
    canvas.width = 200;
    canvas.height = 300;

    hole = new Circle(canvas.width / 2, canvas.height / 2, 20);

    enableInputs();
    run();
  }

  window.addEventListener("load", init, false);
})(window);
