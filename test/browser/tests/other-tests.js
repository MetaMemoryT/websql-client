if (!/MSIE/.test(navigator.userAgent)) test(suiteName + ' UNICODE encoding test', function() {
  stop();

  var dbName = "Unicode-hex-test";
  var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

  db.transaction(function(tx) {
    tx.executeSql('SELECT hex(?) AS hexvalue', ['\u0000foo'], function(tx, res) {
      console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

      var hex1 = res.rows.item(0).hexvalue;

      // varies between Chrome-like (UTF-8)
      // and Safari-like (UTF-16)
      var expected = [
        '000066006F006F00',
        '00666F6F'
      ];

      ok(expected.indexOf(hex1) !== -1, 'hex matches: ' +
        JSON.stringify(hex1) + ' should be in ' +
        JSON.stringify(expected));

      // ensure this matches our expectation of that database's
      // default encoding
      tx.executeSql('SELECT hex("foob") AS hexvalue', [], function(tx, res) {
        console.log(suiteName + "res.rows.item(0).hexvalue: " + res.rows.item(0).hexvalue);

        var hex2 = res.rows.item(0).hexvalue;

        equal(hex1.length, hex2.length,
          'expect same length, i.e. same global db encoding');

        start();
      });
    });
  }, function(err) {
    ok(false, 'unexpected error: ' + err.message);
  }, function() {});
});

// ICU-UNICODE only functional on recent versions of Android:
if (/Android 4\.[3-9]/.test(navigator.userAgent)) test(suiteName + "ICU-UNICODE String test", function() {
  var db = openDatabase("String-test.db", "1.0", "Demo", DEFAULT_SIZE);

  ok(!!db, "db object");

  stop(2);

  db.transaction(function(tx) {

    start(1);
    ok(!!tx, "tx object");

    tx.executeSql("select UPPER('Какой-то кириллический текст') as uppertext", [], function(tx, res) {
      start(1);

      console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);

      equal(res.rows.item(0).uppertext, "КАКОЙ-ТО КИРИЛЛИЧЕСКИЙ ТЕКСТ", "Try ''Some Cyrillic text''");
    });
  });
});


test(suiteName + "CR-LF String test", function() {
  var db = openDatabase("CR-LF-String-test.db", "1.0", "Demo", DEFAULT_SIZE);
  ok(!!db, "db object");
  stop();

  db.transaction(function(tx) {
    ok(!!tx, "tx object");
    tx.executeSql("select upper('cr\r\nlf') as uppertext", [], function(tx, res) {
      ok(res.rows.item(0).uppertext !== "CR\nLF", "CR-LF should not be converted to \\n");
      equal(res.rows.item(0).uppertext, "CR\r\nLF", "CRLF ok");
      tx.executeSql("select upper('Carriage\rReturn') as uppertext", [], function(tx, res) {
        equal(res.rows.item(0).uppertext, "CARRIAGE\rRETURN", "CR ok");
        tx.executeSql("select upper('New\nLine') as uppertext", [], function(tx, res) {
          equal(res.rows.item(0).uppertext, "NEW\nLINE", "newline ok");
          start();
        });
      });
    });
  });
});

test(suiteName + "db transaction test", function() {
  var db = openDatabase("db-trx-test.db", "1.0", "Demo", DEFAULT_SIZE);

  ok(!!db, "db object");

  stop(10);

  db.transaction(function(tx) {

    start(1);
    ok(!!tx, "tx object");

    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

    tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
      start(1);
      ok(!!tx, "tx object");
      ok(!!res, "res object");

      console.log("insertId: " + res.insertId + " -- probably 1");
      console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

      ok(!!res.insertId, "Valid res.insertId");
      equal(res.rowsAffected, 1, "res rows affected");

      db.transaction(function(tx) {
        start(1);
        ok(!!tx, "second tx object");

        tx.executeSql("SELECT count(id) as cnt from test_table;", [], function(tx, res) {
          start(1);

          console.log("res.rows.length: " + res.rows.length + " -- should be 1");
          console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");

          equal(res.rows.length, 1, "res rows length");
          equal(res.rows.item(0).cnt, 1, "select count");
        });

        tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
          start(1);

          equal(res.rows.length, 1, "SELECT res rows length");
          equal(res.rows.item(0).data_num, 100, "SELECT data_num");
        });

        tx.executeSql("UPDATE test_table SET data_num = ? WHERE data_num = 100", [101], function(tx, res) {
          start(1);

          console.log("UPDATE rowsAffected: " + res.rowsAffected + " -- should be 1");

          equal(res.rowsAffected, 1, "UPDATE res rows affected"); /* issue #22 (Android) */
        });

        tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
          start(1);

          equal(res.rows.length, 1, "SELECT res rows length");
          equal(res.rows.item(0).data_num, 101, "SELECT data_num");
        });

        tx.executeSql("DELETE FROM test_table WHERE data LIKE 'tes%'", [], function(tx, res) {
          start(1);

          console.log("DELETE rowsAffected: " + res.rowsAffected + " -- should be 1");

          equal(res.rowsAffected, 1, "DELETE res rows affected"); /* issue #22 (Android) */
        });

        tx.executeSql("SELECT data_num from test_table;", [], function(tx, res) {
          start(1);

          equal(res.rows.length, 0, "SELECT res rows length");
        });

      });

    }, function(e) {
      console.log("ERROR: " + e.message);
    });
  }, function(e) {
    console.log("ERROR: " + e.message);
  }, function() {
    console.log("tx success cb");
    ok(true, "tx success cb");
    start(1);
  });

});

