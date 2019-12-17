// Karma configuration
// Generated on Thu Nov 21 2019 13:53:15 GMT-0800 (PST)

const isDocker = require('is-docker')();

export default function(config: any) {
  const firefoxFlags = [];
  const chromeFlags = [
    '--no-sandbox',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ];

  if (isDocker) {
    firefoxFlags.push('-headless');
    chromeFlags.push(
      '--headless',
      '--disable-gpu',
      '--remote-debugging-port=9222',
    );
  }

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'karma-typescript'],

    // list of files / patterns to load in the browser
    files: [
      './lib/**/*.ts',
      './tests/integration/**/*.ts',
    ],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './**/*.ts': 'karma-typescript',
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'karma-typescript'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeWebRTC', 'FirefoxWebRTC'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // options passed to the typescript compiler
    karmaTypescriptConfig: {
      // relative path to tsconfig
      tsconfig: './tsconfig.json',
    },

    customLaunchers: {
      ChromeWebRTC: {
        base: 'Chrome',
        flags: chromeFlags,
      },
      FirefoxWebRTC: {
        base: 'Firefox',
        flags: firefoxFlags,
        prefs: {
          'media.autoplay.default': 0,
          'media.autoplay.enabled': true,
          'media.gstreamer.enabled': true,
          'media.navigator.permission.disabled': true,
          'media.navigator.streams.fake': true,
        },
      },
    },
  });
}
