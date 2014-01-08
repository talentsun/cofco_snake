// api

var api = {
	NETWORK_ERROR: 'network error',
	STATUS_ERROR: 'status error',
	_handle: function(callback) {
		return function(data) {
			if (data.status != 1) {
				return callback(api.STATUS_ERROR);
			}

			callback(null, data.data);
		};
	},

	_onerror: function(callback) {
		return function() {
			callback(api.NETWORK_ERROR);
		};
	},

	addScore: function(params, callback) {
		$.get('/game/api/addScore', params, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getTotalScore: function(member_id, callback) {
		$.get('/game/api/getTotalScore', {
			member_id: member_id
		}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getUserinfo: function(callback) {
		$.get('/game/api/getMemberInfo', {}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getRank: function(member_id, callback) {
		$.get('/game/api/getScoreRank', {
			member_id: member_id
		}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getInfoInNeed: function(callback) {
		function _getUserInfo(callback) {
			api.getUserinfo(function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			});
		}

		function _getRank(user, callback) {
			api.getRank(user.member_id, function(err, rank) {
				if (!err) {
					u.extend(user, rank);
				}
				callback(null, user);
			});
		}

		async.waterfall([_getUserInfo, _getRank],
			//u.delay(5 * 1000,
			function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			}
			//)
		);
	},

	sync_score: function(member_id, score, callback) {
		function _addScore(callback) {
			api.addScore({
				member_id: member_id,
				score: score
			}, function(err, data) {
				if (err) {
					return callback(err);
				}

				callback(null, data.winPrize);
			});
		}

		function _getUserInfo(winPrize, callback) {
			api.getUserinfo(function(err, user) {
				if (err) {
					return callback(err);
				}

				user.winPrize = winPrize;
				callback(null, user);
			});
		}

		function _getRank(user, callback) {
			api.getRank(member_id, function(err, rank) {
				if (!err) {
					u.extend(user, rank);
				}
				callback(null, user);
			});
		}

		async.waterfall([_addScore, _getUserInfo, _getRank],
			//u.delay(5 * 1000,
			function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			}
			//)
		);
	}
};