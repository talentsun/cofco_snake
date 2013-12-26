function _nextTick(cb) {
	setTimeout(cb, 0);
}

var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	_nextTick;