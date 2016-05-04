var hooks = require('hooks');
var request = require('superagent');
var _ = require('lodash');

var stash = {};

var authenticateTransaction = function (transaction) {
  transaction.request['headers']['Cookie'] = stash['token'];
}

hooks.beforeAll(function(transaction, done) {
  request
  .get('http://192.168.2.225/vts-ed-rest-api/secured/login')
  .auth('admin', 'admin')
  .end(function(err, res) {
    if (err) {
      transaction.fail = err;
      return;
    }
    stash['token'] = res.header['set-cookie'][0].split(';')[0];
  
    done();  
  })
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
      return;
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
      return;
    }
    
    done();
  });
});


// set authentication token (cookie) on actions that require authentication
[
  "Profiles > Profile > Update Profile",
  "Profiles > Profile > Dismiss Profile"
].map(function(action) {
  hooks.before(action, authenticateTransaction);
});