test(suiteName + 'test rowsAffected', function() {
  var db = openDatabase("RowsAffected", "1.0", "Demo", DEFAULT_SIZE);

  stop();

  function test1(tx) {
    tx.executeSql('DROP TABLE IF EXISTS characters');
    tx.executeSql('CREATE TABLE IF NOT EXISTS characters (name, creator, fav tinyint(1))');
    tx.executeSql('UPDATE characters SET name = ?', ['foo'], function(tx, res) {
      equal(res.rowsAffected, 0, 'nothing updated');
      tx.executeSql('DELETE from characters WHERE name = ?', ['foo'], function(tx, res) {
        equal(res.rowsAffected, 0, 'nothing deleted');
        tx.executeSql('UPDATE characters SET name = ?', ['foo'], function(tx, res) {
          equal(res.rowsAffected, 0, 'nothing updated');
          tx.executeSql('DELETE from characters', [], function(tx, res) {
            equal(res.rowsAffected, 0, 'nothing deleted');
            test2(tx);
          });
        });
      });
    });
  }

  function test2(tx) {
    tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Sonic', 'Sega', 0], function(tx, res) {
      equal(res.rowsAffected, 1);
      tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Mario', 'Nintendo', 0], function(tx, res) {
        equal(res.rowsAffected, 1);
        tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Samus', 'Nintendo', 0], function(tx, res) {
          equal(res.rowsAffected, 1);
          tx.executeSql('UPDATE characters SET fav=1 WHERE creator=?', ['Nintendo'], function(tx, res) {
            equal(res.rowsAffected, 2);
            tx.executeSql('UPDATE characters SET fav=1 WHERE creator=?', ['Konami'], function(tx, res) {
              equal(res.rowsAffected, 0);
              tx.executeSql('UPDATE characters SET fav=1', [], function(tx, res) {
                equal(res.rowsAffected, 3);
                test3(tx);
              });
            });
          });
        });
      });
    });
  }

  function test3(tx) {
    tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Mega Man', 'Capcom', 0], function(tx, res) {
      equal(res.rowsAffected, 1);
      tx.executeSql('UPDATE characters SET fav=?, name=? WHERE creator=?;', [1, 'X', 'Capcom'], function(tx, res) {
        equal(res.rowsAffected, 1);
        tx.executeSql('UPDATE characters SET fav=? WHERE (creator=? OR creator=?)', [1, 'Capcom', 'Nintendo'], function(tx, res) {
          equal(res.rowsAffected, 3);
          tx.executeSql('DELETE FROM characters WHERE name="Samus";', [], function(tx, res) {
            equal(res.rowsAffected, 1);
            tx.executeSql('UPDATE characters SET fav=0,name=?', ["foo"], function(tx, res) {
              equal(res.rowsAffected, 3);
              tx.executeSql('DELETE FROM characters', [], function(tx, res) {
                start();
                equal(res.rowsAffected, 3);
              });
            });
          });
        });
      });
    });
  }

  db.transaction(function(tx) {
    test1(tx);
  });
});

test(suiteName + 'test rowsAffected advanced', function() {
  var db = openDatabase("RowsAffectedAdvanced", "1.0", "Demo", DEFAULT_SIZE);

  stop();

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS characters');
    tx.executeSql('CREATE TABLE IF NOT EXISTS characters (name unique, creator, fav tinyint(1))');
    tx.executeSql('DROP TABLE IF EXISTS companies');
    tx.executeSql('CREATE TABLE IF NOT EXISTS companies (name unique, fav tinyint(1))');
    // INSERT or IGNORE with the real thing:
    tx.executeSql('INSERT or IGNORE INTO characters VALUES (?,?,?)', ['Sonic', 'Sega', 0], function(tx, res) {
      equal(res.rowsAffected, 1);
      tx.executeSql('INSERT INTO characters VALUES (?,?,?)', ['Tails', 'Sega', 0], function(tx) {
        tx.executeSql('INSERT INTO companies VALUES (?,?)', ['Sega', 1], function(tx, res) {
          equal(res.rowsAffected, 1);
          // query with subquery
          var sql = 'UPDATE characters ' +
            ' SET fav=(SELECT fav FROM companies WHERE name=?)' +
            ' WHERE creator=?';
          tx.executeSql(sql, ['Sega', 'Sega'], function(tx, res) {
            equal(res.rowsAffected, 2);
            // query with 2 subqueries
            var sql = 'UPDATE characters ' +
              ' SET fav=(SELECT fav FROM companies WHERE name=?),' +
              ' creator=(SELECT name FROM companies WHERE name=?)' +
              ' WHERE creator=?';
            tx.executeSql(sql, ['Sega', 'Sega', 'Sega'], function(tx, res) {
              equal(res.rowsAffected, 2);
              // knockoffs shall be ignored:
              tx.executeSql('INSERT or IGNORE INTO characters VALUES (?,?,?)', ['Sonic', 'knockoffs4you', 0], function(tx, res) {
                equal(res.rowsAffected, 0);
                start();
              }, function() {
                ok(false, 'knockoff should have been ignored');
                start();
              });
            });
          });
        });
      });
    });
  });
});

test(suiteName + "nested transaction test", function() {

  var db = openDatabase("Database2", "1.0", "Demo", DEFAULT_SIZE);

  ok(!!db, "db object");

  stop(3);

  db.transaction(function(tx) {

    start(1);
    ok(!!tx, "tx object");

    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

    tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
      start(1);

      console.log("insertId: " + res.insertId + " -- probably 1");
      console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

      ok(!!res.insertId, "Valid res.insertId");
      equal(res.rowsAffected, 1, "res rows affected");

      tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
        start(1);

        console.log("res.rows.length: " + res.rows.length + " -- should be 1");
        console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");

        equal(res.rows.length, 1, "res rows length");
        equal(res.rows.item(0).cnt, 1, "select count");

      });

    });

  });

});

