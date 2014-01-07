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

		function game_over(func) {
			return function() {
				if (self.game.status !== Game.OVER) {
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
		})).on("tap", game_over(function(e) {
			e.preventDefault();
			_Controller.startGame.call(self);
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
		this.$totalScore.html(user.score);
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

		// this.$overlay.show();
		// this.loadingPane.show();
		api.sync_score({
				score: this.game.score()
			},
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
	}
};

function Controller(el) {
	var self = this;
	this.el = el;
	this.$el = $(el);
	this.$canvas = this.$el.find('canvas');
	this.canvas = this.$canvas[0];
	this.context = this.canvas.getContext('2d');

	function _ensureCanvasSize() {
		var size = Math.min(window.innerWidth, window.innerHeight);
		self.$canvas.css('width', size + "px");
		self.$canvas.css('height', size + "px");
	}
	window.onresize = _ensureCanvasSize;
	_ensureCanvasSize();

	this.user = null;
	this.rounds = 0;
}

u.extend(Controller.prototype, {
	onload: function() {
		var self = this;
		this.$currentScore = this.$el.find(".current.score");
		this.$totalScore = this.$el.find(".total.score");
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
	}
});

$(function() {
	var controller = new Controller($(".snake-container-wrap")[0]);

	async.parallel([loadSpriteImages, loadSpriteMeta], function(err) {
		if (err) {
			return console.error(err);
		}

		controller.onload();
	});
});