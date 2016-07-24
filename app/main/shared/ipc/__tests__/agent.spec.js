'use strict';

const co = require('co');
const Agent = require('../agent');

class TransportMock {
  constructor() {
    this.receivers = {};
    this.onceReceivers = {};
    this.hooks = {};
  }
  activate(agentName) {}
  send(tag, data) {
    const hook = this.hooks[tag];
    if (hook)
      hook(data);
  }
  on(tag, receiver) {
    this.receivers[tag] = receiver;
  }
  once(tag, receiver) {
    this.onceReceivers[tag] = receiver;
  }
  hook(tag, hook) {
    this.hooks[tag] = hook;
  }
  emit(tag, data) {
    const receiver = this.receivers[tag];
    if (receiver)
      receiver(data);

    const onceReceiver = this.onceReceivers[tag];
    if (onceReceiver) {
      onceReceiver(data);
      delete this.onceReceivers[tag];
    }
  }
}

function setupTransportMockForConnection(transportMock) {
  transportMock.hook('connect', (data) => {
    transportMock.emit('repl:connect');
  });
}

describe('Agent', () => {
  describe('connect', () => {

    it('should connect to master through send and receive messages', (done) => {
      const transportMock = new TransportMock();
      transportMock.hook('connect', (data) => {
        transportMock.emit('repl:connect');
      });

      const agent = new Agent('agent0');
      const promise = agent.connect(transportMock);
      promise.then(done);
    });

  });

  describe('call', () => {

    pit('should call function by funcName', () => {
      return co(function* () {
        const transportMock = new TransportMock();
        setupTransportMockForConnection(transportMock);

        const agent = new Agent('agent0');
        yield agent.connect(transportMock);

        transportMock.hook('call', (data) => {
          const { callId, funcName, args } = data;
          if (funcName === 'sum') {
            const a = args[0];
            const b = args[1];
            transportMock.emit(`repl:call:${callId}`, {
              result: a + b
            });
          }
        });
        const ret = yield agent.call('agent1', 'sum', 1, 5);
        expect(ret).toBe(6);
      });
    });

    pit('should be rejected if remote function raised error', () => {
      return co(function* () {
        const transportMock = new TransportMock();
        setupTransportMockForConnection(transportMock);

        const agent = new Agent('agent0');
        yield agent.connect(transportMock);

        transportMock.hook('call', (data) => {
          const { callId, funcName, args } = data;
          if (funcName === 'sum') {
            transportMock.emit(`repl:call:${callId}`, {
              error: 'has error'
            });
          }
        });
        try {
          yield agent.call('agent1', 'sum', 1, 5);
        } catch (e) {
          expect(e).toBe('has error');
          return;
        }
        throw new Error('this line shouldnt be executed');
      });
    });

  });

  describe('listening for functionCalls', () => {

    pit('should execute function with no argumnets', () => {
      return new Promise((resolve, reject) => {

        const transportMock = new TransportMock();
        setupTransportMockForConnection(transportMock);

        const agent = new Agent('agent0');
        agent.define('test', function* () {
          return 'okay';
        });

        agent.connect(transportMock);

        const callId = 0;
        transportMock.hook(`repl:call:${callId}`, (data) => {
          const { result, error } = data;
          expect(result).toBe('okay');
          resolve();
        });
        transportMock.emit('call', {
          callId,
          funcName: 'test'
        });
      });
    });

    pit('should reply result after executing function (generator)', () => {
      return new Promise((resolve, reject) => {

        const transportMock = new TransportMock();
        setupTransportMockForConnection(transportMock);

        const agent = new Agent('agent0');
        agent.define('multiply', function* (a, b) {
          return a * b;
        });

        agent.connect(transportMock);

        const callId = 0;
        transportMock.hook(`repl:call:${callId}`, (data) => {
          const { result, error } = data;
          expect(result).toBe(10);
          resolve();
        });
        transportMock.emit('call', {
          callId,
          funcName: 'multiply',
          args: [2, 5]
        });
      });
    });

    pit('should send error if there is no function with funcName', () => {
      return new Promise((resolve, reject) => {
        const transportMock = new TransportMock();
        setupTransportMockForConnection(transportMock);

        const agent = new Agent('agent0');
        agent.connect(transportMock);

        const callId = 0;
        transportMock.hook(`repl:call:${callId}`, (data) => {
          const { result, error } = data;
          expect(error).toBeDefined();
          resolve();
        });
        transportMock.emit('call', {
          callId,
          funcName: 'function_not_exists',
          args: [1, 5]
        });
      });
    });

    pit('should send error if function raised error', () => {
      return new Promise((resolve, reject) => {
        const transportMock = new TransportMock();
        setupTransportMockForConnection(transportMock);

        const agent = new Agent('agent0');
        agent.define('multiply', function* (a, b) {
          throw 'multiply error';
        });
        agent.connect(transportMock);

        const callId = 0;
        transportMock.hook(`repl:call:${callId}`, (data) => {
          const { result, error } = data;
          expect(error).toBe('multiply error');
          resolve();
        });
        transportMock.emit('call', {
          callId,
          funcName: 'multiply',
          args: [1, 5]
        });
      });
    });

  });

});
