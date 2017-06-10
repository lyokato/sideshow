'use strict'

const logger              = require("../logger");
const validate            = require('jsonschema').validate;
const WebSocketServer     = require("websocket").server
const SMSPConnection      = require("./connection")
const Util                = require("./util")
const Room                = require("./room")
const MediaRoomController = require("../media/controller")

// SMSP: Simple Messaging and Singnaling Protocol
// Server Implementation
module.exports = class SMSPServer {

  constructor(params) {

    const httpServer  = params["httpServer"]
    const mediaConfig = params["mediaConfig"]

    this._mediaRoomController =
      new MediaRoomController(mediaConfig, this)

    this._directRTCUseMediaServer =
      mediaConfig["directRTCUseMediaServer"] || false

    this._users  = new Map()
    this._rooms  = new Map()

    this._server = new WebSocketServer({
      httpServer:           httpServer,
      autoAcceptConnection: false
    })

    this._server.on("request", request => {
      this._handleUserConnection(request)
    })
  }

  close() {
    this._mediaRoomController.close()
  }

  onMediaServerOffer(msg) {

    logger.info('[signaling] [media_server] @offer')

    const result = validate(msg, {
      type: "object",
      required: [ "roomId", "sessionId", "offer"],
      properties: {
        sessionId: { type: "string" },
        roomId:    { type: "string" },
        offer:     { type: "string" },
      }
    })

    const sessionId   = msg["sessionId"]
    const mediaRoomId = msg["roomId"]
    const offer       = msg["offer"]

    if (!result.valid) {
      const errmsg = result.errors.join("/")
      logger.warn(
        '[signaling] [media_server] invalid message: ' + errmsg)
      return
    }

    let session = null
    try {
      session = Util.parseMediaSessionId(sessionId)
    } catch (e) {
      logger.warn(
        '[signaling] [media_server] invalid session-id: ' + sessionId)
      return
    }

    let channel = null
    try {
      channel = Util.parseMediaRoomId(mediaRoomId)
    } catch (e) {
      logger.info(
        '[signaling] [media_server] invalid media-room-id: ' + mediaRoomId)
      return
    }

    const user = this._getAvailableUser(session.nickname)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", session.nickname)
      return
    }

    if (channel.type === "room") {

      user.deliverRoomRTCOffer(session.txn, channel.name, offer)

    } else if (channel.type === "user") {

      let dest = channel.names[0] === session.nickname ?
        channel.names[1] : channel.names[0]
      user.deliverDirectRTCOffer(session.txn, dest, offer)

    }
  }

  onMediaServerSessionStarted(msg) {

    logger.info('[signaling] [media_server] @session_closed')

    const result = validate(msg, {
      type: "object",
      required: [ "roomId", "sessionId"],
      properties: {
        sessionId: { type: "string" },
        roomId:    { type: "string" },
      }
    })

    const sessionId   = msg["sessionId"]
    const mediaRoomId = msg["roomId"]

    if (!result.valid) {
      const errmsg = result.errors.join("/")
      logger.warn(
        '[signaling] [media_server] invalid message: ' + errmsg)
      return
    }

    let session = null
    try {
      session = Util.parseMediaSessionId(sessionId)
    } catch (e) {
      logger.warn(
        '[signaling] [media_server] invalid session-id: ' + sessionId)
      return
    }

    let channel = null
    try {
      channel = Util.parseMediaRoomId(mediaRoomId)
    } catch (e) {
      logger.info(
        '[signaling] [media_server] invalid media-room-id: ' + mediaRoomId)
      return
    }

    const user = this._getAvailableUser(session.nickname)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", session.nickname)
      return
    }

    if (channel.type === "room") {

      user.rememberMediaSession(channel.name)

    } else {
      // not supported yet
    }

  }


  onMediaServerSessionClosed(msg) {

    logger.info('[signaling] [media_server] @session_closed')

    const result = validate(msg, {
      type: "object",
      required: [ "roomId", "sessionId"],
      properties: {
        sessionId: { type: "string" },
        roomId:    { type: "string" },
      }
    })

    const sessionId   = msg["sessionId"]
    const mediaRoomId = msg["roomId"]

    if (!result.valid) {
      const errmsg = result.errors.join("/")
      logger.warn(
        '[signaling] [media_server] invalid message: ' + errmsg)
      return
    }

    let session = null
    try {
      session = Util.parseMediaSessionId(sessionId)
    } catch (e) {
      logger.warn(
        '[signaling] [media_server] invalid session-id: ' + sessionId)
      return
    }

    let channel = null
    try {
      channel = Util.parseMediaRoomId(mediaRoomId)
    } catch (e) {
      logger.info(
        '[signaling] [media_server] invalid media-room-id: ' + mediaRoomId)
      return
    }

    const user = this._getAvailableUser(session.nickname)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", session.nickname)
      return
    }

    if (channel.type === "room") {

      user.forgetMediaSession(channel.name)

    } else {
      // not supported yet
    }

  }


  _handleUserConnection(request) {

    logger.info("[signaling] [conn] here comes new connection");

    let rawConn = null
    try {
      rawConn = request.accept("smsp-protocol", request.origin);
    } catch(e) {

      return
    }

    const conn = new SMSPConnection(rawConn);

    conn.on('system:login', (txn, nickname, raw) => {
      this._handleLoginRequest(txn, nickname, raw)
    })

    conn.on('system:logout', (nickname) => {
      this._handleLogoutRequest(nickname)
    })

    conn.on('direct:chat', (sender, txn, recipient, text) => {
      this._handleDirectChat(sender, txn, recipient, text)
    })

    conn.on('direct:rtc:offer', (sender, txn, recipient, sdp, options) => {
      this._handleDirectRTCOffer(sender, txn, recipient, sdp, options)
    })

    conn.on('direct:rtc:answer', (sender, txn, recipient, sdp) => {
      this._handleDirectRTCAnswer(sender, txn, recipient, sdp)
    })

    conn.on('direct:rtc:candidates', (sender, txn, recipient, candidates) => {
      this._handleDirectRTCCandidates(sender, txn, recipient, candidates)
    })

    conn.on('direct:rtc:bye', (sender, txn, recipient, reason) => {
      this._handleDirectRTCBye(sender, txn, recipient, reason)
    })

    conn.on('room:join', (sender, txn, room) => {
      this._handleRoomJoinRequest(sender, txn, room)
    })

    conn.on('room:leave', (sender, txn, room) => {
      this._handleRoomLeaveRequest(sender, txn, room)
    })

    conn.on('room:chat', (sender, txn, room, text) => {
      this._handleRoomChat(sender, txn, room, text)
    })

    conn.on('room:rtc:offer', (sender, txn, room, sdp, options) => {
      this._handleRoomRTCOffer(sender, txn, room, sdp, options)
    })

    conn.on('room:rtc:answer', (sender, txn, room, sdp) => {
      this._handleRoomRTCAnswer(sender, txn, room, sdp)
    })

    conn.on('room:rtc:candidates', (sender, txn, room, candidates) => {
      this._handleRoomRTCCandidates(sender, txn, room, candidates)
    })

    conn.on('room:rtc:bye', (sender, txn, room, reason) => {
      this._handleRoomRTCBye(sender, txn, room, reason)
    })

  }

  _getAvailableUser(nickname) {
    if (!this._users.has(nickname)) {
      return null
    }
    const user = this._users.get(nickname)
    if (!user.ready) {
      return null
    }

    return user
  }

  _handleDirectChat(sender, txn, recipient, text) {
    const user = this._getAvailableUser(recipient)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", recipient)
      return
    }
    user.deliverDirectChat(txn, sender, text)
  }

  _handleDirectRTCOffer(sender, txn, recipient, offer, options) {

    const user = this._getAvailableUser(recipient)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", recipient)
      return
    }

    if (this._directRTCUseMediaServer) {

      const sessionId = Util.createMediaSessionId(sender, txn)
      const roomId    = Util.createMediaRoomIdFor2(sender, recipient)

      this._mediaRoomController.handleMessage("join:offer", {
        roomId:    roomId,
        sessionId: sessionId,
        offer:     offer,
        options: {
          publishVideo: options["publishVideo"],
          publishAudio: options["publishAudio"],
          planB:        options["planB"],
        }
      })
    } else {
      user.deliverDirectRTCOffer(txn, sender, offer)
    }
  }

  _handleDirectRTCAnswer(sender, txn, recipient, answer) {

    const user = this._getAvailableUser(recipient)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", recipient)
      return
    }

    if (this._directRTCUseMediaServer) {

      const sessionId = Util.createMediaSessionId(sender, txn)
      const roomId    = Util.createMediaRoomIdFor2(sender, recipient)

      this._mediaRoomController.handleMessage("join:answer", {
        roomId:    roomId,
        sessionId: sessionId,
        answer:    answer
      })

    } else {
      user.deliverDirectRTCAnswer(txn, sender, answer)
    }
  }

  _handleDirectRTCCandidates(sender, txn, recipient, candidates) {

    const user = this._getAvailableUser(recipient)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", recipient)
      return
    }

    if (this._directRTCUseMediaServer) {
      // Mediasoup doesn't use candidate with tricke-ICE
    } else {
      user.deliverDirectRTCCandidates(txn, sender, candidates)
    }
  }

  _handleDirectRTCBye(sender, txn, recipient, candidates) {
    const user = this._getAvailableUser(recipient)
    if (user === null) {
      logger.info("[signaling] available user not found: %s", recipient)
      return
    }
    user.deliverDirectBye(txn, sender, candidates)
  }

  _handleRoomJoinRequest(sender, txn, roomName, greeting) {

    if (!this._rooms.has(roomName)) {
      // TODO check limit, number of rooms
      this._rooms.set(roomName, new Room(roomName))
    }

    const room = this._rooms.get(roomName)
    if (room.hasMember(sender)) {
      // already a member, ignore
      logger.info("[signaling] already a member, do nothing")
      return
    }

    // TODO check limit, number of room-members
    room.forEachMember(memberName => {
      const user = this._getAvailableUser(memberName)
      if (user !== null) {
        user.deliverRoomMemberJoin(txn, roomName, sender, greeting)
      }
    })

    room.addMember(sender)

    const user = this._getAvailableUser(sender)
    if (user !== null) {
      user.deliverRoomJoined(txn, roomName, room.getMembers())
    }
  }

  _handleRoomLeaveRequest(sender, txn, roomName, will) {

    if (!this._rooms.has(roomName)) {
      logger.info("[signaling] available room not found: %s", roomName)
      return
    }

    const room = this._rooms.get(roomName)

    if (!room.hasMember(sender)) {
      // not a member, ignore
      logger.info("[signaling] not a member, do nothing")
      return
    }

    room.removeMember(sender)

    const user = this._getAvailableUser(sender)
    if (user !== null) {
      user.deliverRoomLeft(txn, roomName)
    }

    if (room.numberOfMembers() == 0) {
      this._rooms.delete(roomName)
      return
    }

    room.forEachMember(memberName => {
      const user = this._getAvailableUser(memberName)
      if (user !== null) {
        user.deliverRoomMemberLeave(txn, roomName, sender, will)
      }
    })
  }

  _handleRoomChat(sender, txn, roomName, text) {

    if (!this._rooms.has(roomName)) {
      logger.info("[signaling] available room not found: %s", roomName)
      return
    }

    const room = this._rooms.get(roomName)

    if (!room.hasMember(sender)) {
      // not a member, ignore
      logger.info("[signaling] not a member, do nothing")
      return
    }

    room.forEachMember(memberName => {
      const user = this._getAvailableUser(memberName)
      if (user !== null) {
        user.deliverRoomChat(txn, roomName, sender, text)
      }
    })
  }

  _handleRoomRTCOffer(sender, txn, roomName, offer, options) {

    if (!this._rooms.has(roomName)) {
      logger.info("[signaling] available room not found: %s", roomName)
      return
    }

    const room = this._rooms.get(roomName)

    if (!room.hasMember(sender)) {
      // not a member, ignore
      logger.info("[signaling] not a member, do nothing")
      return
    }

    const sessionId = Util.createMediaSessionId(sender, txn)
    const roomId    = Util.createMediaRoomId(roomName)

    this._mediaRoomController.handleMessage("join:offer", {
      roomId:    roomId,
      sessionId: sessionId,
      offer:     offer,
      options: {
        publishVideo: options["publishVideo"],
        publishAudio: options["publishAudio"],
        planB:        options["planB"],
      }
    })
  }

  _handleRoomRTCAnswer(sender, txn, roomName, answer) {

    if (!this._rooms.has(roomName)) {
      logger.info("[signaling] available room not found: %s", roomName)
      return
    }

    const room = this._rooms.get(roomName)

    if (!room.hasMember(sender)) {
      // not a member, ignore
      logger.info("[signaling] not a member, do nothing")
      return
    }

    const sessionId = Util.createMediaSessionId(sender, txn)
    const roomId    = Util.createMediaRoomId(roomName)

    // TODO sender is a member of this room?

    this._mediaRoomController.handleMessage("join:answer", {
      roomId:    roomId,
      sessionId: sessionId,
      answer:    answer
    })
  }

  _handleRoomRTCCandidates(sender, txn, roomName, candidates) {
    // mediasoup doesn't use candidate with tricle-ICE
  }

  _handleRoomRTCBye(sender, txn, roomName, reason) {

    if (!this._rooms.has(roomName)) {
      logger.info("[signaling] available room not found: %s", roomName)
      return
    }

    const room = this._rooms.get(roomName)

    if (!room.hasMember(sender)) {
      // not a member, ignore
      logger.info("[signaling] not a member, do nothing")
      return
    }

    const sessionId = Util.createMediaSessionId(sender, txn)
    const roomId    = Util.createMediaRoomId(roomName)

    this._mediaRoomController.handleMessage("leave", {
      roomId:    roomId,
      sessionId: sessionId
    })

  }

  _handleLoginRequest(txn, nickname, conn) {

    const available =
       Util.findAvailableName(this._users, nickname)

    // TODO check limit, numuber of connections

    this._users.set(available, conn);
    conn.onReady(txn, available);
  }

  _handleLogoutRequest(nickname) {

    this._rooms.forEach((room, roomName) => {

      if (room.hasMember(nickname)) {

        room.removeMember(nickname)

        if (room.numberOfMembers() == 0) {
          this._rooms.delete(roomName)
          return
        }

        room.forEachMember(memberName => {
          const user = this._getAvailableUser(memberName)
          if (user !== null) {
            user.deliverRoomMemberLeave(Util.createTransactionId(),
              roomName, nickname, "logout")
          }
        })
      }

    })

    this._users.delete(nickname);
  }

}
