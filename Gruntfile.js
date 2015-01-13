/*
 * grunt-protractor-runner
 * https://github.com/teerapap/grunt-protractor-runner
 *
 * Copyright (c) 2013 Teerapap Changwichukarn
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    protractor: {
      options: {
        keepAlive: false
      },
      testTargetConfigFile: {
        configFile:"test/testConf.js",
      },
      testKeepAliveOnFailedTest: {
        configFile:"test/testConf.js",
        options: {
          keepAlive: true,
          args: {
            specs:["test/failedTest.js"],
          }
        }
      },
      testArgs: {
        configFile:"test/testConf.js",
        options: {
          args: {
            params: {
              number: 1,
              bool: true,
              str: "string",
              nil: null, // Null is not supported.
              obj: {
                array: [1, 2, 3],
                undef: undefined
              }
            },
            capabilities: {
              'browserName': 'chrome'
            },
            rootElement:"body",
            specs:["test/argsTest.js"],
            verbose:true
          }
        }
      },
      testDebug: {
        configFile:"test/testConf.js",
        options: {
          debug:true,
          args: {
            specs:["test/debugTest.js"],
          }
        }
      }
    },
    protractor_webdriver: {
        start: {
            options: {
                path: 'node_modules/protractor/bin/',
                command: 'webdriver-manager start',
                keepAlive: true
            }
        }
    },
    bgShell:{
       start_selenium: {
          cmd: 'node node_modules/protractor/bin/webdriver-manager start',
          bg: true,
          fail: false
      },

      stop_selenium:{
          cmd: 'curl http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer',
          bg: true,
          fail: false
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-protractor-webdriver');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'protractor']);

  // By default, lint and run all tests.
  //grunt.registerTask('default', ['jshint', 'test']);
  //grunt.registerTask('default', ['jshint', 'e2e']);
  
  // grunt.registerTask('default', function(){
  //   for (var i=1; i<100; i++){
  //     grunt.file.write('test/testA'+i+'.js', grunt.file.read('test/testA.js'));
  //     grunt.file.write('test/testB'+i+'.js', grunt.file.read('test/testB.js'));
  //   }
  // });

  grunt.registerTask('config-batch', function(){
    var configJson = {}

    var suites = [], tests = [];
    grunt.file.expand('test/*.js').forEach(function(path) {
        tests.push(path);
        if (tests.length >= 5){
            suites.push(tests);
            tests = [];
        }
    });

    if (tests.length){
        suites.push(tests);
    }

    for (var index=0; index<suites.length; index++){
        configJson['suite'+(index+1)] = { 
          files: suites[index].join(',')
        };
    }

    configJson.suitesCount = suites.length;

    grunt.file.write('e2e-config.json', JSON.stringify(configJson));

  });

  grunt.registerTask('run-suite',function(){
      console.log('Running task suite', this.args[0]);

      var path = require('path');
      var protractorMainPath = require.resolve('protractor');
      var protractorBinPath = path.resolve(protractorMainPath, '../../bin/protractor');

      var keepAlive = false;
      var args = [
                protractorBinPath,
                'protractor.conf.js',
                '--specs'
      ];

      var configJson = grunt.file.readJSON('e2e-config.json');

      var suite = this.args[0];
      var files = configJson['suite'+suite].files;
      args.push(files);

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

    grunt.registerTask('e2e-batch', function(){
      var suites = [], tests = [];
      grunt.file.expand('test/*.js').forEach(function(path) {
          tests.push(path);
          if (tests.length >= 5){
              suites.push(tests);
              tests = [];
          }
      });
      if (tests.length){
          suites.push(tests);
      }

      var tasks = [],taskId;

      tasks.push('config-batch');
      for (var i=0; i<suites.length; i++){
        taskId = i+1;
        tasks.push('protractor_webdriver');
        tasks.push('run-suite'+':'+taskId);
        //tasks.push('bgShell:stop_selenium');
      }

      grunt.task.run(tasks);
    });



};
