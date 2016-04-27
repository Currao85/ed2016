var hooks = require('hooks');
var request = require('superagent');

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

hooks.before("Profiles > Profile > Update Profile", login);
