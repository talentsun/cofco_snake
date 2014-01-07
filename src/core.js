DIRECTION_LEFT = 'left';
DIRECTION_RIGHT = 'right';
DIRECTION_UP = 'up';
DIRECTION_DOWN = 'down';

INVERSE_DIRECTION = {
    up: DIRECTION_DOWN,
    left: DIRECTION_RIGHT,
    right: DIRECTION_LEFT,
    down: DIRECTION_UP
};

function Snake(blocks, length) {
    this.blocks = blocks;

    this.direction = DIRECTION_LEFT;
    this.directionChanged = false;

    this.x = Math.ceil(this.blocks / 2);
    this.y = Math.ceil(this.blocks / 2);
    this.sections = [];
    for (var i = this.x + length - 1; i >= this.x; i--) {
        this.sections.push({
            x: i,
            y: this.y
        });
    }
}

Snake.prototype = {

    section: function(i) {
        var index = (this.sections.length + i) % this.sections.length;
        return this.sections[index];
    },

    length: function() {
        return this.sections.length;
    },

    changeDirection: function(direction) {
        if (this.directionChanged) return;

        if (direction === INVERSE_DIRECTION[this.direction]) return;

        this.direction = direction;
        this.directionChanged = true;
    },

    bumpSelf: function() {
        return this.onBody(this.x, this.y);
    },

    onBody: function(x, y) {
        for (var i = 0; i < this.sections.length; i++) {
            var section = this.sections[i];
            if (section.x === x && section.y === y) return true;
        }

        return false;
    },

    directionOfSection: function(i) {
        var len = this.sections.length;
        var index = (len + i) % len;
        var prev, section;
        if (index == len - 1) {
            prev = this.section(index);
            section = this.section(index - 1);
        } else {
            section = this.section(index);
            prev = this.section(index + 1);
        }

        var direction;
        if (prev.x === section.x) {
            if (prev.y === section.y - 1) {
                direction = DIRECTION_UP;
            } else {
                direction = DIRECTION_DOWN;
            }
        } else {
            if (prev.x === section.x - 1) {
                direction = DIRECTION_LEFT;
            } else {
                direction = DIRECTION_RIGHT;
            }
        }
        return direction;
    },

    move: function() {
        switch (this.direction) {
            case DIRECTION_UP:
                this.y--;
                break;
            case DIRECTION_DOWN:
                this.y++;
                break;
            case DIRECTION_LEFT:
                this.x--;
                break;
                //case DIRECTION_RIGHT:
            default:
                this.x++;
        }
    },
};

var _Game = {
    DEFAULT_SCORE: 10,
    triggerScoreChanged: function() {
        if (this.scoreListener) {
            this.scoreListener();
        }
    }
};

function Game(canvas) {
    var self = this;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.blocks = Game.BLOCKS;
    this.block_size = this.canvas.width / this.blocks;

    this.snake = new Snake(this.blocks, 5);
    this.foods = [];
    this.food = this.getFood();
    this.scoreListener = null;

    this.status = Game.INITIALIZED;
    this.failListener = null;

    this.timer = new Timer(function() {
        self.snake.move();
        if (self.isCollision()) {
            self.timer.pause();
            self.fail();
            return;
        }

        self.snake.directionChanged = false;
        if (self.snake.x == self.food.x && self.snake.y == self.food.y) {
            self.foods.push(self.food);
            if (self.foods.length % 5 === 0) self.timer.speedUp();

            _Game.triggerScoreChanged.call(self);
            self.snake.sections.push({
                x: self.snake.x,
                y: self.snake.y
            });

            var food = self.getFood();
            if (!food) return self.fail();
            self.food = food;
        } else {
            self.snake.sections.shift();
            self.snake.sections.push({
                x: self.snake.x,
                y: self.snake.y
            });
        }

        requestAnimationFrame(function() {
            self.draw();
        });
    });
}

