var Dredd = require('dredd');

var dredd = new Dredd({
  server: 'http://192.168.2.225/vts-ed-rest-api', // your URL to API endpoint the tests will run against
  options: {

    'path': ['apiary.apib'],       // Required Array if Strings; filepaths to API Blueprint files, can use glob wildcards

    'dry-run': false, // Boolean, do not run any real HTTP transaction
    'names': false,   // Boolean, Print Transaction names and finish, similar to dry-run

    'level': 'info', // String, log-level (info, silly, debug, verbose, ...)
    'silent': false, // Boolean, Silences all logging output

    'only': [],      // Array of Strings, run only transaction that match these names

    'header': [],    // Array of Strings, these strings are then added as headers (key:value) to every transaction
    'user': null,    // String, Basic Auth credentials in the form username:password

    'reporter': ['junit', 'apiary'], // Array of possible reporters, see folder src/reporters

    'inline-errors': true, // Boolean, If failures/errors are display immediately in Dredd run

    'color': true,
    'timestamp': false,
    'hookfiles': ['./hooks/*.js']
  },
});

dredd.run(function(err, stats) {
  if (err) return JSON.stringify(err, 2);
  JSON.stringify(stats, 2);
});
