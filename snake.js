var self = this;

(function(global) {
//utils
var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;
var slice = ArrayProto.slice;
var nativeIndexOf = ArrayProto.indexOf;
var nativeForEach = ArrayProto.forEach;
var hasOwnProperty = ObjProto.hasOwnProperty;
var nativeKeys = Object.keys;
var breaker = {};
    
function has(obj, key) {
    return hasOwnProperty.call(obj, key);
}

var keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
};

function indexOf(array, item) {
    if (array === null) return -1;
    var i = 0, length = array.length;
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
}

function each(obj, iterator, context) {
    if (obj === null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, length = obj.length; i < length; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
    } else {
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
        }
    }
}

function extend(obj) {
    each(slice.call(arguments, 1), function(source) {
        if (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
}

global.u = {
    indexOf: indexOf,
    each: each,
    has: has,
    keys: keys,
    extend: extend
};

})(self);

var u = self.u;

var canvas = document.getElementById("the-game");
var context = canvas.getContext("2d");

var food;
var foodListeners = [];

function onFoodChange(callback) {
    if(~u.indexOf(foodListener, callback)) {
        foodListeners.push(callback);
    }
}

function triggerFoodChange() {
    u.each(foodListeners, function(l) {
        l && l();
    });
}

function setFood() {
    food = fooder.getFood();
    triigerFoodChange();
}

var BLOCKS = 40;

var game, snake;

game = {
  blocks: BLOCKS,
  block_size: canvas.width / BLOCKS, 
  score: 0,
  fps: 8,
  over: true,
  message: null,
  
  start: function() {
    game.over = false;
    game.message = null;
    game.score = 0;
    game.fps = 8;
    snake.init();
    setFood();
    requestAnimationFrame(loop);
  },
  
  stop: function() {
    game.over = true;
    game.message = 'GAME OVER - PRESS SPACEBAR';
  },
  
  drawBox: function(x, y, size, color) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + size, y);
    context.lineTo(x + size, y + size);
    context.lineTo(x, y + size);
    context.closePath();
    context.fill();
  },
  
  drawScore: function() {
    context.fillStyle = '#999';
    context.font = (canvas.height) + 'px Impact, sans-serif';
    context.textAlign = 'center';
    context.fillText(game.score, canvas.width / 2, canvas.height * 0.9);
  },
  
  drawMessage: function() {
    if (game.message !== null) {
      context.fillStyle = '#00F';
      context.strokeStyle = '#FFF';
      context.font = (canvas.height / 10) + 'px Impact';
      context.textAlign = 'center';
      context.fillText(game.message, canvas.width / 2, canvas.height / 2);
      context.strokeText(game.message, canvas.width / 2, canvas.height / 2);
    }
  },
  
  resetCanvas: function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
};


snake = {
  INIT_LENGTH: 5,
  x: null,
  y: null,
  color: '#0F0',
  direction: 'left',
  sections: [],
  
  init: function() {
    snake.sections = [];
    snake.direction = 'left';
    snake.x = Math.ceil(game.blocks / 2);
    snake.y = Math.ceil(game.blocks / 2);
    for (var i = snake.x + snake.INIT_LENGTH - 1; i >= snake.x; i--) {
        snake.sections.push({x: i, y: snake.y}); 
    }
  },
  
  move: function() {
    switch (snake.direction) {
      case 'up':
        snake.y--;
        break;
      case 'down':
        snake.y++; 
        break;
      case 'left':
        snake.x--;
        break;
      case 'right':
        snake.x++;
        break;
    }
    snake.checkCollision();
    snake.checkGrowth();
    snake.sections.push({x: snake.x, y:snake.y});
  },

  onBody: function(x, y) {
    for(var i = 0; i < snake.sections.length; i++) {
        var section = snake.sections[i];
        if(section.x === x && section.y ===y) return true;
    }
    return false;
  },
  
  draw: function() {
    for (var i = 0; i < snake.sections.length; i++) {
        var section = snake.sections[i];
        snake.drawSection(section.x, section.y);
    }
  },
  
  drawSection: function(x, y) {
      game.drawBox(x * game.block_size, y * game.block_size, 
                    game.block_size, snake.color);
  },
  
  checkCollision: function() {
    if (snake.isCollision(snake.x, snake.y)) {
        game.stop();
    }
  },
  
  isCollision: function(x, y) {
    if (x < 0 || x > game.blocks || 
        y < 0 || y > game.blocks) return true;

    return this.onBody(x, y);
  },
  
  checkGrowth: function() {
    if (snake.x == food.x && snake.y == food.y) {
        game.score++;
        if (game.score % 5 === 0 && game.fps < 60) {
            game.fps++;
        }
        setFood();
    } else {
        snake.sections.shift();
    }
  }
};

function Fooder() {
    this.foods = {
        default: {
            score: 1,
            name: '中粮食品',
            color: '#0FF'
        }
    };
}

Fooder.prototype = {
    constructor: Fooder,

    getFood: function() {
        var keyset = u.keys(this.foods);
        if(keyset.length === 0) return null;

        var index = Math.floor(Math.random() * keyset.length);
        var food = this.foods[keyset[index]];

        var x, y;
        do {
            x = Math.floor(Math.random() * game.blocks);
            y = Math.floor(Math.random() * game.blocks);
        } while(snake.onBody(x, y));

        var food = u.extend({}, food, {
            x: x,
            y: y
        });

        console.log(food);
        return food;
    }
};

var fooder = new Fooder();

function FoodBlock() {
    var that = this;

    onFoodChange(function() {
        that.draw();
    });
}

FoodBlock.prototype = {
    constructor: FoodBlock,

    onFoodChange: function() {
        this.draw();    
    },

    draw: function() {
        game.drawBox(food.x, food.y, game.block_size, food.color);
    }
};

var foodBlock = new FoodBlock();

var inverseDirection = {
  'up': 'down',
  'left': 'right',
  'right': 'left',
  'down': 'up'
};

var keys = {
  up: [38, 75, 87],
  down: [40, 74, 83],
  left: [37, 65, 72],
  right: [39, 68, 76],
  start_game: [13, 32]
};

function getKey(value){
    for (var key in keys) {
        if (keys[key] instanceof Array && 
            ~u.indexOf(keys[key], value)) {
            return key;
        }
    }
    return null;
}


// TODO 添加对手势识别的支持
addEventListener("keydown", function (e) {
    if (game.over) return;

    var lastKey = getKey(e.keyCode);
    if (~u.indexOf(['up', 'down', 'left', 'right'], lastKey) && 
        lastKey != inverseDirection[snake.direction]) {
        snake.direction = lastKey;
    }
}, false);

addEventListener("keyup", function(e) {
    if (!game.over) return;
    if (getKey(e.keyCode) === 'start_game') game.start();
}, false);

var requestAnimationFrame = window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame;

function loop() {
    game.resetCanvas();
    game.drawScore();
    snake.move();
    foodBlock.draw();
    snake.draw();
    game.drawMessage();
    if (!game.over) {
        setTimeout(function() {
            requestAnimationFrame(loop);
        }, 1000 / game.fps);
    }
}

