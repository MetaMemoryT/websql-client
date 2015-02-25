/* globals exports, __dirname */
var zombie = require("zombie");
var app = require('express')();
var serveStatic = require('serve-static');

module.exports = {
  setUp: function(callback) {
    console.log('setUp');
    this.foo = 'bar';
    callback();

    app.use("/browser", serveStatic(__dirname + "/browser"));
    app.use("/bower_components", serveStatic(__dirname + "/../bower_components"));

    /*
    app.listen(3000, function() {
      callback();
      var location = "http://localhost:3000/browser/index.html";
      var browser = new zombie.Browser({
        userAgent: 'Zombie'
      });
      browser.visit(location, function(err, browser) {
        if (err) {
          console.log('Error: ', err);
          callback();
        }
        // Start QUnit
        browser.fire('load', browser.window);

        browser.resources.addHandler(function(request, next) {
          console.log(request);
          next();
        });
        browser.on('event', function(event, target) {
          console.log(event, target);
          // app.close();
          // callback();
        });
        callback();
      });
    });

    callback();
    */
  },
  tearDown: function(callback) {
    // clean up
    callback();
  },
  test1: function(test) {
    test.equals(this.foo, 'bar');
    test.done();
  }
};