var DIRECTION_KEYCODES = {
    up: [38, 75, 87],
    down: [40, 74, 83],
    left: [37, 65, 72],
    right: [39, 68, 76],
};

function getDirectionByKeyCode(keyCode) {
    for (var key in DIRECTION_KEYCODES) {
        var codelist = DIRECTION_KEYCODES[key];
        if (~u.indexOf(codelist, keyCode)) {
            return key;
        }
    }

    return null;
}

function Modal(el) {
    this.el = el;
    this.$el = $(el);
}

Modal.prototype = {
    show: function() {
        this.$el.removeClass("hide");
    },

    hide: function() {
        this.$el.addClass("hide");
    }
};

function GameOverPane(el) {
    var self = this;
    this.el = el;
    this.$el = $(el);
    this.$el.find('.restart').click(function() {
        if (self.onRestartHandler) {
            self.onRestartHandler();
        }
    });
}

GameOverPane.prototype = {
    constructor: GameOverPane,

    showGift: function() {
        this.$el.find(".courage-section").removeClass('hide');
    },

    setScore: function(score) {
        this.$el.find(".score").html(score);
        if (score >= 50) {
            this.$el.find(".tip-section .tips").html("<span>你竟然得了</span><br><br>" +
                "<span class='score'>" + score + "</span><span>分</span><br><br>" +
                "<span>年兽好满足，</span><br><br>" +
                "<span>暂时不会再来了！</span>");
            this.$el.find(".nian-mood").removeClass('nian-sad').addClass('nian-happy');
        } else {
            this.$el.find(".tip-section .tips").html("<span>你才得了</span><br><br>" +
                "<span class='score'>" + score + "</span><span>分</span><br><br>" +
                "<span>年兽还没吃饱，</span><br><br>" +
                "<span>还有可能出没哦！</span><br><br>" +
                "<span>继续加油吧！</span>");
            this.$el.find(".nian-mood").removeClass('nian-happy').addClass('nian-sad');
        }
    },

    hideGift: function() {
        this.$el.find(".courage-section").addClass('hide');
    },

    onRestart: function(handler) {
        this.onRestartHandler = handler;
    },

    show: function() {
        this.$el.removeClass("hide");
    },

    hide: function() {
        this.$el.addClass("hide");
    }
};

var _Controller = {
    setupKeyBindings: function() {
        var self = this;

        function while_playing(func) {
            return function() {
                if (self.game.status !== Game.PLAYING) return;
                if (func) func.apply(this, arguments);
            };
        }

        $(document).on("keydown", while_playing(function(e) {
            e.preventDefault();
            var direction = getDirectionByKeyCode(e.keyCode);
            if (direction) self.game.changeSnakeDirection(direction);
        }));

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
        this.currentScoreEl.innerHTML = this.game.score();
    },

    onUploadScoreFailed: function() {
        var self = this;
        console.error('failed to upload score');
        this.errorPane.show();
        setTimeout(function() {
            self.errorPane.hide();
            self.$overlay.hide();
        }, 2 * 1000);
    },

    onScoreUploaded: function(user) {
        this.user = u.extend(this.user, user);

        this.showTotalScore(this.user.score);
        _Controller.showRank.call(this);
        if (this.user.winPrize) {
            this.gameoverPane.showGift();
        } else {
            this.gameoverPane.hideGift();
        }
        this.gameoverPane.setScore(this.game.score());
        this.gameoverPane.show();
    },

    onUploadScoreTimeout: function() {
        _Controller.onUploadScoreFailed.call(this);
    },

    onGameFailed: function() {
        var self = this;
        $(this.controlButton).removeClass('pause');
        this.game.over();

        function _hide(func) {
            return function() {
                self.loadingPane.hide();
                if (func) {
                    func.apply(null, arguments);
                }
            }
        }

        this.$overlay.show();
        this.loadingPane.show();
        api.sync_score(this.user.member_id, this.game.score(),
            //u.delay(5 * 1000,
            u.timeup(10 * 1000,
                _hide(function(err, user) {
                    if (err) {
                        _Controller.onUploadScoreFailed.call(self);
                    } else {
                        _Controller.onScoreUploaded.call(self, user);
                    }
                }), _hide(u.bind(_Controller.onUploadScoreTimeout, this))
            )
            //)
        );
    },

    newGame: function() {
        this.game = new Game(this.canvas);
        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
    },

    showRank: function() {
        this.$currentRank.html(this.user.today_rank);
        this.$totalRank.html(this.user.total_rank);
    },

    kickOff: function() {
        this.currentScoreEl.innerHTML = 0;
        this.rounds++;
    },

    //start or resume
    resume: function() {
        this.game.start();
        $(this.controlButton).addClass('pause');
    },

    pause: function() {
        this.game.pause();
        $(this.controlButton).removeClass('pause');
    },

    startGame: function() {
        _Controller.newGame.call(this);
        _Controller.kickOff.call(this);
        _Controller.resume.call(this);
    }
};