function withTestTable(func) {
  stop();
  var db = openDatabase("Database", "1.0", "Demo", DEFAULT_SIZE);
  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');
  }, function(err) {
    ok(false, err.message);
  }, function() {
    start();
    func(db);
  });
}

// XXX (Uncaught) Error is reported in the case of Web SQL, needs investigation!
if (!isWebSql) test(suiteName + "transaction encompasses all callbacks", function() {
  stop();
  var db = openDatabase("tx-all-callbacks.db", "1.0", "Demo", DEFAULT_SIZE);

  db.transaction(function(tx) {

    start();
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

    stop();
    db.transaction(function(tx) {
      tx.executeSql('INSERT INTO test_table (data, data_num) VALUES (?,?)', ['test', 100], function(tx) {
        tx.executeSql("SELECT count(*) as cnt from test_table", [], function(tx, res) {
          start();
          equal(res.rows.item(0).cnt, 1, "did insert row");
          stop();
          throw new Error("deliberately aborting transaction");
        });
      });
    }, function(error) {
      start();
      if (!isWebSql) equal(error.message, "deliberately aborting transaction");
      stop();
      db.transaction(function(tx) {
        tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
          start();
          equal(res.rows.item(0).cnt, 0, "final count shows we rolled back");
        });
      });
    }, function() {
      start();
      ok(false, "transaction succeeded but wasn't supposed to");
    });
  });
});

// XXX (Uncaught) Error is reported in the case of Web SQL, needs investigation!
if (!isWebSql) test(suiteName + "exception from transaction handler causes failure", function() {
  stop();
  var db = openDatabase("exception-causes-failure.db", "1.0", "Demo", DEFAULT_SIZE);

  try {
    db.transaction(function() {
      throw new Error("boom");
    }, function(err) {
      ok(!!err, "valid error object");
      ok(err.hasOwnProperty('message'), "error.message exists");
      start();
      if (!isWebSql) equal(err.message, 'boom');
    }, function() {
      ok(false, "not supposed to succeed");
      start();
    });
    ok(true, "db.transaction() did not throw an error");
  } catch (err) {
    ok(true, "db.transaction() DID throw an error");
  }
});

test(suiteName + "error handler returning true causes rollback", function() {
  withTestTable(function(db) {
    stop(2);
    db.transaction(function(tx) {
      tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
        start();
        equal(res.rowsAffected, 1, 'row inserted');
        stop();
        tx.executeSql("select * from bogustable", [], function() {
          start();
          ok(false, "select statement not supposed to succeed");
        }, function(tx, err) {
          start();
          ok(!!err.message, "should report a valid error message");
          return true;
        });
      });
    }, function(err) {
      start();
      ok(!!err.message, "should report error message");
      stop();
      db.transaction(function(tx) {
        tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
          start();
          equal(res.rows.item(0).cnt, 0, "should have rolled back");
        });
      });
    }, function() {
      start();
      ok(false, "not supposed to succeed");
    });
  });
});

test(suiteName + "error handler returning non-true lets transaction continue", function() {
  withTestTable(function(db) {
    stop(2);
    db.transaction(function(tx) {
      tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
        start();
        equal(res.rowsAffected, 1, 'row inserted');
        stop();
        tx.executeSql("select * from bogustable", [], function() {
          start();
          ok(false, "select statement not supposed to succeed");
        }, function(tx, err) {
          start();
          ok(!!err.message, "should report a valid error message");
        });
      });
    }, function() {
      start();
      ok(false, "transaction was supposed to succeed");
    }, function() {
      db.transaction(function(tx) {
        tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
          start();
          equal(res.rows.item(0).cnt, 1, "should have commited");
        });
      });
    });
  });
});

test(suiteName + "missing error handler causes rollback", function() {
  withTestTable(function(db) {
    stop();
    db.transaction(function(tx) {
      tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ['test', null], function(tx, res) {
        equal(res.rowsAffected, 1, 'row inserted');
        tx.executeSql("select * from bogustable", [], function() {
          ok(false, "select statement not supposed to succeed");
        });
      });
    }, function(err) {
      ok(!!err.message, "should report a valid error message");
      db.transaction(function(tx) {
        tx.executeSql("select count(*) as cnt from test_table", [], function(tx, res) {
          start();
          equal(res.rows.item(0).cnt, 0, "should have rolled back");
        });
      });
    }, function() {
      start();
      ok(false, "transaction was supposed to fail");
    });
  });
});

test(suiteName + "all columns should be included in result set (including 'null' columns)", function() {
  withTestTable(function(db) {
    stop();
    db.transaction(function(tx) {
      tx.executeSql("insert into test_table (data, data_num) VALUES (?,?)", ["test", null], function(tx, res) {
        equal(res.rowsAffected, 1, "row inserted");
        tx.executeSql("select * from test_table", [], function(tx, res) {
          var row = res.rows.item(0);
          deepEqual(row, {
            id: 1,
            data: "test",
            data_num: null
          }, "all columns should be included in result set.");
          start();
        });
      });
    });
  });
});

test(suiteName + "number values inserted using number bindings", function() {
  stop();
  var db = openDatabase("Value-binding-test.db", "1.0", "Demo", DEFAULT_SIZE);
  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data_text1, data_text2, data_int, data_real)');
  }, function(err) {
    ok(false, err.message)
  }, function() {
    db.transaction(function(tx) {
      // create columns with no type affinity
      tx.executeSql("insert into test_table (data_text1, data_text2, data_int, data_real) VALUES (?,?,?,?)", ["314159", "3.14159", 314159, 3.14159], function(tx, res) {
        equal(res.rowsAffected, 1, "row inserted");
        tx.executeSql("select * from test_table", [], function(tx, res) {
          start();
          var row = res.rows.item(0);
          strictEqual(row.data_text1, "314159", "data_text1 should have inserted data as text");
          if (!/MSIE/.test(navigator.userAgent)) // JSON issue in WP(8) version
            strictEqual(row.data_text2, "3.14159", "data_text2 should have inserted data as text");
          strictEqual(row.data_int, 314159, "data_int should have inserted data as an integer");
          ok(Math.abs(row.data_real - 3.14159) < 0.000001, "data_real should have inserted data as a real");
        });
      });
    });
  });
});

