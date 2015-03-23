# WebSQL Client
[![Bower version](https://badge.fury.io/bo/websql-client.svg)](http://badge.fury.io/bo/websql-client)

[![NPM](https://nodei.co/npm/websql-client.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/websql-client/)

[websql-server](https://github.com/MetaMemoryT/websql-server) exposes a sqlite
API originally defined at
[Cordova-SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin)
through Websockets.

[websql-client](https://github.com/MetaMemoryT/websql-client) connects to [websql-server](https://github.com/MetaMemoryT/websql-server)
and implements the [WebSQL API](http://www.w3.org/TR/webdatabase/).

# Usage

Install websql-server:
```
npm install -g websql-server
```

Start websql-server:
```
websql-server
```

Import websql-client (a bower package) and primus in your html (Primus
is automatically served by websql-server):
```
<script src="bower_components/websql-client/dist/websql-client.js"></script>
<script src="http://localhost:8082/primus/primus.js"></script>
```

Include the initialization code:
```
var db = window.sqlitePlugin.openDatabase({name: "my.db", location: 1});
```

A more advanced installation would conditionally load websql-client if a browser
environment is detected, otherwise load
[Cordova-SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin).

# Testing
## Running tests in the web browser
serve up the whole project as a static site with: http-server (npm package)

navigate to: http://localhost:8080/test/browser/tests/index.html

# Intended Use cases
- Testing and prototyping Cordova Apps in the web browser that use
[Cordova-SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin).
- Running unit tests for code that depends on a websql api (TODO: document how
  to set this up).

# Advantages over using browser's Built in WebSQL implementations:
- No limitations of current WebSQL implementations, such as:
  - not authorized to use function: random
    - https://code.google.com/p/chromium/issues/detail?id=460191
  - maximum database size restrictions
  - not able to use a pre-populated sqlite database from a project directory
  - not able to use sqlite extensions written it C.
- Sqlite connection, initialization and query caching is retained when you
refresh/reload your app.  Your app only has to reconnect to the web server
through Websockets.  This allows for fast livereload incremental
app development.
