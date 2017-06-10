'use strict'

const EventEmitter = require('events').EventEmitter
const logger       = require('../logger')
const co           = require('co')

module.exports = class Member extends EventEmitter {

  constructor(id, roomId, raw, listener, options) {
    super()

    this._id       = id
    this._roomId   = roomId
    this._raw      = raw
    this._listener = listener
    this._options  = options
    this._closed   = false

    this._negotiationTimer = null;

    this._raw.once('close', () => {

      logger.info("[media:%s] [session:%s] closed event found",
        this._roomId, this._id)

      this._close(true)
    })

    this._raw.on('signalingstatechange', () => {

      logger.info("[media:%s] [session:%s] signaling state: %s",
        this._roomId, this._id, this._raw.signalingState)

    })

    this._raw.on('negotiationneeded', () => {

      logger.info("[media:%s] [session:%s] re-negotiation",
        this._roomId, this._id)

      if (this._closed) {
        return
      }

      if (this._raw.peer.transports.length === 0) {

        logger.info("[media:%s] [session:%s] but transports not found, start to close this peer",
          this._roomId, this._id)

        this._close(false)
        return
      }

      const self = this
      co(function*(){

        yield self._sendOffer(false)

      }).catch(err => {

        logger.dumpError(
          `[media:${this._roomId}] [session:${this._id}] failed to send re-negotiation-offer. %s`, err)

        this._raw.reset()
      })

    })
  }

  get id() { return this._id }

  start(offer) {

    if (this._closed) {
      return
    }

    logger.debug("[media:%s] [session:%s] start",
      this._roomId, this._id)

    this._listener.onMediaServerSessionStarted({
      roomId:    this._roomId,
      sessionId: this._id
    })

    const self = this
    return function*(){
      yield self._raw.setCapabilities(offer)
      yield self._sendOffer(true)
    }
  }

  setAnswer(answer) {
    if (this._closed) {
      return
    }
    this._stopNegotiationTimer();
    // TODO reset timer
    return this._raw.setRemoteDescription({
      type: "answer",
      sdp:  answer
    })
  }

  _createOfferOption(isInitialOffer) {
    const options = {}

    if ("publishAudio" in this._options
      && this._options["publishAudio"]) {
      options.offerToReceiveAudio = 1
    } else {
      options.offerToReceiveAudio = 0
    }

    if ("publishVideo" in this._options
      && this._options["publishVideo"]) {
      options.offerToReceiveVideo = 1
    } else {
      options.offerToReceiveVideo = 0
    }

    return options
  }

  _sendOffer(isInitialOffer) {
    const self = this
    return function*(){
      const option = self._createOfferOption(isInitialOffer)
      const desc = yield self._raw.createOffer(option)
      yield self._raw.setLocalDescription(desc)
      self._publishOffer(desc.sdp)
      self._startNegotiationTimer(5000)
    }
  }

  _publishOffer(offer) {
    this._listener.onMediaServerOffer({
      roomId:    this._roomId,
      sessionId: this._id,
      offer:     offer
    })
  }

  _startNegotiationTimer(timeout) {
    if (this._negotiationTimer === null) {

      logger.debug("[media:%s] [session:%s] start negotiation timer",
        this._roomId, this._Id)

      this._negotiationTimer = setTimeout(() => {

        logger.debug("[media:%s] [session:%s] negotiation timeout",
          this._roomId, this._Id)
      }, timeout)
    }
  }

  _stopNegotiationTimer() {
    if (this._negotiationTimer !== null) {
      logger.debug(
        "[room:%s] [session:%s] stop negotiation timer",
      this._roomId, this._Id)
      clearTimeout(this._negotiationTimer)
      this._negotiationTimer = null
    }
  }

  close() {
    this._close(false)
  }

  _close(remote) {
    if (this._closed) {
      return
    }
    this._closed = true

    logger.debug(
      "[media:%s] [session:%s] release session",
        this._roomId, this._id)

    this._stopNegotiationTimer();

    this._listener.onMediaServerSessionClosed({
      roomId:    this._roomId,
      sessionId: this._id
    })

    //if (!remote && this._raw !== null) {
      this._raw.close()
      this._raw = null
    //}

    this.emit('close', this._id)
    this.removeAllListeners('close')
    this.removeAllListeners('timeout')
  }

}
