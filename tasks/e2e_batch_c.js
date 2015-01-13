/*
 * grunt-protractor-runner
 * https://github.com/teerapap/grunt-protractor-runner
 *
 * Copyright (c) 2013 Teerapap Changwichukarn
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util');
var path = require('path');

module.exports = function(grunt) {

  grunt.registerMultiTask('e2ec', 'A new grunt task to run protractor.', function() {
      var keepAlive = false;
      var args = [
        '/Users/mmonti/Documents/grunt-protractor-runner-master/node_modules/protractor/bin/protractor',
        'test/testConf.js',
        '--specs',
        'test/blankTest.js'
      ];

      console.log('spec', this.args);
       console.log('json', json);
       var json = grunt.file.readJSON('e2e.json');
       console.log('json', json);
       json.count--;
       grunt.file.write('e2e.json', JSON.stringify(json));

        var done = this.async();
        grunt.util.spawn({
            cmd: 'node',
            args: args,
            opts: {
              stdio:'inherit'
            }
          },
          function(error, result, code) {
            if (error) {
              grunt.log.error(String(result));
              if(code === 1 && keepAlive) {
                // Test fails but do not want to stop the grunt process.
                grunt.log.oklns("Test failed but keep the grunt process alive.");
                done();
                done = null;
              } else {
                // Test fails and want to stop the grunt process,
                // or protractor exited with other reason.
                grunt.fail.fatal('protractor exited with code: '+code, 3);
              }
            } else {
              done();
              done = null;
            }
          });

  });


};
