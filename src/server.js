// server
var server = {
	upload: function(params, callback) {
		console.log(params.score);
		$.get('/test/upload', params, "json").success(function(data) {
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
		$.get('/test/info', "json").success(function(data) {
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

	sync_score: function(params, callback) {
		function _upload(callback) {
			server.upload(params, function(err, data) {
				if (err) return callback(err);
				callback(null, data.gift);
			});
		}

		function _info(gift, callback) {
			server.info(function(err, user) {
				if (err) return callback(err);
				user.gift = gift;
				callback(null, user);
			});
		}

		async.waterfall([_upload, _info],
			u.delay(5,
				function(err, result) {
					if (err) return callback(err);
					callback(null, result);
				}
			)
		);
	}
};