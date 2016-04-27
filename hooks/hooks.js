var hooks = require('hooks');
var request = require('superagent');
var _ = require('lodash');

var stash = {};

var login = function (transaction, done) {  
  request
  .get('http://192.168.2.225/vts-ed-rest-api/secured/login')
  .auth('admin', 'admin')
  .end(function(err, res) {
    if (err) {
      transaction.fail = err;
      return;
    }
    stash['token'] = res.header['set-cookie'][0].split(';')[0];
    transaction.request['headers']['Cookie'] = stash['token'];
  
    done();  
  })
}

hooks.before("Profiles > Profiles collections > List Vendor Profiles", function(transaction, done) {
  // we have to remove the 'report' parameter or we'll receive binary data
  var params = transaction.fullPath.split('&');
  // the 'report' parameter is currently the last one
  transaction.fullPath = params.splice(0, params.length - 1).join('&');
  done();
});

hooks.before("Profiles > Profile > Update Profile", login);
