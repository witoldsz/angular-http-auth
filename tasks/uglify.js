'use strict';

module.exports = function(grunt) {
    grunt.config('uglify', {
        build: {
            options: {
                mangle: false,
                compress: true,
                banner: "/* <%= pkg.name %> - <%= pkg.version %> / <%= pkg.author %>  */"
            },
            src: ['**/*.js', '!**/*.min.js'],
            cwd: 'src',
            dest: 'src',
            expand: true,
            ext: '.min.js',
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
};
