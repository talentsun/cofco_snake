var path = require('path');

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        async: 'bower_components/async/lib/async.js',
        express: {
            dev: {
                options: {
                    port: 11111,
                    background: true,
                    script: 'app.js'
                }
            }
        },
        concat: {
            options: {
                separator: '\n\n;\n\n'
            },
            dist: {
                src: [
                    '<%= async %>',
                    'src/head.js',
                    'src/animation.js',
                    'src/utils.js',
                    'src/server.js',
                    'src/timer.js',
                    'src/core.js',
                    'src/tail.js'
                ],
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
            files: ['test/**/*.html']
        },
        jshint: {
            src: [
                'Gruntfile.js',
                'src/animation.js',
                'src/utils.js',
                'src/server.js',
                'src/timer.js',
                'src/core.js',
            ]
        },
        watch: {
            express: {
                files: ['<%= jshint.src %>'],
                tasks: ['default', 'express:dev'],
                options: {
                    spawn: false
                }
            }
        },
        shell: {
            deploy: {
                command: 'cp <%= pkg.name %>.js demo/js',
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

    grunt.registerTask('test', []);
    grunt.registerTask('server', ['express:dev', 'watch']);
    grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'shell:deploy']);
};