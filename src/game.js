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
		for (var i = 0; i < this.sections.length; i++) {
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

		requestAnimationFrame(function() {
			self.draw();
		});
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
		if (this.failListener) this.failListener();
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
		this.drawSnakeHead();
		this.drawSnakeBody();
		this.drawSnakeTail();
	},

	drawImage: function(image, sprite, rect) {
		console.log("sprite: " + sprite.x + " " + sprite.y + " " + sprite.width + " " + sprite.height);
		console.log("rect: " + rect.x + " " + rect.y + " " + rect.width + " " + rect.height);
		var ctx = this.context;
		ctx.drawImage(image, sprite.x, sprite.y, sprite.width, sprite.height,
			rect.x, rect.y, rect.width, rect.height);
	},

	drawSnakeBody: function() {
		for (var i = 1; i < this.snake.length() - 1; i++) {
			var section = this.snake.section(i);
			this.drawImage(snakeImage, snakeSprites["animal_body_nian"], this.getRect(section));
		}
	},

	drawSnakeTail: function(section) {
		var tail = this.snake.section(0),
			direction = this.snake.directionOfSection(0),
			sprite = snakeSprites["animal_tail_" + direction];
		this.drawImage(snakeImage, sprite, this.getRect(tail));
	},

	drawSnakeHead: function() {
		var head = this.snake.section(-1),
			direction = this.snake.directionOfSection(-1),
			sprite = snakeSprites["animal_head_" + direction];
		this.drawImage(snakeImage, sprite, this.getRect(head));
	},

	getRect: function(section) {
		return {
			x: section.x * this.block_size,
			y: section.y * this.block_size,
			width: this.block_size,
			height: this.block_size
		};
	},

	drawFood: function() {
		var sprite = foodSprites[this.food.key];
		var rect = this.getRect(this.food);
		this.drawImage(foodImage, sprite, rect);
	},

	draw: function() {
		this.resetCanvas();
		this.drawSnake();
		this.drawFood();
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