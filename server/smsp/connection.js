'use strict'

const logger       = require("../logger");
const validate     = require('jsonschema').validate;
const EventEmitter = require('events').EventEmitter
const Util         = require('./util')
const Destination  = require('./destination')

module.exports = class SMSPConnection extends EventEmitter {

  constructor(conn) {
    super()

    this._ready  = false
    this._closed = false

    this._nickname = null;
    this._currentMediaSession = null;

    this._conn = conn
    this._conn.on("message", msg => {

      logger.info("%s here comes new message", this._logHeader())

      if (msg.type === 'utf8') {
        this._handleMessage(msg.utf8Data);
      } else {
        logger.info("%s unsupported websocket message type: %s", this._logHeader(), msg.type)
      }
    });
    this._conn.on("close", () => {
      this.close();
    });
  }

  get ready() {
    return this._ready
  }

  _handleMessage(data) {

    logger.debug(data)

    const msg = JSON.parse(data);

    const result = validate(msg, {
      type: "object",
      required: [ "to", "txn", "type", "content"],
      properties: {
        to:      { type: "string" },
        txn:     { type: "string" },
        type:    { type: "string" },
        content: { type: "object" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(null, result)
      return
    }

    const type    = msg["type"]
    const txn     = msg["txn"]
    const to      = msg["to"]
    const content = msg["content"]

    let dest = null
    try {
      dest = Destination.parse(to)
    } catch (e) {
      this._handleValidationFailure(txn, result)
      return
    }

    switch (type) {
        case "login":
          this._handleLoginMessage(dest, txn, content);
          break
        case "chat":
        this._handleChatMessage(dest, txn, content);
          break
        case "join":
        this._handleJoinMessage(dest, txn, content);
          break
        case "leave":
        this._handleLeaveMessage(dest, txn, content);
          break
        case "rtc:offer":
          this._handleRTCOfferMessage(dest, txn, content);
          break
        case "rtc:answer":
          this._handleRTCAnswerMessage(dest, txn, content);
          break
        case "rtc:candidates":
          this._handleRTCCandidatesMessage(dest, txn, content);
          break
        case "rtc:bye":
          this._handleRTCByeMessage(dest, txn, content);
          break
        default:
          this.onError(txn, "bad-message", "unsupported message type: " + type, true)
          break;
    }
  }

  _handleLoginMessage(dest, txn, content) {

    logger.info("%s <- @login", this._logHeader())

    if (this._ready) {
      this.onError(txn, "policy-violation",
        "received login message but connection is already ready", true)
      return
    }

    if (!dest.isSystem) {
      this.onError(txn, "policy-violation",
        "received login message but its destination is not 'system'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      required: [ "nickname"],
      properties: {
        nickname: { type: "string", pattern: "^[a-zA-Z0-9_]+$" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const nickname = content["nickname"]
    this.emit('system:login', txn, nickname, this);
  }

  onReady(txn, nickname) {

    this._nickname = nickname;
    this._ready    = true;

    logger.info("%s -> @ready", this._logHeader())

    this._conn.sendUTF(JSON.stringify({
      from: "system",
      type: "ready",
      txn:  txn,
      content: {
        nickname: nickname
      }
    }));
  }

  onError(txn, reason, detail, shouldClose) {

    logger.info("%s error<%s>: %s", this._logHeader(), reason, detail)

    this._conn.sendUTF(JSON.stringify({
      from:    "system",
      type:    "error",
      txn:     txn,
      content: {
        reason: reason
      }
    }));

    if (shouldClose) {
      this.close()
    }
  }

  deliverMessage(from, type, txn, content) {

    if (!this._ready) {
      return
    }

    this._conn.sendUTF(JSON.stringify({
      from:    from,
      type:    type,
      txn:     txn,
      content: content
    }));

  }

  _handleChatMessage(dest, txn, content) {

    logger.info("%s <- @chat", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received chat message but connection is not ready", true)
      return
    }

    if (dest.isSystem) {
      this.onError(txn, "policy-violation",
        "received chat message but its destination is 'system'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      required: [ "text"],
      properties: {
        text: { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const text = content["text"]

    const eventName = dest.isRoom ? "room:chat" : "direct:chat"
    this.emit(eventName, this._nickname, txn, dest.name, text);
  }

  _handleJoinMessage(dest, txn, content) {

    logger.info("%s <- @join", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received join message but connection is not ready", true)
      return
    }

    if (!dest.isRoom) {
      this.onError(txn, "policy-violation",
        "received join message but its destination is not 'room'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      properties: {
        greeting: { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const greeting = content["greeting"] || ""
    this.emit("room:join", this._nickname, txn, dest.name, greeting);
  }

  _handleLeaveMessage(dest, txn, content) {

    logger.info("%s <- @leave", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received leave message but connection is not ready", true)
      return
    }

    if (!dest.isRoom) {
      this.onError(txn, "policy-violation",
        "received leave message but its destination is not 'room'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      properties: {
        will: { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const will = content["will"] || ""
    this.emit("room:leave", this._nickname, txn, dest.name, will);
  }

  _handleRTCOfferMessage(dest, txn, content) {

    logger.info("%s <- @rtc:offer", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received rtc:offer message but connection is not ready", true)
      return
    }

    if (dest.isSystem) {
      this.onError(txn, "policy-violation",
        "received rtc:offer but its destination is 'system'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      required: [ "sdp", "options"],
      properties: {
        sdp: { type: "string" },
        options: {
          type: "object",
          required: ["publishVideo", "publishAudio", "planB"],
          properties: {
            planB:        {type: "boolean"},
            publishVideo: {type: "boolean"},
            publishAudio: {type: "boolean"},
          }
        }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const sdp     = content["sdp"]
    const options = content["options"]

    this._dumpSDP(sdp, true)

    const eventName = dest.isRoom ? "room:rtc:offer" : "direct:rtc:offer"
    this.emit(eventName, this._nickname, txn, dest.name, sdp, options);
  }

  _handleRTCAnswerMessage(dest, txn, content) {

    logger.info("%s <- @rtc:answer", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received rtc:answer message but connection is not ready", true)
      return
    }

    if (dest.isSystem) {
      this.onError(txn, "policy-violation",
        "received rtc:answer message but its destination is 'system'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      required: [ "sdp"],
      properties: {
        sdp: { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const sdp = content["sdp"]
    this._dumpSDP(sdp, true)

    const eventName = dest.isRoom ? "room:rtc:answer" : "direct:rtc:answer"
    this.emit(eventName, this._nickname, txn, dest.name, sdp);
  }

  _handleRTCCandidatesMessage(dest, txn, content) {

    logger.info("%s <- @rtc:candidates", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received rtc:candidates message but connection is not ready", true)
      return
    }

    if (dest.isSystem) {
      this.onError(txn, "policy-violation",
        "received rtc:candidates message but its destination is 'system'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      required: ["candidates"],
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            required: ["candidate", "sdpMid", "sdpMLineIndex"],
            properties: {
              candidate:     { type: "string" },
              sdpMid:        { type: "string" },
              sdpMLineIndex: { type: "number" }
            }
          } },
          iminItems: 1
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const candidates = content["candidates"]

    const eventName = dest.isRoom ? "room:rtc:candidates" : "direct:rtc:candidates"
    this.emit(eventName, this._nickname, txn, dest.name, candidates);
  }

  _handleRTCByeMessage(dest, txn, content) {

    logger.info("%s <- @rtc:bye", this._logHeader())

    if (!this._ready) {
      this.onError(txn, "policy-violation",
        "received rtc:bye message but connection is not ready", true)
      return
    }

    if (dest.isSystem) {
      this.onError(txn, "policy-violation",
        "received rtc:bye but its destination is 'system'", true)
      return
    }

    const result = validate(content, {
      type: "object",
      required: [ "reason"],
      properties: {
        reason: { type: "string" }
      }
    })

    if (!result.valid) {
      this._handleValidationFailure(txn, result)
      return
    }

    const reason = content["reason"]

    const eventName = dest.isRoom ? "room:rtc:bye" : "direct:rtc:bye"
    this.emit(eventName, this._nickname, txn, dest.name, reason);
  }

  _handleValidationFailure(txn, result) {
    txn = txn || Util.createTransactionId()
    const errmsg = result.errors.join("/")
    this.onError(txn, "bad-format", "failed to validate params: " + errmsg, false)
  }

  deliverDirectChat(txn, sender, text) {
    const from = "user:" + sender
    this.deliverMessage(from, "chat", txn, { text: text })
  }

  deliverDirectRTCOffer(txn, sender, sdp) {
    const from = "user:" + sender
    this._dumpSDP(sdp)
    this.deliverMessage(from, "rtc:offer", txn, { sdp: sdp })
  }

  deliverDirectRTCAnswer(txn, sender, sdp) {
    const from = "user:" + sender
    this._dumpSDP(sdp)
    this.deliverMessage(from, "rtc:answer", txn, { sdp: sdp })
  }

  deliverDirectRTCCandidates(txn, sender, candidates) {
    const from = "user:" + sender
    this.deliverMessage(from, "rtc:candidates", txn, { candidates: candidates })
  }

  deliverDirectRTCBye(txn, sender, reason) {
    const from = "user:" + sender
    this.deliverMessage(from, "rtc:bye", txn, { reason: reason })
  }

  deliverRoomChat(txn, roomName, sender, text) {
    const from = "room:" + roomName
    this.deliverMessage(from, "chat", txn, {
      member: sender,
      text:   text
    })
  }

  deliverRoomJoined(txn, roomName, members) {
    const from = "room:" + roomName
    this.deliverMessage(from, "joined", txn, { members: members })
  }

  deliverRoomLeft(txn, roomName) {
    const from = "room:" + roomName
    this.deliverMessage(from, "left", txn, {})
  }

  deliverRoomMemberJoin(txn, roomName, member, greeting) {
    const from = "room:" + roomName
    this.deliverMessage(from, "join", txn, {
      member:   member,
      greeting: greeting
    })
  }

  deliverRoomMemberLeave(txn, roomName, member, will) {
    const from = "room:" + roomName
    this.deliverMessage(from, "leave", txn, {
      member: member,
      will:   will
    })
  }

  deliverRoomRTCOffer(txn, roomName, sdp) {
    const from = "room:" + roomName
    this._dumpSDP(sdp, false)
    this.deliverMessage(from, "rtc:offer", txn, { sdp: sdp })
  }

  deliverRoomRTCAnswer(txn, roomName, sdp) {
    const from = "room:" + roomName
    this._dumpSDP(sdp, false)
    this.deliverMessage(from, "rtc:answer", txn, { sdp: sdp })
  }

  deliverRoomRTCCandidates(txn, roomName, candidates) {
    const from = "room:" + roomName
    this.deliverMessage(from, "rtc:candidates", txn, { candidates: candidates })
  }

  rememberMediaSession(roomName) {
    logger.info("%s remember media session", this._logHeader())
    this._currentMediaSession = roomName;
  }

  forgetMediaSession(roomName) {
    logger.info("%s forgot media session", this._logHeader())
    this._currentMediaSession = null;
  }

  _dumpSDP(sdp, incoming) {
    if (incoming) {
      logger.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n%s", sdp)
    } else {
      logger.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n%s", sdp)
    }
  }

  _logHeader() {
   if (this._ready) {
     return "[signaling] [conn:" + this._nickname + "]"
   } else {
     return "[signaling] [conn]"
   }
  }

  close() {
    if (this._closed) {
      return
    }
    this._closed = true;

    if (this._currentMediaSession) {
      const dest = this._currentMediaSession;
      const txn  = Util.createTransactionId();
      logger.info("%s send RTC bye on closing", this._logHeader())
      this.emit("room:rtc:bye", this._nickname, txn, dest, "closed");
    }

    if (this._ready) {
      logger.info("%s <- @logout", this._logHeader())
      this.emit("system:logout", this._nickname);
    }

    this.emit("system:close");

    this._clearEventListeners()

    this._conn.close();
  }

  _clearEventListeners() {
    [
      "system:login",
      "system:logout",
      "system:close",
      "direct:chat",
      "direct:rtc:offer",
      "direct:rtc:answer",
      "direct:rtc:candidates",
      "direct:rtc:bye",
      "room:join",
      "room:leave",
      "room:chat",
      "room:rtc:offer",
      "room:rtc:answer",
      "room:rtc:candidates",
      "room:rtc:bye"
    ].forEach(eventName => {
      this.removeAllListeners(eventName);
    })

  }
}

