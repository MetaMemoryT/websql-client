/* globals test, ok, stop, start, equal */
/*jshint unused:false*/
function stringTests(suiteName, dbsize, openDatabase) {
  test(suiteName + "US-ASCII String test", function() {

    var db = openDatabase("String-test.db", "1.0", "Demo", dbsize);

    ok(!!db, "db object");

    stop(2);

    db.transaction(function(tx) {

      start(1);
      ok(!!tx, "tx object");

      tx.executeSql(
        "select upper('Some US-ASCII text') as uppertext", [],
        function(tx, res) {
          start(1);

          console.log("res.rows.item(0).uppertext: " +
            res.rows.item(0).uppertext);

          equal(res.rows.item(0).uppertext,
            "SOME US-ASCII TEXT", "select upper('Some US-ASCII text')");
        });
    });
  });
}