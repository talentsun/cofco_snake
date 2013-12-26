(function() {


;

function _nextTick(cb) {
	setTimeout(cb, 0);
}

var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	_nextTick;

;

// utils
var _ArrayProto = Array.prototype;
var _ObjProto = Object.prototype;
var _slice = _ArrayProto.slice;
var _nativeIndexOf = _ArrayProto.indexOf;
var _nativeForEach = _ArrayProto.forEach;
var _hasOwnProperty = _ObjProto.hasOwnProperty;
var _nativeKeys = Object.keys;

var _breaker = {};

var u = {};

u.has = function(obj, key) {
	return _hasOwnProperty.call(obj, key);
};

u.keys = _nativeKeys || function(obj) {
	if (obj !== Object(obj)) throw new TypeError('Invalid object');
	var keys = [];
	for (var key in obj)
		if (u.has(obj, key)) keys.push(key);
	return keys;
};

u.indexOf = function(array, item) {
	if (array === null) return -1;
	var i = 0,
		length = array.length;
	if (_nativeIndexOf && array.indexOf === _nativeIndexOf) return array.indexOf(item);
	for (; i < length; i++)
		if (array[i] === item) return i;
	return -1;
};

u.each = function(obj, iterator, context) {
	if (obj === null) return;
	if (_nativeForEach && obj.forEach === _nativeForEach) {
		obj.forEach(iterator, context);
	} else if (obj.length === +obj.length) {
		for (var i = 0, length = obj.length; i < length; i++) {
			if (iterator.call(context, obj[i], i, obj) === _breaker) return;
		}
	} else {
		var _keys = u.keys(obj);
		for (var i = 0, length = _keys.length; i < length; i++) {
			if (iterator.call(context, obj[_keys[i]], _keys[i], obj) === breaker) return;
		}
	}
};

u.extend = function(obj) {
	u.each(_slice.call(arguments, 1), function(source) {
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	});

	return obj;
};

function _only_once(func) {
	var called = false;
	return function() {
		if (called) return;

		called = true;
		func && func.apply(this, arguments);
	}
}

u.eachAsync = function(arr, iterator, callback) {
	callback = callback || function() {};

	if (!arr.length) return setTimeout(callback, 0);

	var completed = 0;
	u.each(arr, function(x) {
		iterator(x, _only_once(function(err) {
			if (err) {
				callback(err);
				callback = function() {};
			} else {
				completed += 1;
				if (completed >= arr.length) {
					callback(null);
				}
			}
		}));
	});
};

u.bind = function(func, context) {
	var args = _slice.call(arguments, 2);
	return function() {
		func.apply(context, args.concat(_slice.call(arguments)));	
	}
};

var console = console || {};
console.log = console.log || function() {};
console.error = console.error || function() {};


;

var server = {

	sync_score: function(params, callback) {
		console.log(params.score);
		$.post('/test/upload_score', params, "json").sucess(function(data) {
			console.log(data);
			if (data.status != 1) {
				callback('error');
			} else {
				callback(null, data.data);
			}
		}).error(function() {
			callback('network error');
		});
	},

	info: function(callback) {
		$.post('/test/info', "json").sucess(function(data) {
			console.log(data);
			if (data.status != 1) {
				callback('error');
			} else {
				callback(null, data.data);
			}
		}).error(function() {
			callback('network error');
		});
	}
};

;

// Timer
function Timer(tick) {
    this.fps = 4;
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
        this.fps < 60 && this.fps++;
    }
};

;

DIRECTION_LEFT = 'left';
DIRECTION_RIGHT = 'right';
DIRECTION_UP = 'up';
DIRECTION_DOWN = 'down';

INVERSE_DIRECTION = {
    up: DIRECTION_DOWN,
    left: DIRECTION_RIGHT,
    right: DIRECTION_LEFT,
    down: DIRECTION_UP
};

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
        this.sections.push({
            x: i,
            y: this.y
        });
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
        for (var i = 0; i < this.sections.length; i++) {
            var section = this.sections[i];
            if (section.x === x && section.y === y) return true;
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

function Game(canvas) {
    var self = this;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.blocks = Game.BLOCKS;
    this.block_size = this.canvas.width / this.blocks;

    this.snake = new Snake(this.blocks, 5);
    this.foods = [];
    this.food = this.getFood();
    this.scoreListener = null;

    this.status = Game.INITIALIZED;
    this.failListener = null;

    this.timer = new Timer(function() {
        self.snake.move();
        if (self.isCollision()) {
            self.timer.pause();
            self.fail();
            return;
        }

        self.snake.directionChanged = false;
        if (self.snake.x == self.food.x && self.snake.y == self.food.y) {
            self.foods.push(self.food);
            self.foods.length % 5 === 0 && self.timer.speedUp();
            self.scoreListener && self.scoreListener();
            self.food = self.getFood();
        } else {
            self.snake.sections.shift();
        }
        self.snake.sections.push({
            x: self.snake.x,
            y: self.snake.y
        });

        requestAnimationFrame(function() {
            self.draw();
        });
    });
}

u.extend(Game, {
    BLOCKS: 20,
    INITIALIZED: 'initialized',
    PLAYING: 'playing',
    PAUSED: 'paused',
    OVER: 'over'
});

Game.prototype = {
    contructor: Game,

    start: function() {
        var self = this;
        if (this.status !== Game.INITIALIZED &&
            this.status !== Game.PAUSED) {
            console.error('wrong status');
            return;
        }

        this.status = Game.PLAYING;
        this.timer.start();
        requestAnimationFrame(function() {
            self.draw();
        });
    },

    pause: function() {
        this.timer.pause();
        this.status = Game.PAUSED;
    },

    fail: function() {
        this.status = Game.OVER;
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
            } else if (i === this.snake.sections.length - 1) {
                this.drawSnakeHead(section);
            } else {
                this.drawSnakeBody(section);
            }
        }
    },

    drawImage: function(section, img) {
        var context = this.context;
        context.drawImage(img, section.x * this.block_size,
            section.y * this.block_size,
            this.block_size, this.block_size);
    },

    drawSnakeBody: function(section) {
        this.drawImage(section, META.snake.body.img);
    },

    drawSnakeTail: function(section) {
        this.drawImage(section, META.snake.tail.img);
    },

    drawSnakeHead: function(section) {
        this.drawImage(section, META.snake.head.img);
    },

    drawFood: function() {
        this.drawImage(this.food, this.food.img);
    },

    drawBox: function(x, y, size, color) {
        var context = this.context;
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
        } while (this.snake.onBody(x, y));

        var food = u.extend({}, food, {
            x: x,
            y: y
        });

        return food;
    }
};

