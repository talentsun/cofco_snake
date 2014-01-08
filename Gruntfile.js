module.exports = function(grunt) {
    var sources = {
        desktop: [
            'src/head.js',
            'src/animation.js',
            'src/utils.js',
            'src/cookie.js',
            'src/api.js',
            'src/timer.js',
            'src/game.js',
            'src/controller.desktop.js',
            'src/tail.js'
        ],
        mobile: [
            'src/head.js',
            'src/animation.js',
            'src/utils.js',
            'src/cookie.js',
            'src/api.js',
            'src/timer.js',
            'src/game.js',
            'src/controller.mobile.js',
            'src/tail.js'
        ]
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        async: 'bower_components/async/lib/async.js',
        static_dir: 'public',

        sprite: {
            resources: {
                src: "images/res/*.png",
                destImg: '<%= static_dir %>/images/resources.png',
                destCSS: 'less/resources.less',
                imgPath: '../images/resources.png',
                padding: 10,
                cssOpts: {
                    'cssClass': function(item) {
                        return '.snake-' + item.name;
                    }
                }
            },
            foods: {
                src: "images/food/*.png",
                destImg: '<%= static_dir %>/images/foods.png',
                padding: 10,
                destCSS: '<%= static_dir %>/json/foods.json'
            },
            snake: {
                src: "images/snake/*.png",
                destImg: '<%= static_dir %>/images/snake.png',
                padding: 10,
                destCSS: '<%= static_dir %>/json/snake.json'
            },
            canvas: {
                src: "images/res/canvas_bg.png",
                destImg: '<%= static_dir %>/images/canvas.png',
                padding: 10,
                destCSS: '<%= static_dir %>/json/canvas.json'
            }
        },
        less: {
            prod: {
                options: {
                    cleancss: true
                },
                files: {
                    "<%= static_dir %>/css/snake.desktop.min.css": "less/snake.desktop.less",
                    "<%= static_dir %>/css/snake.mobile.min.css": "less/snake.mobile.less"
                }
            },
            development: {
                files: {
                    "<%= static_dir %>/css/snake.desktop.css": "less/snake.desktop.less",
                    "<%= static_dir %>/css/snake.mobile.css": "less/snake.mobile.less"
                }
            }
        },
        env: {
            dev: {
                NODE_ENV: 'development'
            }
        },
        express: {
            dev: {
                options: {
                    background: true,
                    debug: false,
                    script: 'app.js'
                }
            }
        },
        concat: {
            options: {
                separator: '\n\n;\n\n'
            },
            desktop: {
                src: ['<%= async %>'].concat(sources.desktop),
                dest: '<%= static_dir %>/js/<%= pkg.name %>.desktop.js',
            },
            mobile: {
                src: ['<%= async %>'].concat(sources.mobile),
                dest: '<%= static_dir %>/js/<%= pkg.name %>.mobile.js'
            }
        },
        uglify: {
            options: {
                banner: "/*! <%=pkg.name%> <%=grunt.template.today('yyyy-mm-dd')%> */\n"
            },
            desktop: {
                src: '<%= concat.desktop.dest %>',
                dest: '<%= static_dir %>/js/<%= pkg.name %>.desktop.min.js',
            },
            mobile: {
                src: '<%= concat.mobile.dest %>',
                dest: '<%= static_dir %>/js/<%= pkg.name %>.mobile.min.js',
            }
        },
        qunit: {
            files: ['test/**/*.html'],
        },

        jshint: {
            src: [
                'Gruntfile.js',
                'app.js'
            ]
        },

        watch: {
            express: {
                files: ['templates/index.hbs', 'Gruntfile.js', 'app.js', 'src/*.js', 'templates/*.hbs'],
                tasks: ['default', 'env:dev', 'express:dev'],
                options: {
                    spawn: false
                }
            },
            styles: {
                files: ['less/**/*.less'],
                tasks: ['less']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-spritesmith');

    grunt.registerTask('test', []);
    grunt.registerTask('server', ['default', 'env:dev', 'express:dev', 'watch:express']);
    grunt.registerTask('default', ['concat', 'jshint', 'uglify']);
};