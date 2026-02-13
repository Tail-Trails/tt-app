// Minimal EventEmitter shim used to satisfy imports of
// 'react-native/Libraries/vendor/emitter/EventEmitter' during web builds.
class EventEmitter {
  constructor() {
    this._listeners = Object.create(null);
  }

  addListener(event, listener) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
    return {
      remove: () => {
        this._listeners[event] = (this._listeners[event] || []).filter((l) => l !== listener);
      },
    };
  }

  removeListener(event, listener) {
    this._listeners[event] = (this._listeners[event] || []).filter((l) => l !== listener);
  }

  removeAllListeners(event) {
    if (event) this._listeners[event] = [];
    else this._listeners = Object.create(null);
  }

  emit(event, ...args) {
    const list = this._listeners[event] || [];
    for (let i = 0; i < list.length; i++) {
      try {
        list[i].apply(null, args);
      } catch (e) {
        // swallow errors in shim
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  }
}

module.exports = EventEmitter;
module.exports.default = EventEmitter;
