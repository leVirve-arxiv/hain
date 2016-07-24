'use strict';

const DirectChannel = require('../direct-channel');

class DirectReceiver {
  constructor(targetAgent) {
    this.masterHandler = null;
    this.directChannel = null;
    this.targetAgent = targetAgent;
  }
  startListen(masterHandler) {
    this.masterHandler = masterHandler;
    this.directChannel = DirectChannel.getChannel(this.targetAgent);
    this.directChannel.listenForReceiver(this.onMessage.bind(this));
  }
  onMessage(msg) {
    if (this.masterHandler === null)
      return;
    const { tag, data } = msg;
    this.masterHandler(this, this.reply.bind(this), tag, data);
  }
  reply(tag, data) {
    this.directChannel.sendFromReceiver(tag, data);
  }
}

module.exports = DirectReceiver;
