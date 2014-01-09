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
		var sprite = snakeSprites["animal_head_" + direction];
		render.drawImage(snakeImage, sprite, game.getRect(head));

		// snake body
		sprite = snakeSprites["animal_body_nian"];
		for (var i = 1; i < snake.length() - 1; i++) {
			var section = snake.section(i);
			render.drawImage(snakeImage, sprite, game.getRect(section));
		}

		//
		var tail = snake.section(0);
		direction = snake.directionOfSection(0);
		sprite = snakeSprites["animal_tail_" + direction];
		render.drawImage(snakeImage, sprite, game.getRect(tail));

		// food	
		var food = game.food;
		sprite = foodSprites[food.key];
		render.drawImage(foodImage, sprite, game.getRect(food));
	},
};
