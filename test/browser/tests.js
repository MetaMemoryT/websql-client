/* globals QUnit, stringTests */
(function() {
  'use strict';

  var DEFAULT_SIZE = 5000000; // max to avoid popup in safari/ios

  document.addEventListener("DOMContentLoaded", doAllTests);

  function doAllTests() {
    QUnit.config.testTimeout = 2000; // 25000; // 25 sec.

    QUnit.done(function(details) {
      console.log("Total: ", details.total,
        " Failed: ", details.failed,
        " Passed: ", details.passed,
        " Runtime: ", details.runtime);
    });
    doTest(false, 'Plugin: ', window.sqlitePlugin.openDatabase);
    /*
    if (!/MSIE/.test(navigator.userAgent))
      doTest(true, 'HTML5: ', window.openDatabase);
    */
  }

  function doTest(isWebSql, suiteName, openDatabase) {
    stringTests(suiteName, DEFAULT_SIZE, openDatabase);
  }
})();