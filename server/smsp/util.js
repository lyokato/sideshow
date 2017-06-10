'use strict'

const Destination = require('./destination')

module.exports = class SMSPUtil {

  static parseMediaRoomId(roomId) {
    if (roomId.match(/^room\:([a-zA-Z0-9_]+)$/)) {
      return {
        type: "room",
        name: RegExp.$1
      }
    } else if (roomId.match(/^user\:([a-zA-Z0-9_]+)\:([a-zA-Z0-9_]+)$/)) {
      return {
        type: "user",
        names: [RegExp.$1, RegExp.$2]
      }
    } else {
      throw new ArgumentError("invalid media-room-id format")
    }
  }

  static createMediaRoomId(room) {
    return "room:" + room
  }

  static createMediaRoomIdFor2(sender, recipient) {
    return "user:" + [sender, recipient].sort().join(":")
  }

  static findAvailableName(store, name) {
    let candidate = name
    while (store.has(candidate)) {
      candidate = candidate + "_"
    }
    return candidate
  }

  static createTransactionId() {
    return Date.now().toString()
  }

  static parseMediaSessionId(sessionId) {
    if (sessionId.match(/^([a-zA-Z0-9_]+)\:(.+)$/)) {
      return {
        nickname: RegExp.$1,
        txn:      RegExp.$2
      }
    } else {
      throw new ArgumentError("invalid media-session-id format")
    }
  }

  static createMediaSessionId(nickname, txn) {
    return [nickname, txn].join(":")
  }

}

