function nextTick(cb) {
    setTimeout(cb, 0);
}

var requestAnimationFrame = window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame || 
                            nextTick;

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
    for (var key in obj) if (has(obj, key)) keys.push(key);
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
        var _keys = keys(obj);
        for (var i = 0, length = _keys.length; i < length; i++) {
            if (iterator.call(context, obj[_keys[i]], _keys[i], obj) === breaker) return;
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
    extend: extend,
    log: function() {
        if(!console || !console.log) return;
        console.log.apply(console, arguments);
    },
    err: function() {
        if(!console || !console.err) return;
        console.err.apply(console, arguments);
    }
};

})(self);

var u = self.u;

var canvas = document.getElementById("snake");
if (!canvas.getContext) G_vmlCanvasManager.initElement(canvas);

var Fooder = {
    foods: {
        food1: {
            score: 1,
            name: '中粮食品',
            color: '#0FF'
        }
    },

    getFood: function() {
        var keyset = u.keys(Fooder.foods);
        if(keyset.length === 0) return null;

        var index = Math.floor(Math.random() * keyset.length);
        return Fooder.foods[keyset[index]];
    }
};

function Timer(tick) {
    this.fps =  4;
    this.tick = tick;
    this.paused = false;
}

Timer.prototype = {
    constructor: Timer,

    start: function() {
        this.paused = false;
        this.count();
    },

    count: function() {
        var self = this;
        setTimeout(function() {
            if (self.paused) return;

            self.tick();
            self.count();
        }, 1000 / this.fps);
    },

    pause: function() {
        this.paused = true;
    },

    speedUp: function() {
        if(this.fps % 5 === 0 && this.fps < 60) {
            this.fps++;
        }
    }
};

DIRECTION_LEFT = 'left';
DIRECTION_RIGHT = 'right';
DIRECTION_UP = 'up';
DIRECTION_DOWN = 'down';

INVERSE_DIRECTION = {
    up: DIRECTION_DOWN,
    left: DIRECTION_RIGHT,
    right: DIRECTION_LEFT,
    down: DIRECTION_UP
}

function Snake(blocks, length) {
    this.direction = DIRECTION_LEFT;
    this.directionChanged = false;

    this.bodyColor = '#0F0',
    this.headColor = '#08C',
    this.tailColor = '#B20',


    this.blocks = blocks;
    this.x = Math.ceil(this.blocks / 2);
    this.y = Math.ceil(this.blocks / 2);
    this.sections = [];
    for (var i = this.x + length - 1; i >= this.x; i--) {
        this.sections.push({x: i, y: this.y}); 
    }
}

Snake.prototype = {

    changeDirection: function(direction) {
        if (this.directionChanged) return;

        if (direction === INVERSE_DIRECTION[this.direction]) return;

        this.direction = direction;
        this.directionChanged = true;
    },

    bumpSelf: function() {
        return this.onBody(this.x, this.y);
    },

    onBody: function(x, y) {
        for(var i = 0; i < this.sections.length; i++) {
            var section = this.sections[i];
            if(section.x === x && section.y === y) return true;
        }

        return false;
    },

    move: function() {
        switch (this.direction) {
            case DIRECTION_UP:
                this.y--;
                break;
            case DIRECTION_DOWN:
                this.y++; 
                break;
            case DIRECTION_LEFT:
                this.x--;
                break;
            case DIRECTION_RIGHT:
            default:
                this.x++;
        }
    }
};


var BLOCKS = 40;

var GAME_INITIALIZED = 'initialized';
var GAME_PLAYING = 'playing';
var GAME_PAUSED = 'paused';
var GAME_OVER = 'over';

function Game(canvas) {
    var self = this;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.blocks = BLOCKS;
    this.block_size = this.canvas.width / this.blocks;

    this.snake = new Snake(this.blocks, 5);
    this.foods = [];
    this.food = this.getFood();
    this.scoreListener = null;

    this.status = GAME_INITIALIZED;
    this.failListener = null;

    this.timer = new Timer(function() {
        self.snake.move();
        if(self.isCollision()) {
            self.timer.pause();
            self.fail();
            return;
        }

        self.snake.directionChanged = false;
        if (self.snake.x == self.food.x && self.snake.y == self.food.y) {
            self.foods.push(self.food);
            self.food = self.getFood();
            self.scoreListener && self.scoreListener();
        } else {
            self.snake.sections.shift();
        }
        self.snake.sections.push({x: self.snake.x, y: self.snake.y});

        requestAnimationFrame(function() {
            self.draw();
        });

        self.timer.speedUp();
    });
}

