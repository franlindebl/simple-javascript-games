"use strict";

window.addEventListener("load", init, false);

// Assets path
var assetsURI = "assets/";

// Keyboard key codes
var KEY_ENTER = 13;
var KEY_SPACE = 32;
var KEY_LEFT = 37;
var KEY_RIGHT = 39;

// Game variables
var canvas = null;
var ctx = null;
var lastPress = null;
var pressing = [];
var pause = true;
var gameover = true;
var score = 0;
var player = [];
var shots = [];
var enemies = [];
var messages = [];
var spritesheet = new Image();
var background = new Image();
var gameWidth = 0;
var gameHeight = 0;
var playersWidth = gameWidth / 11;
var playersHeight = playersWidth;
var bulletWidth = 10;
var bulletHeight = bulletWidth;

// Images
spritesheet.src = assetsURI + "spritesheet-nbg.png";
background.src = assetsURI + "space-bg.jpg";

//Returns a random number given a maximum value
function random(max) {
  return ~~(Math.random() * max);
}

//Initializes the game
function init() {
  // Get the canvas fromt the hmtl and set width and height
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  gameWidth = canvas.offsetWidth;
  gameHeight = canvas.offsetHeight;
  canvas.width = gameWidth;
  canvas.height = gameHeight;

  //We are going to have 11 columns
  playersWidth = gameWidth / 11;
  playersHeight = playersWidth;

  //Create a new player in the middle column
  player = new Rectangle(
    playersWidth * 5, // X POSITION
    gameHeight - playersHeight - 5, // Y POSITION
    playersWidth, // WIDTH
    playersHeight, // HEIGHT
    3
  ); // HEALTH

  run();
  repaint();
}

// This function executes the function act, every 50 ms
function run() {
  setTimeout(run, 50);
  act();
}

// Repaint the game
function repaint() {
  requestAnimationFrame(repaint);
  paint(ctx);
}

// Resets the game
function reset() {
  //Create a new player in the middle column
  player = new Rectangle(
    playersWidth * 5, // X POSITION
    gameHeight - playersHeight - 5, // Y POSITION
    playersWidth, // WIDTH
    playersHeight, // HEIGHT
    3
  ); // HEALTH

  score = 0;
  player.timer = 0;
  shots.length = 0;
  enemies.length = 0;

  enemies.push(new Rectangle(playersWidth * 0, 0, playersWidth, playersHeight, 0));
  enemies.push(new Rectangle(playersWidth * 1, 0, playersWidth, playersHeight, 0));
  enemies.push(new Rectangle(playersWidth * 2, 0, playersWidth, playersHeight, 0));
  enemies.push(new Rectangle(playersWidth * 3, 0, playersWidth, playersHeight, 0));
  gameover = false;
}

// This function contains the logic of the game
function act() {
  if (!pause) {
    // GameOver Reset
    if (gameover) {
      reset();
    }

    // Move Player right
    if (pressing[KEY_RIGHT]) {
      movePlayerRight();
    }

    // Move player left
    if (pressing[KEY_LEFT]) {
      movePlayerLeft();
    }

    // If player is out screen, we put inside again
    if (player.x > canvas.width - player.width) {
      player.x = canvas.width - player.width;
    }
    if (player.x < 0) {
      player.x = 0;
    }

    // New Shot
    if (lastPress == KEY_SPACE) {
      fire();
    }

    // Move Shots
    var l = shots.length;

    for (var i = 0; i < l; i++) {
      shots[i].y = shots[i].y - 10;
      if (shots[i].y < 0) {
        shots.splice(i--, 1);
        l = l - 1;
      }
    }

    // For all enemies...
    for (var i = 0, l = enemies.length; i < l; i++) {
      if (enemies[i].timer > 0) {
        enemies[i].timer = enemies[i].timer - 1;
      }

      //Move the enemies
      enemies[i].y += 5;
      var rand = random(20) - 10;
      enemies[i].x = enemies[i].x + rand;

      // If Enemy Outside Screen, we move it to the top in a random column
      if (enemies[i].y > canvas.height) {
        enemies[i].x = random(10) * playersWidth;
        enemies[i].y = 0;
      }

      // if player Intersects Enemy we decrease player's life
      if (player.intersects(enemies[i]) && player.timer < 1) {
        player.health = player.health - 1;
        player.timer = 20;
      }

      // If shot Intersects Enemy we decrease its life,
      // delete the shot and increase the points
      // if the enemy have less than 0 lifes, we restart the enemy
      for (var j = 0, ll = shots.length; j < ll; j++) {
        if (shots[j].intersects(enemies[i])) {
          score = score + 1;
          enemies[i].x = random(10) * playersWidth;
          enemies[i].y = 0;
          enemies[i].health = 1;

          // Sometimes we create a new enemy to increase de difficulty
          if (random(2) == 0) {
            enemies.push(new Rectangle(random(10) * playersWidth, 0, playersWidth, playersHeight, 0));
          }

          shots.splice(j--, 1);
          ll = ll - 1;
        }
      }
    }

    // Reduce the time to return the normal state
    if (player.timer > 0) {
      player.timer--;
    }

    // GameOver
    if (player.health < 1) {
      gameover = true;
      pause = true;
    }
  }

  // Pause/Unpause
  if (lastPress == KEY_ENTER) {
    playPause();
  }
}

