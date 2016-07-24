'use strict';

const ipcMain = require('electron').ipcMain;

class RendererReceiver {
  constructor(targetAgent) {
    this.targetAgent = targetAgent;
    this.masterHandler = null;
    this.ipcTag = `ipc:${targetAgent}`;
    this.replySender = null;
  }
  startListen(masterHandler) {
    this.masterHandler = masterHandler;
    ipcMain.on(this.ipcTag, this.onMessage.bind(this));
  }
  onMessage(event, arg) {
    const { tag, data } = arg;
    this.replySender = event.sender;
    this.masterHandler(this, this.reply.bind(this), tag, data);
  }
  reply(tag, data) {
    this.replySender.send(this.ipcTag, { tag, data });
  }
}

module.exports = RendererReceiver;
