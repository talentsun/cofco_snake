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
            files: ['gruntfile.jsll', 'src/**/*.js', 'test/**/*.js']
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint', 'qunit']  
        },
        shell: {
            deploy: {
                command: 'cp <%= pkg.name %>.js <%= test_server %>/public'
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

    grunt.registerTask('test', ['jshint']);
    //grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'shell']);
    //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
}



