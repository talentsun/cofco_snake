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