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