Game.prototype = {
    contructor: Game,

    start: function() {
        var self = this;
        if(this.status !== GAME_INITIALIZED &&
           this.status !== GAME_PAUSED) {
            u.err('wrong status');
            return;
        }

        this.status = GAME_PLAYING;
        this.timer.start();
        requestAnimationFrame(function() {
            self.draw();
        });
    },

    pause: function() {
        this.timer.pause();
        this.status = GAME_PAUSED;
    },

    fail: function() {
        this.status = GAME_OVER;
        this.failListener && this.failListener();
        // this.resetCanvas();
    },

    onFailed: function(l) {
        this.failListener = l;
    },

    isCollision: function() {
        if (this.snake.x < 0 || this.snake.x >= this.blocks || 
            this.snake.y < 0 || this.snake.y >= this.blocks) return true;

        return this.snake.bumpSelf();
    },

    resetCanvas: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    score: function() {
        var score = 0;
        u.each(this.foods, function(food) {
            score += food.score;
        });
        return score;
    },

    onScoreChanged: function(l) {
        this.scoreListener = l;
    },

    drawSnake: function() {
        for (var i = 0; i < this.snake.sections.length; i++) {
            var section = this.snake.sections[i];
            if (i === 0) {
                this.drawSnakeTail(section);
            } else if(i === this.snake.sections.length - 1) {
                this.drawSnakeHead(section);
            } else {
                this.drawSnakeBody(section);
            }
        }
    },

    drawSnakeBody: function(section) {
        this.drawBox(section.x * this.block_size, 
                     section.y * this.block_size, 
                     this.block_size, this.snake.bodyColor);

    },

    drawSnakeTail: function(section) {
        this.drawBox(section.x * this.block_size, 
                     section.y * this.block_size, 
                     this.block_size, this.snake.tailColor);

    },

    drawSnakeHead: function(section) {
        this.drawBox(section.x * this.block_size, 
                     section.y * this.block_size, 
                     this.block_size, this.snake.headColor);

    },

    drawFood: function() {
        this.drawBox(this.food.x * this.block_size, 
                     this.food.y * this.block_size, 
                     this.block_size, this.food.color);
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

    draw: function() {
        this.resetCanvas();
        this.drawFood();
        this.drawSnake();
    },

    changeSnakeDirection: function(direction) {
        this.snake.changeDirection(direction);
    },

    getFood: function() {
        var food = Fooder.getFood();
        var x, y;
        do {
            x = Math.floor(Math.random() * this.blocks);
            y = Math.floor(Math.random() * this.blocks);
        } while(this.snake.onBody(x, y));

        var food = u.extend({}, food, {
            x: x,
            y: y
        });

        return food;
    }
};

var direction_keys = {
    up: [38, 75, 87],
    down: [40, 74, 83],
    left: [37, 65, 72],
    right: [39, 68, 76],
};

function getDirectionByKeyCode(value){
    for (var key in direction_keys) {
        var keylist = direction_keys[key];
        if (~u.indexOf(keylist, value)) {
            return key;
        }
    }
    return null;
}

var game = new Game(canvas);
var controlButton = document.getElementById('control');
controlButton.onclick = function() {
    switch(game.status) {
        case GAME_INITIALIZED:
        case GAME_OVER:
        case GAME_PAUSED:
            game.start();
            this.innerHTML = '暂停';
            break;
        case GAME_PLAYING:
        default:
            game.pause();
            this.innerHTML = '继续';
    }
};

var currentScoreEl = document.getElementById('current-score');
function onScoreChanged() {
    currentScoreEl.innerHTML = game.score();
}

function onGameFailed() {
    controlButton.innerHTML = '开始';
    game = new Game(canvas);
    game.onScoreChanged(onScoreChanged);
    game.onFailed(onGameFailed);
}

game.onScoreChanged(onScoreChanged);
game.onFailed(onGameFailed);

function while_playing(func) {
    return function() {
        if(game.status !== GAME_PLAYING) return;
        func && func.apply(this, arguments);
    }
}

$(document).on("keydown", while_playing(function (e) {
    var direction = getDirectionByKeyCode(e.keyCode);
    direction && game.changeSnakeDirection(direction);
}));

var hammer = $(document).hammer();

hammer.on('touchmove', while_playing(function(e) {
    e.preventDefault();
})).on("swipeup, dragup", while_playing(function(e) {
    e.preventDefault();
    game.changeSnakeDirection('up');
})).on("swipedow dragdown", while_playing(function(e) {
    e.preventDefault();
    game.changeSnakeDirection('down');
})).on("swipeleft dragleft", while_playing(function(e) {
    e.preventDefault();
    game.changeSnakeDirection('left');
})).on("swiperight dragright", while_playing(function(e) {
    e.preventDefault();
    game.changeSnakeDirection('right');
}));

