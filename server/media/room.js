'use strict'

const EventEmitter = require('events').EventEmitter
const logger       = require('../logger')
const Member       = require('./member')
const mediasoup    = require("mediasoup")

const RTCPeerConnection = mediasoup.webrtc.RTCPeerConnection

const DEFAULT_MAX_BITRATE = 3000000;
const BITRATE_FACTOR      = 0.75;

module.exports = class Room extends EventEmitter {

  constructor(id, raw, transportOptions, maxBitrate) {
    super()

    this._id                = id
    this._raw               = raw
    this._members           = new Map()
    this._closed            = false
    this._transportOptions  = transportOptions
    this._baseMaxBitrate    = maxBitrate || DEFAULT_MAX_BITRATE;
    this._minBitrate        = Math.min(50000 || this._baseMaxBitrate);
    this._currentMaxBitrate = this._baseMaxBitrate;

    this._initialize()
  }

  _initialize() {
    process.nextTick(() => {
      this._raw.on('newpeer', (peer) => {
        this._updateMaxBitrate()
      })
    })
  }

  get id() { return this._id }

  get membersCount() {
    return this._members.size
  }

  hasMember(sessionId) {
    return this._members.has(sessionId)
  }

  getMember(sessionId) {
    return this._members.get(sessionId)
  }

  newMember(sessionId, listener, options) {

    logger.info(
      "[media:%s] newMember:%s", this._id, sessionId)

    if (this._closed) {
      logger.info(
        "[media:%s] condition mismatch, already closed",
          this._id)
      return
    }

    logger.debug(
      "[media:%s] add new member '%s'",
        this._id, sessionId)

    if (this._members.has(sessionId)) {
      logger.warn(
        "[media:%s] %s is already a member of this room, ignore.",
          this._id, sessionId)
      return
    }

    const member = this._createMember(sessionId, listener, options)
    this._members.set(sessionId, member)
    this._cancelClosingTimer()
    return member
  }

  _createMember(sessionId, listener, options) {

    if (this._closed) {
      logger.info(
        "[media:%s] _createMember: condition mismatch, already closed",
          this._id)
      return
    }

    const conn = new RTCPeerConnection({
      peer:             this._raw.Peer(sessionId),
      usePlanB:         options.planB,
      transportOptions: this._transportOptions,
      maxBitrate:       this._currentMaxBitrate,
    })

    const member = new Member(sessionId,
      this._id, conn, listener, options)

    member.once('close', (sessionId) => {
      this._removeMember(sessionId, true)
    })

    return member
  }

  removeMember(sessionId) {

    logger.debug(
      "[media:%s] remove member '%s'",
        this._id, sessionId)

    this._removeMember(sessionId, false)
  }

  _removeMember(sessionId, remote) {

    if (this._members.has(sessionId)) {

      const member = this._members.get(sessionId)

      this._members.delete(sessionId)

      if (!remote) {
        member.close()
      }

      this._updateMaxBitrate()

      if (this.membersCount == 0) {

        this._startClosingTimer()

      }
    }
  }

  _startClosingTimer() {
    this._closingTimer = setTimeout(() => {
      this.close()
    }, 1000 * 10)
  }

  _cancelClosingTimer() {
    if (this._closingTimer) {
      clearTimeout(this._closingTimer)
      this._closingTimer = null
    }
  }

  // this code is borrowed from mediasoup-demo
  _updateMaxBitrate() {
    if (this._closed) {
      return
    }

    const previousMaxBitrate = this._currentMaxBitrate
    const numPeers           = this._raw.peers.length

    let newMaxBitrate;

    if (numPeers <= 2) {
      newMaxBitrate = this._baseMaxBitrate
    } else {
      newMaxBitrate = Math.round(this._baseMaxBitrate / ((numPeers - 1) * BITRATE_FACTOR))
      if (newMaxBitrate < this._minBitrate) {
        newMaxBitrate = this._minBitrate
      }
    }

    if (newMaxBitrate === previousMaxBitrate) {
      return;
    }

    for (let peer of this._raw.peers) {
      if (!peer.capabilities || peer.closed) {
        continue;
      }
      for (let transport of peer.transports) {
        if (transport.closed) {
          continue;
        }
        transport.setMaxBitrate(newMaxBitrate);
      }
    }

    logger.debug('[media:%s] [num peers:%s, before:%skbps, now:%skbps]',
      this._id, numPeers,
      Math.round(previousMaxBitrate / 1000),
      Math.round(newMaxBitrate / 1000));

    this._currentMaxBitrate = newMaxBitrate

  }

  close() {
    if (this._closed) {
      return
    }
    this._closed = true

    this._cancelClosingTimer()

    // clear member
    for (const member of this._members.values()) {
      member.close()
    }
    this._members.clear()

    if (this._raw !== null) {
      this._raw.close()
      this._raw = null
    }

    this.emit('close', this._id)
    this.removeAllListeners('close')
  }

}