var DIRECTION_KEYCODES = {
    up: [38, 75, 87],
    down: [40, 74, 83],
    left: [37, 65, 72],
    right: [39, 68, 76],
};

function getDirectionByKeyCode(keyCode) {
    for (var key in DIRECTION_KEYCODES) {
        var codelist = DIRECTION_KEYCODES[key];
        if (~u.indexOf(codelist, keyCode)) {
            return key;
        }
    }

    return null;
}

var _Controller = {
    setupKeyBindings: function() {
        var self = this;

        function while_playing(func) {
            return function() {
                if (self.game.status !== Game.PLAYING) return;
                func && func.apply(this, arguments);
            }
        }

        $(document).on("keydown", while_playing(function(e) {
            var direction = getDirectionByKeyCode(e.keyCode);
            direction && self.game.changeSnakeDirection(direction);
        }));

        var hammer = $(document).hammer();

        hammer.on('touchmove', while_playing(function(e) {
            e.preventDefault();
        })).on("swipeup, dragup", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('up');
        })).on("swipedow dragdown", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('down');
        })).on("swipeleft dragleft", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('left');
        })).on("swiperight dragright", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('right');
        }));
    },

    onScoreChanged: function() {
        this.currentScoreEl.innerHTML = this.game.score();
    },

    onGameFailed: function() {
        this.controlButton.innerHTML = '开始';
        this.game = new Game(this.canvas);
        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
    }
};

function Controller() {}

Controller.prototype = {

    onload: function(canvas) {
        var self = this;

        this.canvas = canvas;
        this.game = new Game(this.canvas);
        this.currentScoreEl = document.getElementById('current-score');

        this.controlButton = document.getElementById('control');
        this.controlButton.onclick = function() {
            switch (self.game.status) {
                case Game.INITIALIZED:
                case Game.OVER:
                case Game.PAUSED:
                    self.game.start();
                    this.innerHTML = '暂停';
                    break;
                case Game.PLAYING:
                default:
                    self.game.pause();
                    this.innerHTML = '继续';
            }
        };

        _Controller.setupKeyBindings.call(this);

        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
    }
};

var META = {
    snake: {
        head: {
            src: 'images/Festive-icon.png'
        },
        tail: {
            src: 'images/Snowy-icon.png'
        },
        body: {
            src: 'images/Wreath-icon.png'
        }
    },
    foods: {
        food1: {
            score: 1,
            name: '中粮食品',
            src: 'images/Wreath-icon.png'
        },
    }
};

var Fooder = {
    getFood: function() {
        var keyset = u.keys(META.foods);
        if (keyset.length === 0) return null;

        var index = Math.floor(Math.random() * keyset.length);
        return META.foods[keyset[index]];
    }
};

function loadResources() {
    var promise = {};

    var items = [];
    u.each(u.keys(META.snake), function(key) {
        items.push(META.snake[key]);
    });
    u.each(u.keys(META.foods), function(key) {
        items.push(META.foods[key]);
    });

    var completed = 0;
    u.eachAsync(items, function(item, callback) {
        var img = new Image();

        img.onload = function() {
            item.img = img;
            completed++;
            promise.progress && promise.progress(completed, items.length);
            callback(null);
        };

        img.onerror = function() {
            console.log('fail to load img:', item.src);
            callback('error');
        };
        img.src = item.src;
    }, function(err) {
        if (err) {
            promise.fail && promise.fail(err);
        } else {
            promise.success && promise.success();
        }
    });

    return promise;
}

var controller = new Controller();

$(function() {
    canvas = document.getElementById("snake");
    if (!canvas.getContext) G_vmlCanvasManager.initElement(canvas);

    var promise = loadResources();
    promise.success = u.bind(controller.onload, controller, canvas);

    promise.progress = function(completed, length) {
        console.log('progress:', completed, length);
    };

    promise.fail = function(err) {
        console.error(err);
    };
});

;

})();
