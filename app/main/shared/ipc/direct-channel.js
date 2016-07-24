'use strict';

const channels = {};

class DirectChannel {
  constructor() {
    this.receiverListener = null;
    this.transportListeners = {};
    this.transportOnceListeners = {};
  }
  listenForReceiver(listener) {
    this.receiverListener = listener;
  }
  listenForTransport(tag, listener) {
    this.transportListeners[tag] = listener;
  }
  listenOnceForTransport(tag, listener) {
    this.transportOnceListeners[tag] = listener;
  }
  sendFromReceiver(tag, data) {
    const listener = this.transportListeners[tag];
    if (listener)
      listener(data);

    const onceListener = this.transportOnceListeners[tag];
    if (onceListener) {
      onceListener(data);
      delete this.transportOnceListeners[tag];
    }
  }
  sendFromTransport(tag, data) {
    this.receiverListener({ tag, data });
  }
}

module.exports = {
  getChannel: (channelName) => {
    let channel = channels[channelName];
    if (channel !== undefined)
      return channel;

    channel = new DirectChannel();
    channels[channelName] = channel;
    return channel;
  }
};
