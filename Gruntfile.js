module.exports = function(grunt) {
    var sources = [
        'src/head.js',
        'src/animation.js',
        'src/utils.js',
        'src/api.js',
        'src/timer.js',
        'src/core.js',
        'src/tail.js'
    ];

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
                padding: 20,
                cssOpts: {
                    'cssClass': function(item) {
                        return '.snake-' + item.name;
                    }
                }
            },
            foods: {
                src: "images/food/*.png",
                destImg: '<%= static_dir %>/images/foods.png',
                padding: 20,
                destCSS: '<%= static_dir %>/json/foods.json'
            },
            snake: {
                src: "images/snake/*.png",
                destImg: '<%= static_dir %>/images/snake.png',
                padding: 20,
                destCSS: '<%= static_dir %>/json/snake.json'
            }
        },
        less: {
            prod: {
                options: {
                    cleancss: true
                },
                files: {
                    "<%= static_dir %>/css/snake.min.css": "less/snake.less"
                }
            },
            development: {
                files: {
                    "<%= static_dir %>/css/snake.css": "less/snake.less"
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
            dist: {
                src: ['<%= async %>'].concat(sources),
                dest: '<%= static_dir %>/js/<%= pkg.name %>.js',
            }
        },
        uglify: {
            options: {
                banner: "/*! <%=pkg.name%> <%=grunt.template.today('yyyy-mm-dd')%> */\n"
            },
            build: {
                src: '<%= concat.dist.dest %>',
                dest: '<%= static_dir %>/js/<%= pkg.name %>.min.js',
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
                files: ['templates/index.hbs', 'Gruntfile.js', 'app.js'].concat(sources),
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