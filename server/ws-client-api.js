/* eslint-env browser */
/* global Token, api, socket */

var STORAGE_KEY = 'rempl-clientId';
var document = global.document;
var documentStyleOverflow;
var sessionStorage = global.sessionStorage || {};
var clientId = sessionStorage[STORAGE_KEY];
var sessionId = genUID();
var observersEl = document.createElement('div');
var overlayEl = createOverlay();
var pickObserverCallback;
var features = [];
var observers = [];
var observersMap = {};
var clientInfo = getSelfInfo();
var sendInfoTimer;

function genUID(len){
  function base36(val){
    return Math.round(val).toString(36);
  }

  // uid should starts with alpha
  var result = base36(10 + 25 * Math.random());

  if (!len)
    len = 16;

  while (result.length < len)
    result += base36(new Date * Math.random());

  return result.substr(0, len);
}

function getSelfInfo(){
  return {
    type: 'browser',
    clientId: clientId,
    sessionId: sessionId,
    title: global.top.document.title,
    location: String(location),
    features: features.slice(),
    observers: observers.slice()
  };
}

function sendInfo(){
  var newClientInfo = getSelfInfo();
  if (clientInfo.title != newClientInfo.title ||
      clientInfo.location != newClientInfo.location ||
      String(clientInfo.features) != String(newClientInfo.features) ||
      String(clientInfo.observers) != String(newClientInfo.observers)) {
    clientInfo = newClientInfo;
    socket.emit('devtool:client info', getSelfInfo());
  }
}

function createOverlay(){
  var tmp = document.createElement('div');
  tmp.innerHTML =
    '<div style="position:fixed;overflow:auto;top:0;left:0;bottom:0;right:0;z-index:100000000;background:rgba(255,255,255,.9);text-align:center;line-height:1.5;font-family:Tahoma,Verdana,Arial,sans-serif">' +
       '<div style="font-size:100px;font-size:33vh">#</div>' +
    '</div>';
  tmp.firstChild.appendChild(observersEl);
  return tmp.firstChild;
}

function createButton(name, callback){
  var temp = document.createElement('div');
  temp.innerHTML =
  '<div style="margin-bottom: 5px;"><button style="font-size:18px;line-height:1;padding:12px 24px;background:#3BAFDA;color:white;border:none;border-radius:3px;cursor:pointer;">' +
    name +
  '</button></div>';
  temp.firstChild.firstChild.onclick = callback;
  return temp.firstChild;
}
function updateObserverList(){
  if (observers.length && pickObserverCallback)
  {
    observersEl.innerHTML = '<div style="margin-bottom: 10px">Pick an observer:</div>';
    for (var i = 0; i < observers.length; i++)
      observersEl.appendChild(createButton(observers[i], pickObserverCallback.bind(null, observers[i])));
  }
  else
    observersEl.innerHTML = '<div style="color:#AA0000">No rempl observers inited</div>';
}

function startIdentify(num, callback){
  overlayEl.firstChild.innerHTML = num;
  pickObserverCallback = callback;
  updateObserverList();
  documentStyleOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.appendChild(overlayEl);
}
function stopIdentify(){
  pickObserverCallback = null;
  if (overlayEl.parentNode !== document.body)
    return;

  document.body.style.overflow = documentStyleOverflow;
  document.body.removeChild(overlayEl);
}

function startSyncClient(){
  clearInterval(sendInfoTimer);
  clientInfo = getSelfInfo();
  socket.emit('devtool:client connect', clientInfo, function(data){
    if ('clientId' in data)
      clientId = sessionStorage[STORAGE_KEY] = data.clientId;

    api.remoteCustomers.set(data.customers || 0);

    sendInfoTimer = setInterval(sendInfo, 150);
  });
}

// socket messages
socket
  .on('devtool:identify', startIdentify)
  .on('devtool:stop identify', stopIdentify)
  .on('devtool:customer count changed', function(count){
    api.remoteCustomers.set(count);
  })
  .on('devtool:get ui', function(id, settings, callback){
    if (!observersMap.hasOwnProperty(id))
    {
      console.error('[rempl][ws-transport] Observer `' + id + '` isn\'t registered on page');
      callback('[rempl][ws-transport] Observer `' + id + '` isn\'t registered on page');
      return;
    }

    observersMap[id].getRemoteUI.call(null, settings, callback);
  })
  .on('devtool:to session', function(id){
    if (!observersMap.hasOwnProperty(id))
    {
      console.error('[rempl][ws-transport] Observer `' + id + '` isn\'t registered on page');
      return;
    }

    var subscribers = observersMap[id].subscribers;
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < subscribers.length; i++)
      subscribers[i].apply(null, args);
  })
  .on('connect', startSyncClient)
  .on('disconnect', function(){
    api.remoteCustomers.set(0);
    clearInterval(sendInfoTimer);
    stopIdentify();
  });

if (socket.connected)
  startSyncClient();

// extend api
api.remoteCustomers = new Token(0);
api.remoteInspectors = api.remoteCustomers; // deprecated
api.getRemoteUrl = function(){
  return location.protocol + '//' + location.host + '/basisjs-tools/devtool/';
};
api.initRemoteDevtoolAPI = function(){
  console.warn('initRemoteDevtoolAPI() method is deprecated, use initRemoteObserver() instead');
};

api.initRemoteObserver = function(id, getRemoteUI){
  var subscribers = [];

  if (observersMap.hasOwnProperty(id))
  {
    console.error('[rempl][ws-transport] Observer `' + id + '` already registered on page');
    return;
  }

  observers.push(id);
  observersMap[id] = {
    getRemoteUI: getRemoteUI,
    subscribers: subscribers
  };

  updateObserverList();
  sendInfo();

  return {
    connected: api.remoteCustomers,
    getRemoteUrl: function(){
      return clientId
        ? api.getRemoteUrl() + '#' + clientId + '/' + id
        : '';
    },
    setFeatures: function(list){
      features = Array.prototype.slice.call(list || []);
      sendInfo();
    },
    send: function(){
      socket.emit.apply(socket, ['devtool:client data', id].concat(
        Array.prototype.slice.call(arguments)
      ));
    },
    subscribe: function(fn){
      subscribers.push(fn);
    }
  };
};
