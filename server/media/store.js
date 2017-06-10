'use strict'

const Room      = require('./room')
const logger    = require('../logger')
const mediasoup = require('mediasoup')

module.exports = class RoomStore {

  constructor(mediaConfig) {
    this._mediasoup        = mediasoup.Server(mediaConfig.server)
    this._roomOptions      = mediaConfig.room
    this._transportOptions = mediaConfig.transport
    this._maxBitrate       = mediaConfig.maxBitrate
    this._store            = new Map()
    this._closed           = false
  }

  newRoom(roomId) {
    const self = this
    logger.debug("[media] create new raw room before")
    return function*(){
      logger.debug("[media] create new raw room")
      const rawRoom =  yield self._mediasoup.createRoom(self._roomOptions)
      logger.debug("[media] create new raw room")
      const room = new Room(roomId, rawRoom, this._transportOptions, this._maxBitrate)
      self.add(room)
      return room
    }
  }

  has(roomId) {
    return this._store.has(roomId)
  }

  add(room) {
    if (this._closed) {
      return
    }

    room.once("close", (roomId) => {
      if (this._store.has(roomId)) {
        this._store.delete(roomId)
      }
    })

    this._store.set(room.id, room)
  }

  get(roomId) {
    return this._store.get(roomId)
  }

  remove(roomId) {
    if (this._closed) {
      return
    }
    if (this._store.has(roomId)) {
      const room = this._store.get(roomId)
      this._store.delete(roomId)
      room.close()
    }
  }

  clear() {
    if (this._closed) {
      return
    }
    for (const room of this._store.values()) {
      room.close()
    }
    this._store.clear()
  }

  close() {
    if (this._closed) {
      return
    }
    this.clear()
    this._closed = true
  }
}
