'use strict';

const DirectChannel = require('../direct-channel');

class DirectTransport {
  constructor() {
    this.directChannel = null;
  }
  activate(agentName) {
    this.directChannel = DirectChannel.getChannel(agentName);
  }
  on(tag, handler) {
    this.directChannel.listenForTransport(tag, handler);
  }
  once(tag, handler) {
    this.directChannel.listenOnceForTransport(tag, handler);
  }
  send(tag, data) {
    this.directChannel.sendFromTransport(tag, data);
  }
}

module.exports = DirectTransport;
