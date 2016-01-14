'use strict';

module.exports = function (grunt) {
	return {
		build: {
			options: {
				mangle: true,
				compress: true,
				banner: "/* <%= pkg.name %> - <%= pkg.version %> / <%= pkg.author %>  */"
			},
	    src: ['**/*.js','!**/*.min.js'],
	    cwd: 'src',
	    dest: 'src',
	    expand: true,
	    ext: '.min.js',
	  }
	};
};