// This test shows that the plugin does not throw an error when trying to serialize
// an unsupported parameter type. Blob becomes an empty dictionary on iOS, for example,
// and so this verifies the type is converted to a string and continues. Web SQL does
// the same but on the JavaScript side and converts to a string like `[object Blob]`.
if (typeof ArrayBuffer !== "undefined") test(suiteName + "unsupported parameter type as string", function() {
  // XXX TODO: investigate why this does not work for WP(8):
  if (/MSIE/.test(navigator.userAgent)) {
    ok(true, "SKIP for WP(8)");
    return;
  }
  var db = openDatabase("Blob-test.db", "1.0", "Demo", DEFAULT_SIZE);
  ok(!!db, "db object");
  stop(1);

  db.transaction(function(tx) {
    ok(!!tx, "tx object");

    var buffer = new ArrayBuffer(5);
    var view = new Uint8Array(buffer);
    view[0] = 'h'.charCodeAt();
    view[1] = 'e'.charCodeAt();
    view[2] = 'l'.charCodeAt();
    view[3] = 'l'.charCodeAt();
    view[4] = 'o'.charCodeAt();
    var blob = new Blob([view.buffer], {
      type: "application/octet-stream"
    });

    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (foo blob)');
    tx.executeSql('INSERT INTO test_table VALUES (?)', [blob], function(tx, res) {
      ok(true, "insert as string succeeds");
      start(1);
    });
    start(1);
  }, function(err) {
    ok(false, "transaction does not serialize real data but still should not fail: " + err.message);
    start(2);
  });
});

test(suiteName + "readTransaction should throw on modification", function() {
  stop();
  var db = openDatabase("Database-readonly", "1.0", "Demo", DEFAULT_SIZE);
  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (foo text)');
    tx.executeSql('INSERT INTO test_table VALUES ("bar")');
  }, function() {}, function() {
    db.readTransaction(function(tx) {
      tx.executeSql('SELECT * from test_table', [], function(tx, res) {
        equal(res.rows.length, 1);
        equal(res.rows.item(0).foo, 'bar');
      });
    }, function() {}, function() {
      var tasks;
      var numDone = 0;
      var failed = false;

      function checkDone() {
        if (++numDone === tasks.length) {
          start();
        }
      }

      function fail() {
          if (!failed) {
            failed = true;
            start();
            ok(false, 'readTransaction was supposed to fail');
          }
        }
        // all of these should throw an error
      tasks = [
        function() {
          db.readTransaction(function(tx) {
            tx.executeSql('DELETE from test_table');
          }, checkDone, fail);
        },
        function() {
          db.readTransaction(function(tx) {
            tx.executeSql('UPDATE test_table SET foo = "baz"');
          }, checkDone, fail);
        },
        function() {
          db.readTransaction(function(tx) {
            tx.executeSql('INSERT INTO test_table VALUES ("baz")');
          }, checkDone, fail);
        },
        function() {
          db.readTransaction(function(tx) {
            tx.executeSql('DROP TABLE test_table');
          }, checkDone, fail);
        },
        function() {
          db.readTransaction(function(tx) {
            tx.executeSql('CREATE TABLE test_table2');
          }, checkDone, fail);
        }
      ];
      for (var i = 0; i < tasks.length; i++) {
        tasks[i]();
      }
    });
  });
});

test(suiteName + ' test callback order', function() {
  stop();
  var db = openDatabase("Database-Callback-Order", "1.0", "Demo", DEFAULT_SIZE);
  var blocked = true;

  db.transaction(function(tx) {
    ok(!blocked, 'callback to the transaction shouldn\'t block (1)');
    tx.executeSql('SELECT 1 from sqlite_master', [], function() {
      ok(!blocked, 'callback to the transaction shouldn\'t block (2)');
    });
  }, function(err) {
    ok(false, err.message)
  }, function() {
    start();
    ok(!blocked, 'callback to the transaction shouldn\'t block (3)');
  });
  blocked = false;
});

test(suiteName + ' test simultaneous transactions', function() {
  stop();

  var db = openDatabase("Database-Simultaneous-Tx", "1.0", "Demo", DEFAULT_SIZE);

  var numDone = 0;

  function checkDone() {
    if (++numDone == 2) {
      start();
    }
  }

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test', [], function() {
      tx.executeSql('CREATE TABLE test (name);');

    });
  }, function(err) {
    ok(false, err.message)
  }, function() {
    db.transaction(function(tx) {
      tx.executeSql('INSERT INTO test VALUES ("foo")', [], function() {
        tx.executeSql('SELECT * FROM test', [], function(tx, res) {
          equal(res.rows.length, 1, 'only one row');
          equal(res.rows.item(0).name, 'foo');

          tx.executeSql('SELECT * FROM bogustable'); // force rollback
        });
      });
    }, function(err) {
      ok(true, 'expected error');
      checkDone();
    }, function() {
      ok(false, 'should have rolled back');
    });

    db.transaction(function(tx) {
      tx.executeSql('INSERT INTO test VALUES ("bar")', [], function() {
        tx.executeSql('SELECT * FROM test', [], function(tx, res) {
          equal(res.rows.length, 1, 'only one row');
          equal(res.rows.item(0).name, 'bar');

          tx.executeSql('SELECT * FROM bogustable'); // force rollback
        });
      });
    }, function(err) {
      ok(true, 'expected error');
      checkDone();
    }, function() {
      ok(false, 'should have rolled back');
    });
  });

});

