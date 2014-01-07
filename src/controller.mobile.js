$(function() {
	var $canvas = $(".snake-container-wrap canvas");
	var canvas = $canvas[0];

	function _ensureCanvasSize() {
		var size = Math.min(window.innerWidth, window.innerHeight);
		$canvas.css('width', size + "px");
		$canvas.css('height', size + "px");
	}
	window.onresize = _ensureCanvasSize;
	_ensureCanvasSize();
});