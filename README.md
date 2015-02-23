WebSQL Server
=============

[websql-server](https://github.com/MetaMemoryT/websql-server) exposes a sqlite
API originally defined at
[Cordova-SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin)
through Websockets.

[websql-client](https://github.com/MetaMemoryT/websql-client) connects to [websql-server](https://github.com/MetaMemoryT/websql-server)
and exposes a WebSQL API.

Usage
======

Install:
```
npm install -g websql-server
```

Start the server:
```
websql-server
```

Import websql-client (a bower package) into your html
```
TODO
```

Include the initialization code:
```
TODO
```

Intended Use cases
==================
Testing and prototyping Cordova Apps in the web browser that use
[Cordova-SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin).

Advantages over using browser's Built in WebSQL implementations:
================================================================

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
