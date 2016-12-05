/* eslint-env browser */
/* global basis */

var initApp = basis.fn.runOnce(function(){
  require('basis.app').create(require('./ui/index.js'));
});

basis.ready(function start(){
  if (typeof io === 'undefined')
    return setTimeout(start, 50);

  require('./transport.js').online.link(null, function(online){
    if (online)
      initApp();
  });
});