function Controller() {
    this.rounds = 0;
    this.user = null;
}

Controller.prototype = {

    onload: function(canvas, user) {
        var self = this;

        var $loadingPanel = $(".snake-loading-pane");
        $loadingPanel.find("h1").hide();
        if (!user) {
            $loadingPanel.find("button").show().click(function() {
                // TODO
            });
            return;
        }

        $loadingPanel.find("button").show().click(function() {
            $loadingPanel.hide();
            if (cookie.get('snake_played') !== 'true') {
                self.$rules.show();
            } else {
                _Controller.startGame.call(self);
            }
        });

        this.canvas = canvas;
        this.$overlay = $(".snake-modal-overlay");
        this.loadingPane = new Modal($(".snake-modal-wrap.loading")[0]);
        this.errorPane = new Modal($(".snake-modal-wrap.error")[0]);
        this.gameoverPane = new GameOverPane($(".gameover")[0]);
        this.gameoverPane.onRestart(function() {
            self.$overlay.hide();
            self.gameoverPane.hide();
            _Controller.startGame.call(self);
        });

        this.$rules = $('.snake-container-wrap .rules');
        this.$rules.on('click', 'button', function() {
            cookie.set('snake_played', 'true', {
                expires: 14
            });
            self.$rules.hide();
            _Controller.startGame.call(self);
        });

        this.$currentRank = $(".rank .current");
        this.$totalRank = $(".rank .total");
        this.currentScoreEl = document.getElementById('current-score');
        this.totalScoreEl = document.getElementById('total-score');
        this.controlButton = document.getElementById('control');
        this.controlButton.onclick = function() {
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
        };
        _Controller.setupKeyBindings.call(this);


        self.user = user;
        self.showTotalScore(self.user.score);
        _Controller.showRank.call(self);
    },

    showTotalScore: function(totalScore) {
        this.totalScoreEl.innerHTML = totalScore;
    }
};

var foodImage = null;
var foodSprites = null;
var snakeImage = null;
var snakeSprites = null;

function loadSpriteImages(callback) {
    var images = ["images/snake.png", "images/foods.png"];
    async.each(images, function(item, cb) {
        var image = new Image();
        image.onload = function() {
            if (item === "images/snake.png") {
                snakeImage = image;
            } else if (item == "images/foods.png") {
                foodImage = image;
            }
            cb(null, image);
        };

        image.onerror = function() {
            cb('fail to load image:' + item);
        };

        image.src = item;
    }, function(err, results) {
        if (err) {
            return callback(err);
        }

        callback(null, results);
    });
}

function loadSpriteMeta(callback) {
    async.each(["json/snake.json", "json/foods.json"], function(item, cb) {
        $.get(item, "json").success(function(sprites) {
            if (item === "json/snake.json") {
                snakeSprites = sprites;
            } else {
                foodSprites = sprites;
            }
            cb(null, sprites);
        }).error(function() {
            cb('fail to load sprites: ' + item);
        });
    }, function(err, results) {
        if (err) {
            return callback(err);
        }

        callback(null, results);
    });
}


var controller = new Controller();

$(function() {
    canvas = document.getElementById("snake");
    if (typeof FlashCanvas != "undefined") {
        FlashCanvas.initElement(canvas);
    }

    var user = null;

    function loadResImages(callback) {
        var src = "images/resources.png";
        var image = new Image();
        image.onload = function() {
            callback(null, image);
        };

        image.onerror = function() {
            callback('fail to load image:' + src);
        };

        image.src = src;
    }

    function getInfoInNeed(callback) {
        api.getInfoInNeed(function(err, _user) {
            if (!err) {
                user = _user;
            }

            callback(null);
        });
    }

    async.parallel([
            loadSpriteImages,
            loadSpriteMeta,
            loadResImages,
            getInfoInNeed
        ],
        //u.delay(2 * 1000,
        function(err) {
            if (err) {
                return conosle.error(err);
            }

            controller.onload(canvas, user);
        }
        //)
    );
});