'use strict';

class ForkReceiver {
  constructor(childProcess) {
    this.childProcess = childProcess;
    this.masterHandler = null;
  }
  startListen(masterHandler) {
    this.masterHandler = masterHandler;
    this.childProcess.on('message', this.onMessage.bind(this));
  }
  onMessage(msg) {
    if (this.masterHandler === null)
      return;
    const { tag, data } = msg;
    this.masterHandler(this, this.reply.bind(this), tag, data);
  }
  reply(tag, data) {
    this.childProcess.send({ tag, data });
  }
}

module.exports = ForkReceiver;
