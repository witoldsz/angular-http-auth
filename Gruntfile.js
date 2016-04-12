/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * License: MIT
 */

"use strict"

module.exports = function(grunt) {

  require('time-grunt')(grunt);
  var configs = require('load-grunt-config')(grunt,{
    configPath: __dirname +  '/tasks',
    data:{
      pkg: grunt.file.readJSON("package.json")
    }
  });
  grunt.initConfig(configs);

  grunt.registerTask('default', function(){
    grunt.log.ok("HTTP Auth Interceptor Module for AngularJS");
    grunt.log.ok("============================");
    grunt.task.run(["uglify"]);
    grunt.log.ok("Minified ok");
  });

};
