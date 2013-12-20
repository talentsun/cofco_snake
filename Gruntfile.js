module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                separator: ';'
            }, 
            dist: {
                src: ['src/**/*.js'],
                dest: '<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: "/*! <%=pkg.name%> <%=grunt.template.today('yyyy-mm-dd')%> */\n"
            },
            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= concat.dist.dest %>'
            }
        },
        qunit: {
            files: ['test/**/*.html']
        },
        jshint: {
            src: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        },
        watch: {
            files: ['<%= jshint.src %>'],
            tasks: ['jshint', 'shell:deploy']  
        },
        shell: {
            deploy: {
                command: 'cp src/<%= pkg.name %>.js <%= test_server %>/public',
                options: {
                    stdout: true
                }
            }
        },
        test_server: '/home/yangchen/snake-server'
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('test', ['jshint', /*'qunit'*/]);
    grunt.registerTask('default', ['jshint', /*'qunit',*/ 'concat', /*'uglify',*/ 'shell:deploy']);
    //grunt.registerTask('default', ['shell:deploy']);
}


