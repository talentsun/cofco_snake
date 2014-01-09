(function() {


;

function _nextTick(cb) {
	if (cb) {
		cb();
	}
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
		for (var index = 0; index < _keys.length; index++) {
			if (iterator.call(context, obj[_keys[index]], _keys[index], obj) === breaker) return;
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
		if (func) func.apply(this, arguments);
	};
}

u.bind = function(func, context) {
	var args = _slice.call(arguments, 2);
	return function() {
		func.apply(context, args.concat(_slice.call(arguments)));
	};
};


u.delay = function(millies, func) {
	return function() {
		var args = arguments;
		setTimeout(function() {
			if (func) func.apply(this, args);
		}, millies);
	};
};

u.timeup = function(millies, func, onTimeup) {
	var STATUS_DOING = 'doing';
	var STATUS_DONE = 'done';
	var STATUS_TIMEOUT = 'timeout';
	var status = STATUS_DOING;

	setTimeout(function() {
		console.log("u.timeup onTimeup, status: ", status);
		if (status !== STATUS_DOING) {
			return;
		}

		status = STATUS_TIMEOUT;
		if (onTimeup) {
			onTimeup();
		}
	}, millies);

	return function() {
		console.log("u.timeup callback, status: ", status);
		if (status !== STATUS_DOING) {
			return;
		}

		status = STATUS_DONE;
		if (func) {
			func.apply(this, arguments);
		}
	}
};

console = window.console || {};
console.log = console.log || function() {};
console.error = console.error || function() {};


;

var cookie = function() {
	return cookie.get.apply(cookie, arguments);
};

cookie.utils = {

	// Is the given value an array? Use ES5 Array.isArray if it's available.
	isArray: Array.isArray || function(value) {
		return Object.prototype.toString.call(value) === '[object Array]';
	},

	// Is the given value a plain object / an object whose constructor is `Object`?
	isPlainObject: function(value) {
		return !!value && Object.prototype.toString.call(value) === '[object Object]';
	},

	// Convert an array-like object to an array – for example `arguments`.
	toArray: function(value) {
		return Array.prototype.slice.call(value);
	},

	// Get the keys of an object. Use ES5 Object.keys if it's available.
	getKeys: Object.keys || function(obj) {
		var keys = [],
			key = '';
		for (key in obj) {
			if (obj.hasOwnProperty(key)) keys.push(key);
		}
		return keys;
	},

	// Unlike JavaScript's built-in escape functions, this method
	// only escapes characters that are not allowed in cookies.
	escape: function(value) {
		return String(value).replace(/[,;"\\=\s%]/g, function(character) {
			return encodeURIComponent(character);
		});
	},

	// Return fallback if the value is not defined, otherwise return value.
	retrieve: function(value, fallback) {
		return value == null ? fallback : value;
	}

};

cookie.defaults = {};

cookie.expiresMultiplier = 60 * 60 * 24;

cookie.set = function(key, value, options) {

	if (cookie.utils.isPlainObject(key)) { // Then `key` contains an object with keys and values for cookies, `value` contains the options object.


		for (var k in key) { // TODO: `k` really sucks as a variable name, but I didn't come up with a better one yet.
			if (key.hasOwnProperty(k)) this.set(k, key[k], value);
		}

	} else {

		options = cookie.utils.isPlainObject(options) ? options : {
			expires: options
		};

		var expires = options.expires !== undefined ? options.expires : (this.defaults.expires || ''), // Empty string for session cookies.
			expiresType = typeof(expires);

		if (expiresType === 'string' && expires !== '') expires = new Date(expires);
		else if (expiresType === 'number') expires = new Date(+new Date + 1000 * this.expiresMultiplier * expires); // This is needed because IE does not support the `max-age` cookie attribute.

		if (expires !== '' && 'toGMTString' in expires) expires = ';expires=' + expires.toGMTString();

		var path = options.path || this.defaults.path; // TODO: Too much code for a simple feature.
		path = path ? ';path=' + path : '';

		var domain = options.domain || this.defaults.domain;
		domain = domain ? ';domain=' + domain : '';

		var secure = options.secure || this.defaults.secure ? ';secure' : '';

		document.cookie = cookie.utils.escape(key) + '=' + cookie.utils.escape(value) + expires + path + domain + secure;

	}

	return this; // Return the `cookie` object to make chaining possible.

};

// TODO: This is commented out, because I didn't come up with a better method name yet. Any ideas?
// cookie.setIfItDoesNotExist = function (key, value, options) {
//	if (this.get(key) === undefined) this.set.call(this, arguments);
// },

cookie.remove = function(keys) {

	keys = cookie.utils.isArray(keys) ? keys : cookie.utils.toArray(arguments);

	for (var i = 0, l = keys.length; i < l; i++) {
		this.set(keys[i], '', -1);
	}

	return this; // Return the `cookie` object to make chaining possible.
};

cookie.empty = function() {

	return this.remove(cookie.utils.getKeys(this.all()));

};

cookie.get = function(keys, fallback) {

	fallback = fallback || undefined;
	var cookies = this.all();

	if (cookie.utils.isArray(keys)) {

		var result = {};

		for (var i = 0, l = keys.length; i < l; i++) {
			var value = keys[i];
			result[value] = cookie.utils.retrieve(cookies[value], fallback);
		}

		return result;

	} else return cookie.utils.retrieve(cookies[keys], fallback);

};

cookie.all = function() {

	if (document.cookie === '') return {};

	var cookies = document.cookie.split('; '),
		result = {};

	for (var i = 0, l = cookies.length; i < l; i++) {
		var item = cookies[i].split('=');
		result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
	}

	return result;

};

cookie.enabled = function() {

	if (navigator.cookieEnabled) return true;

	var ret = cookie.set('_', '_').get('_') === '_';
	cookie.remove('_');
	return ret;
};


;

// api

var api = {
	NETWORK_ERROR: 'network error',
	STATUS_ERROR: 'status error',
	_handle: function(callback) {
		return function(data) {
			if (data.status != 1) {
				return callback(api.STATUS_ERROR);
			}

			callback(null, data.data);
		};
	},

	_onerror: function(callback) {
		return function() {
			callback(api.NETWORK_ERROR);
		};
	},

	addScore: function(params, callback) {
		$.get('/game/api/addScore', params, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getTotalScore: function(member_id, callback) {
		$.get('/game/api/getTotalScore', {
			member_id: member_id
		}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getUserinfo: function(callback) {
		$.get('/game/api/getMemberInfo', {}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getRank: function(member_id, callback) {
		$.get('/game/api/getScoreRank', {
			member_id: member_id
		}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getInfoInNeed: function(callback) {
		function _getUserInfo(callback) {
			api.getUserinfo(function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			});
		}

		function _getRank(user, callback) {
			api.getRank(user.member_id, function(err, rank) {
				if (!err) {
					u.extend(user, rank);
				}
				callback(null, user);
			});
		}

		async.waterfall([_getUserInfo, _getRank],
			//u.delay(5 * 1000,
			function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			}
			//)
		);
	},

	sync_score: function(member_id, score, callback) {
		function _addScore(callback) {
			api.addScore({
				member_id: member_id,
				score: score
			}, function(err, data) {
				if (err) {
					return callback(err);
				}

				callback(null, data.winPrize);
			});
		}

		function _getUserInfo(winPrize, callback) {
			api.getUserinfo(function(err, user) {
				if (err) {
					return callback(err);
				}

				user.winPrize = winPrize;
				callback(null, user);
			});
		}

		function _getRank(user, callback) {
			api.getRank(member_id, function(err, rank) {
				if (!err) {
					u.extend(user, rank);
				}
				callback(null, user);
			});
		}

		async.waterfall([_addScore, _getUserInfo, _getRank],
			//u.delay(5 * 1000,
			function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			}
			//)
		);
	}
};

;

// Timer
var _Timer = {
	INIT_FPS: 4
};

function Timer(tick) {
	this.fps = _Timer.INIT_FPS;
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
		if (this.fps < 60) this.fps++;
	}
};

;

var loader = {
	foodImage: null,
	foodSprites: null,
	snakeImage: null,
	snakeSprites: null,
	canvasImage: null,
	canvasSprites: null,
	user: null,

	loadGameSpriteImages: function(callback) {
		var images = ["images/snake.png", "images/foods.png", "images/canvas.png"];
		async.each(images, function(item, cb) {
			var image = new Image();
			image.onload = function() {
				switch (item) {
					case "images/snake.png":
						loader.snakeImage = image;
						break;
					case "images/foods.png":
						loader.foodImage = image;
						break;
					case "images/canvas.png":
						loader.canvasImage = image;
						break;
				}
				cb(null);
			};

			image.onerror = function() {
				cb("fail to load sprite image " + item);
			};

			image.src = item;
		}, function(err, results) {
			if (err) {
				return callback(err);
			}

			callback(null, results);
		});
	},

	loadGameSpriteMeta: function(callback) {
		async.each(["json/snake.json", "json/foods.json", "json/canvas.json"], function(item, cb) {
			$.get(item, "json").success(function(sprites) {
				switch (item) {
					case "json/snake.json":
						loader.snakeSprites = sprites;
						break;
					case "json/foods.json":
						loader.foodSprites = sprites;
						break;
					case "json/canvas.json":
						loader.canvasSprites = sprites;
						break;
				}
				cb(null, sprites);
			}).error(function() {
				cb('fail to load sprites: ' + item);
			});
		}, function(err, results) {
			if (err) {
				return callback(err);
			}

			callback(null, results);
		});
	},

	getInfoInNeed: function(callback) {
		api.getInfoInNeed(function(err, _user) {
			if (!err) {
				loader.user = _user;
			}

			callback(null);
		});
	},

	loadResImages: function(callback) {
		var image = new Image();
		image.onload = function() {
			callback(null, image);
		};

		image.onerror = function() {
			callback('fail to load image:' + src);
		};

		image.src = "images/resources.png";
	}
};

;

// game

DIRECTION_LEFT = 'left';
DIRECTION_RIGHT = 'right';
DIRECTION_UP = 'up';
DIRECTION_DOWN = 'down';

var META = {
	foods: {
		food1: {
			key: "food1",
			name: 'food1'
		},
		food2: {
			key: "food2",
			name: 'food2'
		},
		food3: {
			key: "food3",
			name: 'food3'
		},
		food4: {
			key: "food4",
			name: 'food4'
		},
		food5: {
			key: "food5",
			name: 'food5'
		},
		food6: {
			key: "food6",
			name: 'food6'
		},
		food7: {
			key: "food7",
			name: 'food7'
		},
		food8: {
			key: "food8",
			name: 'food8'
		},
		food9: {
			key: "food9",
			name: 'food9'
		},
		food10: {
			key: "food10",
			name: 'food10'
		},
		food11: {
			key: "food11",
			name: 'food11'
		},
		food12: {
			key: "food12",
			name: 'food12'
		},
		food13: {
			key: "food13",
			name: 'food13'
		},
		food14: {
			key: "food14",
			name: 'food14'
		}
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


INVERSE_DIRECTION = {
	up: DIRECTION_DOWN,
	left: DIRECTION_RIGHT,
	right: DIRECTION_LEFT,
	down: DIRECTION_UP
};

function Snake(blocks, length) {
	this.blocks = blocks;

	this.direction = DIRECTION_LEFT;
	this.directionChanged = false;

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

	section: function(i) {
		var index = (this.sections.length + i) % this.sections.length;
		return this.sections[index];
	},

	length: function() {
		return this.sections.length;
	},

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
		for (var i = 1; i < this.sections.length; i++) {
			var section = this.sections[i];
			if (section.x === x && section.y === y) return true;
		}

		return false;
	},

	directionOfSection: function(i) {
		var len = this.sections.length;
		var index = (len + i) % len;
		var prev, section;
		if (index == len - 1) {
			prev = this.section(index);
			section = this.section(index - 1);
		} else {
			section = this.section(index);
			prev = this.section(index + 1);
		}

		var direction;
		if (prev.x === section.x) {
			if (prev.y === section.y - 1) {
				direction = DIRECTION_UP;
			} else {
				direction = DIRECTION_DOWN;
			}
		} else {
			if (prev.x === section.x - 1) {
				direction = DIRECTION_LEFT;
			} else {
				direction = DIRECTION_RIGHT;
			}
		}
		return direction;
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
				//case DIRECTION_RIGHT:
			default:
				this.x++;
		}
	},
};

var _Game = {
	DEFAULT_SCORE: 10,
	triggerScoreChanged: function() {
		if (this.scoreListener) {
			this.scoreListener();
		}
	}
};

function Game(canvas) {
	if (!canvas) return;

	var self = this;
	this.canvas = canvas;
	this.context = this.canvas.getContext('2d');
	this.blocks = Game.BLOCKS;
	this.block_size = this.canvas.width / this.blocks;
	console.log("blocks: " + this.blocks);
	console.log("canvas.width: " + this.canvas.width);
	console.log("block_size: " + this.block_size);


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
			if (self.foods.length % 5 === 0) self.timer.speedUp();

			_Game.triggerScoreChanged.call(self);
			self.snake.sections.push({
				x: self.snake.x,
				y: self.snake.y
			});

			var food = self.getFood();
			if (!food) return self.fail();
			self.food = food;
		} else {
			self.snake.sections.shift();
			self.snake.sections.push({
				x: self.snake.x,
				y: self.snake.y
			});
		}

		self.triggerMoved();
		/*
		requestAnimationFrame(function() {
			self.draw();
		});
		*/
	});
}

u.extend(Game, {
	BLOCKS: 10,
	INITIALIZED: 'initialized',
	PLAYING: 'playing',
	PAUSED: 'paused',
	OVER: 'over'
});

Game.prototype = {
	contructor: Game,

	isInitialized: function() {
		return this.status === Game.INITIALIZED;
	},

	isOver: function() {
		return this.status === Game.OVER;
	},

	over: function() {
		this.status = Game.OVER;
	},

	start: function() {
		var self = this;
		if (this.status !== Game.INITIALIZED &&
			this.status !== Game.PAUSED) {
			console.error('wrong status');
			return;
		}

		this.status = Game.PLAYING;
		this.timer.start();
	},

	pause: function() {
		this.timer.pause();
		this.status = Game.PAUSED;
	},

	fail: function() {
		this.status = Game.OVER;
		if (this.failListener) {
			this.failListener();
		}
	},

	onFailed: function(l) {
		this.failListener = l;
	},

	onMoved: function(handler) {
		this.moveHanlder = handler;
	},

	triggerMoved: function() {
		if (this.moveHanlder) {
			this.moveHanlder();
		}
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

	getRect: function(section) {
		return {
			x: section.x * this.block_size,
			y: section.y * this.block_size,
			width: this.block_size,
			height: this.block_size
		};
	},

	changeSnakeDirection: function(direction) {
		this.snake.changeDirection(direction);
	},

	getFood: function() {
		if (this.snake.sections.length === this.blocks * this.blocks) return null;

		var _food = Fooder.getFood();
		var pos = this.getNewFoodPosition();
		return u.extend({}, _food, pos, {
			score: _food.score || _Game.DEFAULT_SCORE
		});
	},

	getNewFoodPosition: function() {
		var pos = {};
		do {
			pos.x = Math.floor(Math.random() * this.blocks);
			pos.y = Math.floor(Math.random() * this.blocks);
		} while (this.snake.onBody(pos.x, pos.y));

		return pos;
	}
};

;

// render 
function Render(canvas) {
	this.canvas = canvas;
	this.context = this.canvas.getContext('2d');
	this.layers = [];
}

Render.prototype = {
	constructor: Render,

	addLayer: function(layer) {
		this.layers.push(layer);
	},

	removeLayer: function(layer) {
		if (~u.indexOf(this.layers, layer)) {
			this.layers.remove(layer);
		}
	},

	draw: function() {
		var self = this;
		requestAnimationFrame(function() {
			self.resetCanvas();
			for (var i = 0; i < self.layers.length; i++) {
				self.layers[i].draw(self);
			}
		});
	},

	resetCanvas: function() {
		var canvas = this.canvas;
		var ctx = this.context;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	},

	drawImage: function(image, sprite, rect) {
		var ctx = this.context;
		ctx.drawImage(image, sprite.x, sprite.y, sprite.width, sprite.height,
			rect.x, rect.y, rect.width, rect.height);
	}
};

function GameLayer() {
	this.game = null;
}

GameLayer.prototype = {
	constructor: GameLayer,

	setGame: function(game) {
		this.game = game;
	},

	draw: function(render) {
		var game = this.game;
		if (!game) {
			return;
		}

		var snake = game.snake;

		// snake head
		var head = snake.section(-1);
		var direction = snake.directionOfSection(-1);
		var sprite = loader.snakeSprites["animal_head_" + direction];
		render.drawImage(loader.snakeImage, sprite, game.getRect(head));

		// snake body
		sprite = loader.snakeSprites["animal_body_nian"];
		for (var i = 1; i < snake.length() - 1; i++) {
			var section = snake.section(i);
			render.drawImage(loader.snakeImage, sprite, game.getRect(section));
		}

		//
		var tail = snake.section(0);
		direction = snake.directionOfSection(0);
		sprite = loader.snakeSprites["animal_tail_" + direction];
		render.drawImage(loader.snakeImage, sprite, game.getRect(tail));

		// food	
		var food = game.food;
		sprite = loader.foodSprites[food.key];
		render.drawImage(loader.foodImage, sprite, game.getRect(food));
	},
};


;

function BackgroundLayer() {
	this.bg = null;
	this.sprite = null;
}

BackgroundLayer.prototype = {
	constructor: BackgroundLayer,

	draw: function(render) {
		var bg = this.bg;
		var sprite = this.sprite;
		if (!bg || !sprite) {
			return;
		}

		var rect = {
			x: 0,
			y: 0,
			width: render.canvas.width,
			height: render.canvas.height
		};
		render.drawImage(bg, sprite, rect);
	}
};

_Controller = {
	setupKeyBindings: function() {
		var self = this;

		function while_playing(func) {
			return function() {
				if (self.game.status !== Game.PLAYING) {
					return;
				}

				if (func) {
					func.apply(this, arguments);
				}
			};
		}

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
		this.$currentScore.html(this.game.score());
	},

	onUploadScoreFailed: function() {
		console.error('failed to upload score');
		/*
		var self = this;
		this.errorPane.show();
		setTimeout(function() {
			self.errorPane.hide();
			self.$overlay.hide();
		}, 2 * 1000);
		*/
	},

	onScoreUploaded: function(user) {
		this.user = user;
		this.$totalScore.html(user.score);
		_Controller.showInfo.call(this);
		/*
		this.showTotalScore(user.score);
		if (user.gift) {
			this.gameoverPane.showGift();
		} else {
			this.gameoverPane.hideGift();
		}
		this.gameoverPane.setScore(this.game.score());
		this.gameoverPane.show();
		*/
	},

	onUploadScoreTimeout: function() {
		_Controller.onUploadScoreFailed.call(this);
	},

	onGameFailed: function() {
		var self = this;
		this.$control.removeClass("pause");
		this.game.over();

		function _hide(func) {
			return function() {
				//self.loadingPane.hide();
				if (func) {
					func.apply(null, arguments);
				}
			}
		}

		api.sync_score(this.user.member_id, this.game.score(),
			//u.delay(5 * 1000,
			u.timeup(10 * 1000,
				_hide(function(err, data) {
					if (err) {
						_Controller.onUploadScoreFailed.call(self);
					} else {
						_Controller.onScoreUploaded.call(self, data);
					}
				}), _hide(u.bind(_Controller.onUploadScoreTimeout, this))
			)
			//)
		);
	},

	loading: function() {
		var ctx = this.context;
	},

	newGame: function() {
		this.game = new Game(this.canvas);
		this.game.onMoved(u.bind(this.render.draw, this.render));
		this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
		this.game.onFailed(u.bind(_Controller.onGameFailed, this));
	},

	kickOff: function() {
		this.$currentScore.html(0);
		this.rounds++;
	},

	//start or resume
	resume: function() {
		this.game.start();
		this.$control.addClass('pause');
	},

	pause: function() {
		this.game.pause();
		this.$control.removeClass('pause');
	},

	startGame: function() {
		_Controller.newGame.call(this);
		_Controller.kickOff.call(this);
		_Controller.resume.call(this);
		window.scrollTo(0, 0);
		this.el.scrollIntoView(true);
		this.gameLayer.setGame(this.game);
		this.render.draw();
	},

	initRender: function() {
		this.render = new Render(this.canvas);
		this.gameLayer = new GameLayer();
		this.bgLayer = new BackgroundLayer();
		this.render.addLayer(this.bgLayer);
		this.render.addLayer(this.gameLayer);
	},

	showInfo: function() {
		this.$currentScore.html("0");
		this.$totalScore.html(this.user.score);
	}
};

function Controller(el) {
	var self = this;
	this.el = el;
	this.$el = $(el);
	this.$canvas = this.$el.find('canvas');
	this.canvas = this.$canvas[0];
	_Controller.initRender.call(this);



	this.user = null;
	this.rounds = 0;
}

u.extend(Controller.prototype, {
	onload: function(user) {
		var self = this;
		this.user = user;

		this.bgLayer.bg = loader.canvasImage;
		this.bgLayer.sprite = loader.canvasSprites["canvas_bg"];
		this.render.draw();

		if (!user) {
			this.$control.click(function() {
				// TODO
			});
			return;
		}

		this.$controlbar = this.$el.find(".header");
		function _ensureCanvasSize() {
			var size = Math.min(window.innerWidth, window.innerHeight);
			var controlbar_height = self.$controlbar.outerHeight();
			size -= controlbar_height;
			self.$canvas.css('width', size + "px");
			self.$canvas.css('height', size + "px");
			self.render.draw();
		}
		window.onresize = _ensureCanvasSize;
		_ensureCanvasSize();

		this.$currentScore = this.$el.find(".current.score");
		this.$totalScore = this.$el.find(".total.score");
		_Controller.showInfo.call(this);

		this.$control = this.$el.find(".control");
		this.$control.click(function() {
			if (!self.game) {
				return _Controller.startGame.call(self);
			}

			switch (self.game.status) {
				case Game.OVER:
					_Controller.startGame.call(self);
					break;
				case Game.PAUSED:
					_Controller.resume.call(self);
					break;
				case Game.PLAYING:
					_Controller.pause.call(self);
					break;
				default:
					console.error('invlaid status', self.game.status);
			}
		});
		_Controller.setupKeyBindings.call(this);
	}
});

$(function() {
	var controller = new Controller($(".snake-container-wrap")[0]);

	async.parallel([
		loader.loadGameSpriteMeta,
		loader.loadGameSpriteImages,
		loader.getInfoInNeed
	], function(err) {
		if (err) {
			return console.error(err);
		}

		controller.onload(loader.user);
	});
});

;

})();
