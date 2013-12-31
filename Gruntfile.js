module.exports = function(grunt) {
    var sources = [
        'src/head.js',
        'src/animation.js',
        'src/utils.js',
        'src/server.js',
        'src/timer.js',
        'src/core.js',
        'src/tail.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        async: 'bower_components/async/lib/async.js',
        static_dir: 'public',
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
                dest: '<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: "/*! <%=pkg.name%> <%=grunt.template.today('yyyy-mm-dd')%> */\n"
            },
            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js',
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
                files: ['templates/index.html', 'Gruntfile.js', 'app.js'].concat(sources),
                tasks: ['default', 'env:dev', 'express:dev'],
                options: {
                    spawn: false
                }
            }
        },
        shell: {
            copy_js: {
                command: 'cp <%= pkg.name %>.js  <%= pkg.name %>.min.js <%= static_dir %>/js',
                options: {
                    stdout: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-env');

    grunt.registerTask('test', []);
    grunt.registerTask('server', ['default', 'env:dev', 'express:dev', 'watch']);
    grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'shell:copy_js']);
};
