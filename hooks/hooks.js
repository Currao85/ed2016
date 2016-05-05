var hooks = require('hooks');
var request = require('superagent');
var _ = require('lodash');

var authId = "admin";
var authPwd = authId;
var authProfileId = 2534; // id of the user used to authenticated
var stash = {};

var authenticateTransaction = function (transaction) {
  transaction.request['headers']['Cookie'] = stash['token'];
}

var randomUserId = function() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}

hooks.beforeAll(function(transaction, done) {
  request
  .get('http://192.168.2.225/vts-ed-rest-api/secured/login')
  .auth(authId, authPwd)
  .end(function(err, res) {
    if (err) {
      transaction.fail = err;
    }
    stash['token'] = res.header['set-cookie'][0].split(';')[0];
  
    done();  
  })
});

hooks.before("Profiles > Profiles collections > Create Profile", function(transaction, done) {
  // we create a random user id instead of the one specified 
  // in API docs, in order to avoid duplicates
  var body = JSON.parse(transaction.request.body);
  body.userId = randomUserId();
  transaction.request.body = JSON.stringify(body);
  done();
});

hooks.before("Profiles > Profiles collections > List Profiles", function(transaction, done) {
  // we have to remove the 'report' parameter or we'll receive binary data
  var params = transaction.fullPath.split('&');
  // the 'report' parameter is currently the last one
  transaction.fullPath = params.splice(0, params.length - 1).join('&');
  done();
});

hooks.before("Profiles > Profiles collections > List Vendor Profiles", function(transaction, done) {
  // we have to remove the 'report' parameter or we'll receive binary data
  var params = transaction.fullPath.split('&');
  // the 'report' parameter is currently the last one
  transaction.fullPath = params.splice(0, params.length - 1).join('&');
  done();
});

// run this before Gavel validation of the response cause we want to reset 
// the password to the previous value no matter what was the response
hooks.beforeValidation("Profiles > Profiles collections > Change Password", function(transaction, done) {
  // set password to old value
  request
  .put('http://192.168.2.225/vts-ed-rest-api/profiles/password')
  .send({userId: "vtstest", currentPassword: "vtstest2", newPassword: "vtstest"}).end(function(err, res) {
    if (err) {
      transaction.fail = err;
      hooks.log(err);
    }
    
    done();
  });
});

// re-enable user profile after 
hooks.after("Profiles > Profile > Dismiss Profile", function(transaction, done) {
  request
  .put('http://192.168.2.225/vts-ed-rest-api/profiles/1/dismiss')
  .set('Cookie', stash['token'])
  .send({date: null}).end(function(err, res) {
    if (err) {
      transaction.fail = err;
      hooks.log(err);
    }
    
    done();
  });
});

// delete a newly created profile instead of the one specified in the API
hooks.before("Profiles > Profile > Delete Profile", function(transaction, done) {
  request
  .post('http://192.168.2.225/vts-ed-rest-api/profiles')
  .set('Cookie', stash['token'])
  .send({
    firstName: "MARIO",
    lastName: "BIANCHI",
    email: "mbianchi@acme.it",
    personalCode: "X123456",
    userId: randomUserId(),
    employeeType: "MAI",
    bluePageCode: "L123456",
    hiringDate: "2016-02-28",
    dismissDate: "2099-12-31"
  }).end(function(err, res) {
    if (err) {
      transaction.fail = err;
      hooks.log(err);
    }
    
    // change the last parth of the URI (the id) with 
    // the id of the generated profile
    var uriParts = transaction.fullPath.split('/');
    transaction.fullPath = transaction.fullPath.replace(/\d+/, res.body.id);
    
    done();
  });
});

hooks.before("Profiles > User personal Profile > Update Profile", function(transaction, done) {
  // we have to make sure that the updated profile has the same userId, 
  // or the admin user will 'lose' his profile
  var body = JSON.parse(transaction.request.body);
  body.userId = authId;
  body.id = authProfileId;
  transaction.request.body = JSON.stringify(body);
  done();
});

// set authentication token (cookie) on actions that require authentication
[
  "Profiles > Profiles collections > Create Profile",
  "Profiles > Profile > Update Profile",
  "Profiles > Profile > Dismiss Profile",
  "Profiles > Profile > Delete Profile",
  "Profiles > User personal Profile > Read Profile",
  "Profiles > User personal Profile > Update Profile"
].map(function(action) {
  hooks.before(action, authenticateTransaction);
});
