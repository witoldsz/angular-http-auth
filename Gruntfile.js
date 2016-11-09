/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * License: MIT
 */

"use strict"

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadTasks('tasks');

    grunt.registerTask('default', function() {
        grunt.log.ok("HTTP Auth Interceptor Module for AngularJS");
        grunt.log.ok("============================");
        grunt.task.run(["uglify"]);
        grunt.log.ok("Minified ok");
    });

};
