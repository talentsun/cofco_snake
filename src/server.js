var server = {

	sync_score: function(params, callback) {
		console.log(params.score);
		$.post('/test/upload_score', params, "json").sucess(function(data) {
			console.log(data);
			if (data.status != 1) {
				callback('error');
			} else {
				callback(null, data.data);
			}
		}).error(function() {
			callback('network error');
		});
	},

	info: function(callback) {
		$.post('/test/info', "json").sucess(function(data) {
			console.log(data);
			if (data.status != 1) {
				callback('error');
			} else {
				callback(null, data.data);
			}
		}).error(function() {
			callback('network error');
		});
	}
};