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
		if (this.fps < 60) this.fps++;
	}
};