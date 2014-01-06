// api
var api = {
	NOT_LOGIN: 'not-login',
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
			api.upload(params, function(err, data) {
				if (err) return callback(err);
				callback(null, data.gift);
			});
		}

		function _info(gift, callback) {
			api.info(function(err, user) {
				if (err) return callback(err);
				user.gift = gift;
				callback(null, user);
			});
		}

		async.waterfall([_upload, _info],
			//u.delay(5 * 1000,
			function(err, result) {
				if (err) return callback(err);
				callback(null, result);
			}
			//)
		);
	},

	login: function(callback) {
		setTimeout(function() {
			callback(null);
		}, 0);
	},

	userid: 0,

	isUserLogined: function() {
		if (this.userid === 0) {
			this.userid = 1;
			return false;
		} else {
			return true;
		}
	}
};