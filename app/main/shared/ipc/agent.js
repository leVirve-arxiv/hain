'use strict';

const co = require('co');

class Agent {
  constructor(name) {
    this.name = name;
    this.transport = null;
    this.funcs = {};
    this.funcId = 0;
  }
  connect(transport) {
    return new Promise((resolve, reject) => {
      this.transport = transport;
      // TODO add error handling
      this.transport.on('repl:connect', (data) => resolve());
      this.transport.send('connect', { agentName: this.name });
      this.startListenForFunctionCalls();
    });
  }
  startListenForFunctionCalls() {
    this.transport.on('call', (data) => {
      const { funcId, funcName, args } = data;
      const replyTag = `repl:call:${funcId}`;
      const selectedGenerator = this.funcs[funcName];
      if (selectedGenerator === undefined) {
        return this.transport.send(replyTag, {
          error: 'undefined function'
        });
      }

      return co(selectedGenerator.apply(this, args))
        .then((result) => {
          this.transport.send(replyTag, { result });
        })
        .catch((error) => {
          this.transport.send(replyTag, { error });
        });
    });
  }
  define(funcName, generator) {
    this.funcs[funcName] = generator;
  }
  call(targetAgent, funcName, ...args) {
    const thisFuncId = this.funcId++;
    return new Promise((resolve, reject) => {
      this.transport.once(`repl:call:${thisFuncId}`, (data) => {
        const { result, error } = data;
        if (error)
          return reject(error);
        return resolve(result);
      });
      this.transport.send('call', {
        funcId: thisFuncId,
        targetAgent,
        funcName,
        args
      });
    });
  }
}

module.exports = Agent;
