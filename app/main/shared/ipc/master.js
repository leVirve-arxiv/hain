'use strict';

class Master {
  constructor() {
    this.receivers = [];
  }
  addReceiver(receiver) {
    this.receivers.add(receiver);
    receiver.on('message', this.onMessage);
  }
  onMessage(receiver, msg) {
    // 처리해야 할것
    // channel 관리
    // 함수 호출이 들어오면 channel, receiver 찾아서 전송
  }
}

module.exports = Master;