u.extend(Game, {
    BLOCKS: 10,
    INITIALIZED: 'initialized',
    PLAYING: 'playing',
    PAUSED: 'paused',
    OVER: 'over'
});

Game.prototype = {
    contructor: Game,

    isInitialized: function() {
        return this.status === Game.INITIALIZED;
    },

    isOver: function() {
        return this.status === Game.OVER;
    },

    over: function() {
        this.status = Game.OVER;
    },

    start: function() {
        var self = this;
        if (this.status !== Game.INITIALIZED &&
            this.status !== Game.PAUSED) {
            console.error('wrong status');
            return;
        }

        this.status = Game.PLAYING;
        this.timer.start();
        requestAnimationFrame(function() {
            self.draw();
        });
    },

    pause: function() {
        this.timer.pause();
        this.status = Game.PAUSED;
    },

    fail: function() {
        this.status = Game.OVER;
        if (this.failListener) this.failListener();
    },

    onFailed: function(l) {
        this.failListener = l;
    },

    isCollision: function() {
        if (this.snake.x < 0 || this.snake.x >= this.blocks ||
            this.snake.y < 0 || this.snake.y >= this.blocks) return true;

        return this.snake.bumpSelf();
    },

    resetCanvas: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    score: function() {
        var score = 0;
        u.each(this.foods, function(food) {
            score += food.score;
        });
        return score;
    },

    onScoreChanged: function(l) {
        this.scoreListener = l;
    },

    drawSnake: function() {
        this.drawSnakeHead();
        this.drawSnakeBody();
        this.drawSnakeTail();
    },

    drawImage: function(image, sprite, rect) {
        var ctx = this.context;
        ctx.drawImage(image, sprite.x, sprite.y, sprite.width, sprite.height,
            rect.x, rect.y, rect.width, rect.height);
    },

    drawSnakeBody: function() {
        for (var i = 2; i < this.snake.length() - 2; i++) {
            var section = this.snake.section(i);
            this.drawImage(snakeImage, snakeSprites["animal_body_nian"], this.getRect(section));
        }
    },

    drawSnakeTail: function(section) {
        var tail = this.snake.section(0),
            direction = this.snake.directionOfSection(0),
            sprite = snakeSprites["animal_tail_" + direction];
        this.drawImage(snakeImage, sprite, this.getRect(tail));

        var beforeTail = this.snake.section(1);
        sprite = snakeSprites["animal_tail_nian_" + direction];
        this.drawImage(snakeImage, sprite, this.getRect(beforeTail));
    },

    drawSnakeHead: function() {
        var head = this.snake.section(-1),
            direction = this.snake.directionOfSection(-1),
            sprite = snakeSprites["animal_head_" + direction];
        this.drawImage(snakeImage, sprite, this.getRect(head));

        var afterHead = this.snake.section(-2);
        sprite = snakeSprites["animal_head_nian_" + direction];
        this.drawImage(snakeImage, sprite, this.getRect(afterHead));
    },

    getRect: function(section) {
        return {
            x: section.x * this.block_size,
            y: section.y * this.block_size,
            width: this.block_size,
            height: this.block_size
        };
    },

    drawFood: function() {
        var sprite = foodSprites[this.food.key];
        var rect = this.getRect(this.food);
        this.drawImage(foodImage, sprite, rect);
    },

    draw: function() {
        this.resetCanvas();
        this.drawSnake();
        this.drawFood();
    },

    changeSnakeDirection: function(direction) {
        this.snake.changeDirection(direction);
    },

    getFood: function() {
        if (this.snake.sections.length === this.blocks * this.blocks) return null;

        var _food = Fooder.getFood();
        var pos = this.getNewFoodPosition();
        return u.extend({}, _food, pos, {
            score: _food.score || _Game.DEFAULT_SCORE
        });
    },

    getNewFoodPosition: function() {
        var pos = {};
        do {
            pos.x = Math.floor(Math.random() * this.blocks);
            pos.y = Math.floor(Math.random() * this.blocks);
        } while (this.snake.onBody(pos.x, pos.y));

        return pos;
    }
};

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
        if (score > 50) {
            this.$el.find(".tip-section .tips").html("<p>你竟然得了</p>" +
                "<p><span class='score'>" + score + "</span>分</p>" +
                "<p>年兽好满足，</p>" +
                "<p>暂时不会再来了！</p>");
            this.$el.find(".nian-mood").removeClass('nian-sad').addClass('nian-happy');
        } else {
            this.$el.find(".tip-section .tips").html("<p>你才得了</p>" +
                "<p><span class='score'>" + score + "</span>分</p>" +
                "<p>年兽还未吃饱，</p>" +
                "<p>你家里人知道吗？</p>");
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
        this.showTotalScore(user.score);
        if (user.gift) {
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

    newGame: function() {
        this.game = new Game(this.canvas);
        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
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

    onload: function(canvas) {
        $(".snake-loading-pane").addClass('fade');
        setTimeout(function() {
            $(".snake-loading-pane").addClass("hide");
        }, 150);

        var self = this;

        if (!api.isUserLogined()) {
            this.$rules = $('.snake-container-wrap .rules');
            this.$rules.on('click', 'button', function() {
                // TODO
            })
            this.controlButton = document.getElementById('control');
            this.controlButton.onclick = function() {
                // TODO
            };
            return;
        }

        this.canvas = canvas;
        //_Controller.newGame.call(this);
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
        if (cookie.get('snake_played') !== 'true') {
            this.$rules.show();
        }

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

        api.info(function(err, data) {
            if (self.rounds > 1 || (self.game && self.game.isOver())) {
                return;
            }

            if (err) {
                return console.error(err);
            }

            self.user = data;
            self.showTotalScore(self.user.score);
        });
    },

    showTotalScore: function(totalScore) {
        this.totalScoreEl.innerHTML = totalScore;
    }
};

var META = {
    foods: {
        zhongcha: {
            key: "zhongcha",
            name: '中茶'
        },
        wugu: {
            key: "wugu",
            name: '五谷'
        },
        mengniu: {
            key: "mengniu",
            name: '蒙牛'
        },
        jindi: {
            key: "jindi",
            name: 'jingdi'
        },
        jiajiakang: {
            key: "jiajiakang",
            name: '家佳康'
        },
        changcheng: {
            key: "changcheng",
            name: '长城'
        },
        fulinmen: {
            key: "fulinmen",
            name: '福临门'
        },
        yuehuo: {
            key: "yuehuo",
            name: 'yuehuo'
        }
    }
};

var Fooder = {
    getFood: function() {
        var keyset = u.keys(META.foods);
        if (keyset.length === 0) return null;

        var index = Math.floor(Math.random() * keyset.length);
        return META.foods[keyset[index]];
    }
};

var foodImage = null;
var foodSprites = null;
var snakeImage = null;
var snakeSprites = null;

function loadResources() {
    var promise = {};

    function _loadImages(callback) {
        var images = ["images/snake.png", "images/foods.png", "images/resources.png"];
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

    function _loadSprites(callback) {
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

    async.parallel([_loadImages, _loadSprites],
        u.delay(2 * 1000,
            function(err) {
                if (err) {
                    if (promise.fail) {
                        promise.fail(err);
                    }
                } else {
                    if (promise.success) {
                        promise.success();
                    }
                }
            }
        )
    );

    return promise;
}

var controller = new Controller();

$(function() {
    canvas = document.getElementById("snake");
    if (!canvas.getContext) {
        G_vmlCanvasManager.initElement(canvas);
    }

    var promise = loadResources();
    promise.success = u.bind(controller.onload, controller, canvas);

    promise.fail = function(err) {
        console.error(err);
    };
});