test(suiteName + ' test undefined function', function() {
  stop();

  var db = openDatabase("Database-Undefined", "1.0", "Demo", DEFAULT_SIZE);

  try {
    db.transaction();
    ok(false, 'expected a synchronous error');
  } catch (err) {
    ok(!!err, 'got error like we expected');
  }

  // verify we can still continue
  db.transaction(function(tx) {
    tx.executeSql('SELECT 1 FROM sqlite_master', [], function(tx, res) {
      start();
      equal(res.rows.item(0)['1'], 1);
    });
  });
});

test(suiteName + ' test simultaneous transactions, different dbs', function() {
  stop();

  var dbName = "Database-Simultaneous-Tx-Diff-DBs";

  var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

  var numDone = 0;

  function checkDone() {
    if (++numDone == 2) {
      start();
    }
  }

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test', [], function() {
      tx.executeSql('CREATE TABLE test (name);');

    });
  }, function(err) {
    ok(false, err.message)
  }, function() {
    var db1 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
    db1.transaction(function(tx) {
      tx.executeSql('INSERT INTO test VALUES ("foo")', [], function() {
        tx.executeSql('SELECT * FROM test', [], function(tx, res) {
          equal(res.rows.length, 1, 'only one row');
          equal(res.rows.item(0).name, 'foo');

          tx.executeSql('SELECT * FROM bogustable'); // force rollback
        });
      });
    }, function(err) {
      ok(true, 'expected error');
      checkDone();
    }, function() {
      ok(false, 'should have rolled back');
    });

    var db2 = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

    db2.transaction(function(tx) {
      tx.executeSql('INSERT INTO test VALUES ("bar")', [], function() {
        tx.executeSql('SELECT * FROM test', [], function(tx, res) {
          equal(res.rows.length, 1, 'only one row');
          equal(res.rows.item(0).name, 'bar');

          tx.executeSql('SELECT * FROM bogustable'); // force rollback
        });
      });
    }, function(err) {
      ok(true, 'expected error');
      checkDone();
    }, function() {
      ok(false, 'should have rolled back');
    });
  });

});

if (!/MSIE/.test(navigator.userAgent)) test(suiteName + ' stores unicode correctly', function() {
  stop();

  var dbName = "Database-Unicode";
  var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test', [], function() {
      tx.executeSql('CREATE TABLE test (name, id)', [], function() {
        tx.executeSql('INSERT INTO test VALUES (?, "id1")', ['\u0000foo'], function() {
          tx.executeSql('SELECT hex(name) AS `hex` FROM test', [], function(tx, res) {
            // select hex() because even the native database doesn't
            // give the full string. it's a bug in WebKit apparently
            var hex = res.rows.item(0).hex;

            // varies between Chrome-like (UTF-8)
            // and Safari-like (UTF-16)
            var expected = [
              '000066006F006F00',
              '00666F6F'
            ];
            ok(expected.indexOf(hex) !== -1, 'hex matches: ' +
              JSON.stringify(hex) + ' should be in ' +
              JSON.stringify(expected));

            // ensure this matches our expectation of that database's
            // default encoding
            tx.executeSql('SELECT hex("foob") AS `hex` FROM sqlite_master', [], function(tx, res) {
              var otherHex = res.rows.item(0).hex;
              equal(hex.length, otherHex.length,
                'expect same length, i.e. same global db encoding');

              checkCorrectOrdering(tx);
            });
          })
        });
      });
    });
  }, function(err) {
    ok(false, 'unexpected error: ' + err.message);
  }, function() {});
});

function checkCorrectOrdering(tx) {
  var least = "54key3\u0000\u0000";
  var most = "54key3\u00006\u0000\u0000";
  var key1 = "54key3\u00004bar\u000031\u0000\u0000";
  var key2 = "54key3\u00004foo\u000031\u0000\u0000";

  tx.executeSql('INSERT INTO test VALUES (?, "id2")', [key1], function() {
    tx.executeSql('INSERT INTO test VALUES (?, "id3")', [key2], function() {
      var sql = 'SELECT id FROM test WHERE name > ? AND name < ? ORDER BY name';
      tx.executeSql(sql, [least, most], function(tx, res) {
        start();
        equal(res.rows.length, 2, 'should get two results');
        equal(res.rows.item(0).id, 'id2', 'correct ordering');
        equal(res.rows.item(1).id, 'id3', 'correct ordering');
      });
    });
  });
}

test(suiteName + "syntax error", function() {
  var db = openDatabase("Syntax-error-test.db", "1.0", "Demo", DEFAULT_SIZE);
  ok(!!db, "db object");

  stop(2);
  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

    // This insertion has a sql syntax error
    tx.executeSql("insert into test_table (data) VALUES ", [123], function(tx) {
      ok(false, "unexpected success");
      start();
      throw new Error('abort tx');
    }, function(tx, error) {
      ok(!!error, "valid error object");

      // XXX NOT WORKING for Android or WP(8) version of plugin:
      if (isWebSql || (!/Android/.test(navigator.userAgent) && !/MSIE/.test(navigator.userAgent)))
        ok(!!error['code'], "valid error.code exists");

      ok(error.hasOwnProperty('message'), "error.message exists");
      // XXX NOT WORKING for Android or WP(8) version of plugin:
      if (isWebSql || (!/Android/.test(navigator.userAgent) && !/MSIE/.test(navigator.userAgent)))
        strictEqual(error.code, 5, "error.code === SQLException.SYNTAX_ERR (5)");
      //equal(error.message, "Request failed: insert into test_table (data) VALUES ,123", "error.message");
      start();

      // We want this error to fail the entire transaction
      return true;
    });
  }, function(error) {
    ok(!!error, "valid error object");
    ok(error.hasOwnProperty('message'), "error.message exists");
    start();
  });
});

