function _nextTick(cb) {
	if (cb) {
		cb();
	}
}

var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	_nextTick;