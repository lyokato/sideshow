'use strict'

module.exports = class Destination {

  static parse(to) {
    if (to === "system") {
      return new Destination("system")
    } else if (to.match(/^user\:([a-zA-Z0-9_]+)$/)){
      return new Destination("user", RegExp.$1)
    } else if (to.match(/^room\:([a-zA-Z0-9_]+)$/)){
      return new Destination("room", RegExp.$1)
    } else {
      throw new ArgumentError("invalid destination format")
    }
  }

  constructor(type, name) {
    this._type = type
    this._name = name
  }

  get type() {
    return this._type
  }

  get isSystem() {
    return this._type === "system"
  }

  get isRoom() {
    return this._type === "room"
  }

  get isUser() {
    return this._type === "user"
  }

  get name() {
    return this._name
  }

  toString() {
    if (this._name === null || this._name.length === 0) {
      return this._type
    } else {
      return [this._type, this._name].join(":")
    }
  }
}