test(suiteName + "constraint violation", function() {
  var db = openDatabase("Constraint-violation-test.db", "1.0", "Demo", DEFAULT_SIZE);
  ok(!!db, "db object");

  stop(2);
  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (data unique)');

    tx.executeSql("insert into test_table (data) VALUES (?)", [123], null, function(tx, error) {
      ok(false, error.message);
    });

    // This insertion will violate the unique constraint
    tx.executeSql("insert into test_table (data) VALUES (?)", [123], function(tx) {
      ok(false, "unexpected success");
      ok(!!res['rowsAffected'] || !(res.rowsAffected >= 1), "should not have positive rowsAffected");
      start();
      throw new Error('abort tx');
    }, function(tx, error) {
      ok(!!error, "valid error object");

      // XXX NOT WORKING for Android or WP(8) version of plugin:
      if (isWebSql || (!/Android/.test(navigator.userAgent) && !/MSIE/.test(navigator.userAgent)))
        ok(!!error['code'], "valid error.code exists");

      ok(error.hasOwnProperty('message'), "error.message exists");
      //strictEqual(error.code, 6, "error.code === SQLException.CONSTRAINT_ERR (6)");
      //equal(error.message, "Request failed: insert into test_table (data) VALUES (?),123", "error.message");
      start();

      // We want this error to fail the entire transaction
      return true;
    });
  }, function(error) {
    ok(!!error, "valid error object");
    ok(error.hasOwnProperty('message'), "error.message exists");
    start();
  });
});

test(suiteName + ' can open two databases at the same time', function() {
  // create databases and tables
  var db1 = openDatabase("DB1", "1.0", "Demo", DEFAULT_SIZE);
  db1.transaction(function(tx1) {
    tx1.executeSql('CREATE TABLE IF NOT EXISTS test1 (x int)');
  });


  var db2 = openDatabase("DB2", "1.0", "Demo", DEFAULT_SIZE);
  db2.transaction(function(tx2) {
    tx2.executeSql('CREATE TABLE IF NOT EXISTS test2 (x int)');
  });

  // two databases that perform two queries and one commit each, then repeat
  stop(12);

  // create overlapping transactions
  db1.transaction(function(tx1) {
    db2.transaction(function(tx2) {

      tx2.executeSql('INSERT INTO test2 VALUES (2)', [], function(tx, result) {
        ok(true, 'inserted into second database');
        start(1);
      });
      tx2.executeSql('SELECT * from test2', [], function(tx, result) {
        equal(result.rows.item(0).x, 2, 'selected from second database');
        start(1);
      });
    }, function(error) {
      ok(false, 'transaction 2 failed ' + error);
      start(1);
    }, function() {
      ok(true, 'transaction 2 committed');
      start(1);
    });

    tx1.executeSql('INSERT INTO test1 VALUES (1)', [], function(tx, result) {
      ok(true, 'inserted into first database');
      start(1);
    });

    tx1.executeSql('SELECT * from test1', [], function(tx, result) {
      equal(result.rows.item(0).x, 1, 'selected from first database');
      start(1);
    });
  }, function(error) {
    ok(false, 'transaction 1 failed ' + error);
    start(1);
  }, function() {
    ok(true, 'transaction 1 committed');
    start(1);
  });

  // now that the databases are truly open, do it again!
  db1.transaction(function(tx1) {
    db2.transaction(function(tx2) {

      tx2.executeSql('INSERT INTO test2 VALUES (2)', [], function(tx, result) {
        ok(true, 'inserted into second database');
        start(1);
      });
      tx2.executeSql('SELECT * from test2', [], function(tx, result) {
        equal(result.rows.item(0).x, 2, 'selected from second database');
        start(1);
      });
    }, function(error) {
      ok(false, 'transaction 2 failed ' + error);
      start(1);
    }, function() {
      ok(true, 'transaction 2 committed');
      start(1);
    });

    tx1.executeSql('INSERT INTO test1 VALUES (1)', [], function(tx, result) {
      ok(true, 'inserted into first database');
      start(1);
    });

    tx1.executeSql('SELECT * from test1', [], function(tx, result) {
      equal(result.rows.item(0).x, 1, 'selected from first database');
      start(1);
    });
  }, function(error) {
    ok(false, 'transaction 1 failed ' + error);
    start(1);
  }, function() {
    ok(true, 'transaction 1 committed');
    start(1);
  });
});

test(suiteName + 'Multiple updates with key', function() {
  var db = openDatabase("MultipleUpdatesWithKey", "1.0",
    "Demo", DEFAULT_SIZE);

  stop();

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS Task');
    tx.executeSql('CREATE TABLE IF NOT EXISTS Task (id primary key, subject)');
    tx.executeSql('INSERT INTO Task VALUES (?,?)', ['928238b3-a227-418f-aa15-12bb1943c1f2', 'test1']);
    tx.executeSql('INSERT INTO Task VALUES (?,?)', ['511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2', 'test2']);

    tx.executeSql('UPDATE Task SET subject="Send reminder", id="928238b3-a227-418f-aa15-12bb1943c1f2" WHERE id = "928238b3-a227-418f-aa15-12bb1943c1f2"', [], function(tx, res) {
      equal(res.rowsAffected, 1);
    }, function(error) {
      ok(false, '1st update failed ' + error);
    });

    tx.executeSql('UPDATE Task SET subject="Task", id="511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2" WHERE id = "511e3fb7-5aed-4c1a-b1b7-96bf9c5012e2"', [], function(tx, res) {
      equal(res.rowsAffected, 1);
    }, function(error) {
      ok(false, '2nd update failed ' + error);
    });
  }, function(error) {
    ok(false, 'transaction failed ' + error);
    start(1);
  }, function() {
    ok(true, 'transaction committed ok');
    start(1);
  });
});

