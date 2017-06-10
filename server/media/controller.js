'use strict'

const co        = require('co')
const validate  = require('jsonschema').validate;
const logger    = require('../logger')
const Room      = require('./room')
const RoomStore = require('./store')

module.exports = class MediaRoomController {

  constructor(mediaConfig, listener) {
    this._roomStore = new RoomStore(mediaConfig)
    this._listener = listener
    this._closed    = false
  }

  handleMessage(messageType, params) {

    logger.info('[media] incoming new message, type: %s', messageType)

    logger.debug("[media] %s", JSON.stringify(params))

    switch (messageType) {
      case "join:offer":
        this._handleJoinOfferMessage(params)
        break;
      case "join:answer":
        this._handleJoinAnswerMessage(params)
        break;
      case "leave":
        this._handleLeaveMessage(params)
        break;
    }
  }

  _handleJoinOfferMessage(params) {

    logger.info('[media] join request - offer phase')

    const result = validate(params, {
      type: "object",
      required: [ "roomId", "sessionId", "offer", "options"],
      properties: {
        roomId:       { type: "string"  },
        sessionId:    { type: "string"  },
        offer:        { type: "string"  },
        options:      {
          type: "object" ,
          required: ["publishAudio", "publishVideo", "planB"],
          properties: {
            publishAudio: { type: "boolean" },
            publishVideo: { type: "boolean" },
            planB:        { type: "boolean" }
          }
        }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(result)
      return
    }

    const roomId    = params["roomId"]
    const sessionId = params["sessionId"]
    const offer     = params["offer"]
    const options   = params["options"]

    if (!this._roomStore.has(roomId)) {

      logger.info("[media:%s] [session:%s] room not found, create new one.",
        roomId, sessionId)

      const self = this

      co(function*(){

        logger.debug("[media:%s] [session:%s] create new room.", roomId, sessionId)

        const room = yield self._roomStore.newRoom(roomId)

        logger.debug("[media:%s] [session:%s] create new member.", roomId, sessionId)

        const member = room.newMember(sessionId, self._listener, options)

        logger.debug("[media:%s] [session:%s] start processing offer.", roomId, sessionId)

        yield member.start(offer)

      }).catch(err => {

        logger.error("[media:%s] [session:%s] failed to join room", roomId, sessionId)
        logger.dumpError("[media:%s] [session:%s] error: %s", err)

      })

    } else {

      logger.info("[media:%s] [session:%s] room found, add new member into it.",
        roomId, sessionId)

      const room = this._roomStore.get(roomId)

      if (room.hasMember(sessionId)) {
        logger.info("[media:%s] [session:%s] already exists",
          roomId, sessionId)
        return
      }

      logger.debug("[media:%s] [session:%s] create new member.", roomId, sessionId)

      const member = room.newMember(sessionId, this._listener, options)

      logger.debug("[media:%s] [session:%s] start processing offer.", roomId, sessionId)

      co(function*(){
        yield member.start(offer)
      }).catch(err => {
        logger.error("[media:%s] [session:%s] failed to join room", roomId, sessionId)
        logger.dumpError("[media:%s] [session:%s] error: %s", err)
      })
    }

  }

  _handleJoinAnswerMessage(params) {

    logger.info('[media] join request - answer phase')

    const result = validate(params, {
      type: "object",
      required: [ "roomId", "sessionId", "answer" ],
      properties: {
        roomId:    { type: "string" },
        sessionId: { type: "string" },
        answer:    { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(result)
      return
    }

    const roomId    = params["roomId"]
    const sessionId = params["sessionId"]
    const answer    = params["answer"]

    if (!this._roomStore.has(roomId)) {
      logger.warn("[media:%s] not found", roomId)
      return
    }

    const room = this._roomStore.get(roomId)

    if (!room.hasMember(sessionId)) {
      logger.warn(
        "[media:%s] [session:%s] not found", roomId, sessionId)
      return
    }

    const member = room.getMember(sessionId)
    logger.debug(
      "[media:%s] [session:%s] set answer", roomId, sessionId)

    member.setAnswer(answer).then(() => {
      logger.debug(
        "[media:%s] [session:%s] answer is set successfully", roomId, sessionId)
    }).catch(err => {
      logger.dumpError("failed to set answer to room: %s", err)
    })
  }

  _handleLeaveMessage(params) {

    logger.info('[media] leave from room request')

    const result = validate(params, {
      type: "object",
      required: [ "roomId", "sessionId" ],
      properties: {
        roomId:    { type: "string" },
        sessionId: { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(result)
      return
    }

    const roomId    = params["roomId"]
    const sessionId = params["sessionId"]

    if (!this._roomStore.has(roomId)) {
      logger.warn("[media:%s] not found", roomId)
      return
    }

    const room = this._roomStore.get(roomId)

    if (!room.hasMember(sessionId)) {
      logger.warn("[media:%s] [session:%s] not found",
        roomId, sessionId)
    }

    room.removeMember(sessionId)
  }

  _handleValidationFailure(result) {
    const errmsg = result.errors.join("/")
    logger.info(
      '[media] failed to validate params: ' + errmsg)
  }

  close() {
    if (this._closed) {
      return
    }

    this._closed = true

    if (this._roomStore !== null) {
      this._roomStore.close()
      this._roomStore = null
    }

  }
}
