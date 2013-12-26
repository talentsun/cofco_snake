module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                separator: '\n\n;\n\n'
            },
            dist: {
                src: [
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
            files: ['<%= jshint.src %>'],
            tasks: ['default']
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
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('test', []);
    grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'shell:deploy']);
};