if (!isWebSql) test(suiteName + "DB String result test", function() {
  var db = openDatabase("String-test.db", "1.0", "Demo", DEFAULT_SIZE);

  var expected = ['FIRST', 'SECOND'];
  var i = 0;

  ok(!!db, "db object");

  stop(2);

  var okcb = function(res) {
    if (i > 1) {
      ok(false, "unexpected result: " + JSON.stringify(res));
      console.log("discarding unexpected result: " + JSON.stringify(res))
      return;
    }

    ok(!!res, "valid object");

    // do not count res if undefined:
    if (!!res) { // will freeze the test if res is undefined:
      console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);
      equal(res.rows.item(0).uppertext, expected[i], "Check result " + i);
      i++;
      start(1);
    }
  };

  db.executeSql("select upper('first') as uppertext", [], okcb);
  db.executeSql("select upper('second') as uppertext", [], okcb);
});

if (!isWebSql) test(suiteName + "PRAGMAs & multiple databases", function() {
  var db = openDatabase("DB1", "1.0", "Demo", DEFAULT_SIZE);

  var db2 = openDatabase("DB2", "1.0", "Demo", DEFAULT_SIZE);

  db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)', [], function() {
      console.log("test_table created");
    });

    stop();
    db.executeSql("pragma table_info (test_table);", [], function(res) {
      start();
      console.log("PRAGMA res: " + JSON.stringify(res));
      equal(res.rows.item(2).name, "data_num", "DB1 table number field name");
    });
  });

  stop(2);
  db2.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS tt2');
    tx.executeSql('CREATE TABLE IF NOT EXISTS tt2 (id2 integer primary key, data2 text, data_num2 integer)', [], function() {
      console.log("tt2 created");
    });

    db.executeSql("pragma table_info (test_table);", [], function(res) {
      start();
      console.log("PRAGMA (db) res: " + JSON.stringify(res));
      equal(res.rows.item(0).name, "id", "DB1 table key field name");
      equal(res.rows.item(1).name, "data", "DB1 table text field name");
      equal(res.rows.item(2).name, "data_num", "DB1 table number field name");
    });

    db2.executeSql("pragma table_info (tt2);", [], function(res) {
      start();
      console.log("PRAGMA (tt2) res: " + JSON.stringify(res));
      equal(res.rows.item(0).name, "id2", "DB2 table key field name");
      equal(res.rows.item(1).name, "data2", "DB2 table text field name");
      equal(res.rows.item(2).name, "data_num2", "DB2 table number field name");
    });
  });
});

if (!isWebSql) test(suiteName + ' test sqlitePlugin.deleteDatabase()', function() {

  stop();
  var db = openDatabase("DB-Deletable", "1.0", "Demo", DEFAULT_SIZE);

  function createAndInsertStuff() {

    db.transaction(function(tx) {
      tx.executeSql('DROP TABLE IF EXISTS test');
      tx.executeSql('CREATE TABLE IF NOT EXISTS test (name)', [], function() {
        tx.executeSql('INSERT INTO test VALUES (?)', ['foo']);
      });
    }, function(e) {
      ok(false, 'error: ' + e);
    }, function() {
      // check that we can read it
      db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM test', [], function(tx, res) {
          equal(res.rows.item(0).name, 'foo');
        });
      }, function(e) {
        ok(false, 'error: ' + e);
      }, function() {
        deleteAndConfirmDeleted();
      });
    });
  }

  function deleteAndConfirmDeleted() {

    window.sqlitePlugin.deleteDatabase("DB-Deletable", function() {

      // check that the data's gone
      db.transaction(function(tx) {
        tx.executeSql('SELECT name FROM test', []);
      }, function(e) {
        ok(true, 'got an expected transaction error');
        testDeleteError();
      }, function() {
        ok(false, 'expected a transaction error');
      });
    }, function(e) {
      ok(false, 'error: ' + e);
    });
  }

  function testDeleteError() {
    // should throw an error if the db doesn't exist
    window.sqlitePlugin.deleteDatabase("Foo-Doesnt-Exist", function() {
      ok(false, 'expected error');
    }, function(err) {
      start();
      ok(!!err, 'got error like we expected');
    });
  }

  createAndInsertStuff();
});

if (!isWebSql) test(suiteName + ' database.open calls its success callback', function() {

  // asynch test coming up
  stop(1);

  var dbName = "Database-Open-callback";
  openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function(db) {
    ok(true, 'expected close success callback to be called after database is closed');
    start(1);
  }, function(error) {
    ok(false, 'expected close error callback not to be called after database is closed');
    start(1);
  });
});

if (!isWebSql) test(suiteName + ' database.close calls its success callback', function() {

  // asynch test coming up
  stop(1);

  var dbName = "Database-Close-callback";
  var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);

  // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
  db.close(function() {
    ok(true, 'expected close success callback to be called after database is closed');
    start(1);
  }, function(error) {
    ok(false, 'expected close error callback not to be called after database is closed');
    start(1);
  });
});

if (!isWebSql) test(suiteName + ' database.close fails in transaction', function() {
  stop(1);

  var dbName = "Database-Close-fail";
  //var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
  var db = openDatabase({
    name: dbName,
    location: 1
  });

  db.readTransaction(function(tx) {
    tx.executeSql('SELECT 1', [], function(tx, results) {
      // close database - need to run tests directly in callbacks as nothing is guarenteed to be queued after a close
      db.close(function() {
        ok(false, 'expect close to fail during transaction');
        start(1);
      }, function(error) {
        ok(true, 'expect close to fail during transaction');
        start(1);
      });
      start(1);
    }, function(error) {
      ok(false, error);
      start(2);
    });
  }, function(error) {
    ok(false, error);
    start(2);
  });
});

