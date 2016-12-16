/* eslint-env browser */
/* global Token, api, rempl */

// extend api
api.remoteSubscribers = new Token(0);
api.remoteInspectors = api.remoteSubscribers; // deprecated
api.getRemoteUrl = function() {
    return location.protocol + '//' + location.host + '/basisjs-tools/devtool/';
};
api.initRemoteDevtoolAPI = function() {
    console.warn('initRemoteDevtoolAPI() method is deprecated, use initRemotePublisher() instead');
};

api.initRemotePublisher = rempl.createPublisher;
