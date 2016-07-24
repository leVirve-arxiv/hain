'use strict';

class ForkTransport {
  constructor(processObject) {
    this.processObject = processObject;
    this.listeners = {};
    this.onceListeners = {};
  }
  activate() {
    this.processObject.on('message', this.onMessage.bind(this));
  }
  on(tag, handler) {
    this.listeners[tag] = handler;
  }
  once(tag, handler) {
    this.onceListeners[tag] = handler;
  }
  send(tag, data) {
    this.processObject.send({ tag, data });
  }
  onMessage(msg) {
    const { tag, data } = msg;
    const listener = this.listeners[tag];
    const onceListener = this.onceListeners[tag];
    if (listener)
      listener(data);

    if (onceListener) {
      onceListener(data);
      delete this.onceListeners[tag];
    }
  }
}

module.exports = ForkTransport;