// XXX TODO same db name, different location [BROKEN]

if (!isWebSql) test(suiteName + ' open same database twice [same location] works', function() {

  stop(2);

  var dbName = 'open-twice';

  var db1 = openDatabase({
    name: dbName,
    location: 2
  }, function() {
    var db2 = openDatabase({
      name: dbName,
      location: 2
    }, function() {
      db1.readTransaction(function(tx1) {
        tx1.executeSql('SELECT 1', [], function(tx1d, results) {
          ok(true, 'db1 transaction working');
          start(1);
        }, function(error) {
          ok(false, error);
        });
      }, function(error) {
        ok(false, error);
      });
      db2.readTransaction(function(tx2) {
        tx2.executeSql('SELECT 1', [], function(tx2d, results) {
          ok(true, 'db2 transaction working');
          start(1);
        }, function(error) {
          ok(false, error);
        });
      }, function(error) {
        ok(false, error);
      });
    }, function(error) {
      ok(false, error);
    });
  }, function(error) {
    ok(false, error);
  });
});

if (!isWebSql) test(suiteName + ' close then re-open allows subsequent queries to run', function() {

  // asynch test coming up
  stop(1);

  var dbName = "Database-Close-and-Reopen";
  openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function(db) {
    db.close(function() {
      openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function(db) {
        db.close(function() {
          openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function(db) {
            db.readTransaction(function(tx) {
              tx.executeSql('SELECT 1', [], function(tx, results) {
                ok(true, 'database re-opened succesfully');
                start(1);
              }, function(error) {
                ok(false, error.message);
                start(1);
              });
            }, function(error) {
              ok(false, error.message);
              start(1);
            }, function(tx) {
              // close on transaction success not while executing
              // or commit will fail
              db.close();
            });
          }, function(error) {
            ok(false, error.message);
            start(1);
          });
        }, function(error) {
          ok(false, error.message);
          start(1);
        });
      }, function(error) {
        ok(false, error.message);
        start(1);
      });
    }, function(error) {
      ok(false, error.message);
      start(1);
    });
  }, function(error) {
    ok(false, error.message);
    start(1);
  });
});

if (!isWebSql) test(suiteName + ' delete then re-open allows subsequent queries to run', function() {

  // asynch test coming up
  stop(1);

  var dbName = "Database-delete-and-Reopen";
  var dbLocation = 2;
  var db = openDatabase({
    name: dbName,
    location: dbLocation
  }, function() {
    // success CB
    window.sqlitePlugin.deleteDatabase({
      name: dbName,
      location: dbLocation
    }, function() {
      db = openDatabase({
        name: dbName,
        location: dbLocation
      }, function() {
        db.readTransaction(function(tx) {
          tx.executeSql('SELECT 1', [], function(tx, results) {
            ok(true, 'database re-opened succesfully');
            start(1);
          }, function(error) {
            ok(false, error);
            start(1);
          }, function(error) {
            ok(false, error);
            start(1);
          });
        }, function(error) {
          ok(false, error);
          start(1);
        });
      }, function(error) {
        ok(false, error);
        start(1);
      });
    }, function(error) {
      ok(false, error);
      start(1);
    });
  }, function(error) {
    ok(false, error);
    start(1);
  });
});

if (!isWebSql) test(suiteName + ' close, then delete then re-open allows subsequent queries to run', function() {

  // asynch test coming up
  stop(1);

  var dbName = "Database-Close-delete-Reopen";
  var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
  db.close(function() {
    window.sqlitePlugin.deleteDatabase(dbName, function() {
      db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE, function() {
        db.readTransaction(function(tx) {
          tx.executeSql('SELECT 1', [], function() {
            ok(true, 'database re-opened succesfully');
            start(1);
          }, function(e) {
            ok(false, 'error: ' + e);
            start(1);
          });
        }, function(e) {
          ok(false, 'error: ' + e);
          start(1);
        });
      }, function(e) {
        ok(false, 'error: ' + e);
        start(1);
      });
    }, function(e) {
      ok(false, 'error: ' + e);
      start(1);
    });
  }, function(e) {
    ok(false, 'error: ' + e);
    start(1);
  });
});

if (!isWebSql) test(suiteName + ' repeatedly open and delete database succeeds', function() {

  // asynch test coming up
  stop(5);

  var dbName = "repeatedly-open-and-delete";

  var db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
  window.sqlitePlugin.deleteDatabase(dbName, function() {

    db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
    window.sqlitePlugin.deleteDatabase(dbName, function() {

      db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
      window.sqlitePlugin.deleteDatabase(dbName, function() {

        db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
        window.sqlitePlugin.deleteDatabase(dbName, function() {

          db = openDatabase(dbName, "1.0", "Demo", DEFAULT_SIZE);
          window.sqlitePlugin.deleteDatabase(dbName, function() {
            ok(true, 'success 5/5');

            start(1);
          }, function(error) {
            ok(false, 'expected delete 5/5 error callback not to be called for an open database' + error);
            start(1);
          });

          start(1);
        }, function(error) {
          ok(false, 'expected delete 4/5 error callback not to be called for an open database' + error);
          start(1);
        });

        start(1);
      }, function(error) {
        ok(false, 'expected delete 3/5 error callback not to be called for an open database' + error);
        start(1);
      });

      start(1);
    }, function(error) {
      ok(false, 'expected delete 2/5 error callback not to be called for an open database' + error);
      start(1);
    });

    start(1);
  }, function(error) {
    ok(false, 'expected delete 1/5 error callback not to be called for an open database' + error);
    start(5);
  });
});