function paint(ctx) {
  // Drawing the background
  ctx.drawImage(background, 0, 0, gameWidth, gameHeight);

  // Setting variables for the messages
  ctx.textAlign = "center";
  ctx.font = "30px Arial";
  ctx.fillStyle = "#fff";

  // This makes the blinking effect when the player is damaged
  if (player.timer % 2 == 0) {
    player.drawImageArea(ctx, spritesheet, 0, 0, 10, 10);
  }

  // Drawing the enemies
  for (var i = 0, l = enemies.length; i < l; i++) {
    enemies[i].drawImageArea(ctx, spritesheet, 30, 0, 10, 10);
  }

  // Drawing the shots
  for (var i = 0, l = shots.length; i < l; i++) {
    shots[i].drawImageArea(ctx, spritesheet, 70, 5, 5, 5);
  }

  // Messages
  var message = "Score: " + score + " | Health: " + player.health;
  ctx.fillText(message, gameWidth / 2, 50);

  if (pause) {
    if (gameover) {
      ctx.fillText("GAME OVER", gameWidth / 2, gameHeight / 2);
    } else {
      ctx.fillText("PAUSE", gameWidth / 2, gameHeight / 2);
    }
  }
}

// Get the last key pressed
document.addEventListener(
  "keydown",
  function (evt) {
    lastPress = evt.keyCode;
    pressing[evt.keyCode] = true;

    // Block other posible events like scrolling
    if (lastPress == 13 || lastPress == 32 || lastPress == 37 || lastPress == 39) {
      evt.preventDefault();
    }
  },
  false
);

// Stop the movements
document.addEventListener(
  "keyup",
  function (evt) {
    pressing[evt.keyCode] = false;
  },
  false
);

// Class that represents every element (player, enemies, shots... etc)
function Rectangle(x, y, width, height, health) {
  this.x = x == null ? 0 : x;
  this.y = y == null ? 0 : y;
  this.width = width == null ? 0 : width;
  this.height = height == null ? this.width : height;
  this.health = health == null ? 1 : health;
  this.timer = 0;
}

var movePlayerLeft = function () {
  player.x = player.x - playersWidth;
};

var movePlayerRight = function () {
  player.x = player.x + playersWidth;
};

var fire = function () {
  shots.push(new Rectangle(player.x + playersWidth / 2 - bulletWidth / 2, player.y, bulletWidth, bulletHeight));
  lastPress = null;
};

var playPause = function () {
  pause = !pause;
  lastPress = null;
};

// Function that detects colissions
Rectangle.prototype.intersects = function (rect) {
  if (rect != null) {
    return this.x < rect.x + rect.width && this.x + this.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y;
  }
};

//Draw the element with the image
Rectangle.prototype.drawImageArea = function (ctx, img, sx, sy, sw, sh) {
  if (img.width) {
    ctx.drawImage(img, sx, sy, sw, sh, this.x, this.y, this.width, this.height);
  } else {
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
};

// Need to add old browsers support
window.requestAnimationFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 17);
    }
  );
})();
