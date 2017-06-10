import Logger from './logger';

export type StateCallback = () => void;
export type ErrorCallback = (message: string) => void;
export type ReadyCallback = (txn: string, nickname: string) => void;
export type RoomChatMessageCallback = (txn: string, room: string, member: string, text: string) => void;
export type DirectChatMessageCallback = (txn: string, user: string, text: string) => void;
export type JoinedMemberCallback = (txn: string, room: string, member: string, greeting?: string) => void;
export type LeftMemberCallback = (txn: string, room: string, member: string, will?: string) => void;
export type JoinedRoomCallback = (txn: string, room: string, members: string[]) => void;
export type LeftRoomCallback = (txn: string, room: string) => void;
export type RoomRTCOfferCallback = (txn: string, room: string, offer: string) => void;
export type RoomRTCAnswerCallback = (txn: string, room: string, answer: string) => void;
export type RoomRTCCandidateCallback = (txn: string, room: string, candidate: any) => void;
export type RoomRTCByeCallback = (txn: string, room: string, reason?: string) => void;
export type DirectRTCOfferCallback = (txn: string, user: string, offer: string) => void;
export type DirectRTCAnswerCallback = (txn: string, user: string, answer: string) => void;
export type DirectRTCCandidateCallback = (txn: string, user: string, candidate: any) => void;
export type DirectRTCByeCallback = (txn: string, user: string, reason?: string) => void;

export interface RTCOfferOptions {
  publishAudio: boolean;
  publishVideo: boolean;
  planB:        boolean;
};

class Sender {

  static parse(from: string): Sender {
    if (from === "system") {
      return new Sender("system",  "");
    } else if (from.match(/^room\:([a-zA-Z0-9_]+)$/)) {
      return new Sender("room", RegExp.$1);
    } else if (from.match(/^user\:([a-zA-Z0-9_]+)$/)) {
      return new Sender("user", RegExp.$1);
    } else {
      throw new Error("invalid 'from' format")
    }
  }

  private _type: string;
  private _name: string;

  constructor(type: string,
              name: string) {
    this._type = type;
    this._name = name;
  }

  get type(): string {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get isSystem(): boolean {
    return (this._type === "system");
  }
  get isRoom(): boolean {
    return (this._type === "room");
  }
  get isUser(): boolean {
    return (this._type === "user");
  }
}

export class Client {

  private ready:     boolean = false;
  private connected: boolean = false;

  private socket: WebSocket | null;

  private _onConnected: StateCallback = () => {};
  private _onClose: StateCallback = () => {};
  private _onError: ErrorCallback = () => {};

  private _onReady: ReadyCallback | null = (txn: string, nickname: string) => {};
  private _onRoomChatMessage: RoomChatMessageCallback | null = (txn: string, room: string, member: string, text: string) => {};
  private _onDirectChatMessage: DirectChatMessageCallback | null = (txn: string, user: string, text: string) => {};
  private _onJoinedMember: JoinedMemberCallback | null = (txn: string, room: string, member: string, greeting?: string) => {};
  private _onLeftMember: LeftMemberCallback | null = (txn: string, room: string, member: string, will?: string) => {};
  private _onJoinedRoom: JoinedRoomCallback | null = (txn: string, room: string, members: string[]) => {};
  private _onLeftRoom: LeftRoomCallback | null = (txn: string, room: string) => {};

  private _onRoomRTCOffer: RoomRTCOfferCallback | null = (txn: string, room: string, offer: string) => {};
  private _onRoomRTCAnswer: RoomRTCAnswerCallback | null = (txn: string, room: string, answer: string) => {};
  private _onRoomRTCCandidate: RoomRTCCandidateCallback | null = (txn: string, room: string, candidate: any) => {};
  private _onRoomRTCBye: RoomRTCByeCallback | null = (txn: string, room: string, reason?: string) => {};

  private _onDirectRTCOffer: DirectRTCOfferCallback | null = (txn: string, user: string, offer: string) => {};
  private _onDirectRTCAnswer: DirectRTCAnswerCallback | null = (txn: string, user: string, answer: string) => {};
  private _onDirectRTCCandidate: DirectRTCCandidateCallback | null = (txn: string, user: string, candidate: any) => {};
  private _onDirectRTCBye: DirectRTCByeCallback | null = (txn: string, user: string, reason?: string) => {};

  constructor(private url: string) {
  }

  get isReady():boolean {
    return this.ready;
  }

  get isConnected():boolean {
    return this.connected;
  }

  set onConnected(callback: StateCallback) {
    this._onConnected = callback;
  }

  set onError(callback: ErrorCallback) {
    this._onError = callback;
  }

  set onClose(callback: StateCallback) {
    this._onClose = callback;
  }

  set onReady(callback: ReadyCallback) {
    this._onReady = callback;
  }

  set onRoomChatMessage(callback: RoomChatMessageCallback) {
    this._onRoomChatMessage = callback;
  }

  set onDirectChatMessage(callback: DirectChatMessageCallback) {
    this._onDirectChatMessage = callback;
  }

  set onJoinedMember(callback: JoinedMemberCallback) {
    this._onJoinedMember = callback;
  }

  set onLeftMember(callback: LeftMemberCallback) {
    this._onLeftMember = callback;
  }

  set onJoinedRoom(callback: JoinedRoomCallback) {
    this._onJoinedRoom = callback;
  }

  set onLeftRoom(callback: LeftRoomCallback) {
    this._onLeftRoom = callback;
  }

  set onRoomRTCOffer(callback: RoomRTCOfferCallback) {
    this._onRoomRTCOffer = callback;
  }

  set onRoomRTCAnswer(callback: RoomRTCAnswerCallback) {
    this._onRoomRTCAnswer = callback;
  }

  set onRoomRTCCandidate(callback: RoomRTCCandidateCallback) {
    this._onRoomRTCCandidate = callback;
  }

  set onRoomRTCBye(callback: RoomRTCByeCallback) {
    this._onRoomRTCBye = callback;
  }

  set onDirectRTCOffer(callback: DirectRTCOfferCallback) {
    this._onDirectRTCOffer = callback;
  }

  set onDirectRTCAnswer(callback: DirectRTCAnswerCallback) {
    this._onDirectRTCAnswer = callback;
  }

  set onDirectRTCCandidate(callback: DirectRTCCandidateCallback) {
    this._onDirectRTCCandidate = callback;
  }

  set onDirectRTCBye(callback: DirectRTCByeCallback) {
    this._onDirectRTCBye = callback;
  }


  connect(): void {
    if (this.connected) {
      return;
    }
    this.socket = new WebSocket(this.url, "smsp-protocol");

    this.socket.onopen = (e: Event) => {
      this.connected = true;
      this._onConnected!();
    };

    this.socket.onclose = (e: Event) => {
      this.connected = false;
      this.ready = false;
      this._onClose!();
    };

    this.socket.onerror = (e: Event) => {
      this._onError!(e.toString());
    };

    this.socket.onmessage = this.onSocketMessage;
  }

  onSocketMessage = (e: MessageEvent) => {

    if (e && e.data) {

      Logger.info("[SMSP] @Message")

      let data: any;

      try {

        data = JSON.parse(e.data);

      } catch (err) {

        Logger.warn("[SMSP] [bad_message] failed to parse JSON: " + err.message);
        return;
      }

      for (let key of ["from", "txn", "type"]) {
        if (!this.validateParam(data, key, "string")) {
          return
        }
      }

      if (!this.validateParam(data, "content", "object")) {
        return;
      }

      const from    = data.from;
      const txn     = data.txn;
      const type    = data.type;
      const content = data.content;

      let sender: Sender;
      try {
        sender = Sender.parse(from);
      } catch (err) {
        Logger.warn("[SMSP] [bad_message] 'from' is invalid format: " + from);
        return;
      }

      switch (type) {
        case "ready":
          this.handleReadyMessage(sender, txn, content)
          break;
        case "chat":
          this.handleChatMessage(sender, txn, content)
          break;
        case "joined":
          this.handleJoinedMessage(sender, txn, content)
          break;
        case "left":
          this.handleLeftMessage(sender, txn, content)
          break;
        case "join":
          this.handleJoinMessage(sender, txn, content)
          break;
        case "leave":
          this.handleLeaveMessage(sender, txn, content)
          break;
        case "rtc:offer":
          this.handleRTCOfferMessage(sender, txn, content)
          break;
        case "rtc:answer":
          this.handleRTCAnswerMessage(sender, txn, content)
          break;
        case "rtc:candidates":
          this.handleRTCCandidatesMessage(sender, txn, content)
          break;
        case "rtc:bye":
          this.handleRTCByeMessage(sender, txn, content)
          break;
        default:
          Logger.warn("[SMSP] [bad_message] unknown 'type': " + type);
          return;
      }
    }

  }

  private validateParam(params: any, key: string, expectedType: string): boolean {

    if (!(key in params)) {
      Logger.warn("[SMSP] [bad_message] key not found '" + key +  "'");
      return false;
    }

    if (typeof(params[key]) !== expectedType) {
      Logger.warn("[SMSP] [bad_message] key is not a " + expectedType +  " '" + key +  "': " + typeof(params[key]));
      return false;
    }

    return true;
  }

  private handleReadyMessage(sender: Sender, txn: string, content: any) {
    if (!sender.isSystem) {
      Logger.warn("[SMSP] [bad_message] 'ready' message should be sent from 'system'");
      return;
    }

    if (!this.validateParam(content, "nickname", "string")) {
      return;
    }

    this.ready = true;
    this._onReady!(txn, content.nickname);
  }

  private handleChatMessage(sender: Sender, txn: string, content: any) {
    switch (sender.type) {
      case "room":
        this.handleRoomChatMessage(sender, txn, content);
        break;
      case "user":
        this.handleDirectChatMessage(sender, txn, content);
        break;
    }
  }

  private handleRoomChatMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "text", "string")) {
      return;
    }

    if (!this.validateParam(content, "member", "string")) {
      return;
    }

    this._onRoomChatMessage!(txn, sender.name, content.member, content.text);
  }

  private handleDirectChatMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "text", "string")) {
      return;
    }

    this._onDirectChatMessage!(txn, sender.name, content.text);
  }

  private handleJoinMessage(sender: Sender, txn: string, content: any) {

    if (!sender.isRoom) {
      Logger.warn("[SMSP] [bad_message] 'joined' message should be sent from 'room'");
      return;
    }

    if (!this.validateParam(content, "member", "string")) {
      return;
    }

    this._onJoinedMember!(txn, sender.name, content.member, content.greeting)
  }

  private handleLeaveMessage(sender: Sender, txn: string, content: any) {
    if (!sender.isRoom) {
      Logger.warn("[SMSP] [bad_message] 'leave' message should be sent from 'room'");
      return;
    }

    if (!this.validateParam(content, "member", "string")) {
      return;
    }

    this._onLeftMember!(txn, sender.name, content.member, content.will);
  }

  private handleJoinedMessage(sender: Sender, txn: string, content: any) {
    if (!sender.isRoom) {
      Logger.warn("[SMSP] [bad_message] 'join' message should be sent from 'room'");
      return;
    }

    //if (!this.validateParam(content, "members", "array")) {
    if (!this.validateParam(content, "members", "object")) {
      return;
    }

    this._onJoinedRoom!(txn, sender.name, content.members);
  }

  private handleLeftMessage(sender: Sender, txn: string, content: any) {
    if (!sender.isRoom) {
      Logger.warn("[SMSP] [bad_message] 'left' message should be sent from 'room'");
      return;
    }
    this._onLeftRoom!(txn, sender.name);
  }

  private handleRTCOfferMessage(sender: Sender, txn: string, content: any) {
    if (sender.isSystem) {
      Logger.warn("[SMSP] [bad_message] 'rtc:offer' message should not be sent from 'system'");
      return;
    }
    if (sender.isRoom) {
      this.handleRoomRTCOfferMessage(sender, txn, content);
    } else {
      this.handleDirectRTCOfferMessage(sender, txn, content);
    }
  }

  private handleRoomRTCOfferMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "sdp", "string")) {
      return;
    }

    this._onRoomRTCOffer!(txn, sender.name, content.sdp);
  }

  private handleDirectRTCOfferMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "sdp", "string")) {
      return;
    }

    this._onDirectRTCOffer!(txn, sender.name, content.sdp);
  }

  private handleRTCAnswerMessage(sender: Sender, txn: string, content: any) {
    if (sender.isSystem) {
      Logger.warn("[SMSP] [bad_message] 'rtc:offer' message should not be sent from 'system'");
      return;
    }
    if (sender.isRoom) {
      this.handleRoomRTCAnswerMessage(sender, txn, content);
    } else {
      this.handleDirectRTCAnswerMessage(sender, txn, content);
    }
  }

  private handleRoomRTCAnswerMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "sdp", "string")) {
      return;
    }

    this._onRoomRTCAnswer!(txn, sender.name, content.sdp);
  }

  private handleDirectRTCAnswerMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "sdp", "string")) {
      return;
    }

    this._onDirectRTCAnswer!(txn, sender.name, content.sdp);
  }

  private handleRTCCandidatesMessage(sender: Sender, txn: string, content: any) {

    if (sender.isSystem) {
      Logger.warn("[SMSP] [bad_message] 'rtc:offer' message should not be sent from 'system'");
      return;
    }

    if (sender.isRoom) {
      this.handleRoomRTCCandidatesMessage(sender, txn, content);
    } else {
      this.handleDirectRTCCandidatesMessage(sender, txn, content);
    }
  }

  private handleRoomRTCCandidatesMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "candidates", "object")) {
      return;
    }

    for (let candidate of content.candidates) {
      this._onRoomRTCCandidate!(txn, sender.name, candidate);
    }
  }

  private handleDirectRTCCandidatesMessage(sender: Sender, txn: string, content: any) {

    if (!this.validateParam(content, "candidates", "object")) {
      return;
    }

    for (let candidate of content.candidates) {
      this._onDirectRTCCandidate!(txn, sender.name, candidate);
    }
  }

  private handleRTCByeMessage(sender: Sender, txn: string, content: any) {
    if (sender.isSystem) {
      Logger.warn("[SMSP] [bad_message] 'rtc:offer' message should not be sent from 'system'");
      return;
    }
    if (sender.isRoom) {
      this.handleRoomRTCByeMessage(sender, txn, content);
    } else {
      this.handleDirectRTCByeMessage(sender, txn, content);
    }
  }

  private handleRoomRTCByeMessage(sender: Sender, txn: string, content: any) {
    this._onRoomRTCBye!(txn, sender.name, content.reason);
  }

  private handleDirectRTCByeMessage(sender: Sender, txn: string, content: any) {
    this._onDirectRTCBye!(txn, sender.name, content.reason);
  }

  login(nickname: string, txn?: string): string {
    txn = txn || Date.now().toString();
    this.sendMessage({
      to: "system",
      type: "login",
      txn: txn,
      content: {
        nickname: nickname,
      }
    });
    return txn;
  }

  sendDirectChat(recipient: string, text: string, txn?: string): string {
    txn = txn || Date.now().toString(),
    this.sendMessage({
      to:   "user:" + recipient,
      type: "chat",
      txn:   txn,
      content: {
        text: text
      }
    });
    return txn;
  }

  sendDirectRTCOffer(recipient: string, offer: string, options: RTCOfferOptions, txn?: string): string {
    txn = txn || Date.now().toString(),
    this.sendMessage({
      to:   "user:" + recipient,
      type: "rtc:offer",
      txn:   txn,
      content: {
        sdp: offer,
        options: {
          publishVideo: options["publishVideo"],
          publishAudio: options["publishAudio"],
          planB:        options["planB"],
        },
      }
    });
    return txn;
  }

  sendDirectRTCAnswer(recipient: string, answer: string, txn: string): void {
    this.sendMessage({
      to:   "user:" + recipient,
      type: "rtc:answer",
      txn:   txn,
      content: {
        sdp: answer
      }
    });
  }

  sendDirectRTCCandidates(recipient: string, candidates: RTCIceCandidate[], txn: string): void {
    this.sendMessage({
      to:   "user:" + recipient,
      type: "rtc:candidates",
      txn:   txn,
      content: {
        candidates: candidates
      }
    });
  }

  sendDirectRTCBye(recipient: string, reason: string, txn: string): void {
    var reasonText = reason || ""
    this.sendMessage({
      to:   "user:" + recipient,
      type: "rtc:bye",
      txn:   txn,
      content: {
        reason: reasonText
      }
    });
  }

  sendRoomChat(room: string, text: string, txn?: string): string {
    txn = txn || Date.now().toString(),
    this.sendMessage({
      to:   "room:" + room,
      type: "chat",
      txn:   txn,
      content: {
        text: text
      }
    });
    return txn;
  }

  sendRoomRTCOffer(room: string, offer: string, options: RTCOfferOptions, txn?: string): string {
    txn = txn || Date.now().toString(),
    this.sendMessage({
      to:   "room:" + room,
      type: "rtc:offer",
      txn:   txn,
      content: {
        sdp: offer,
        options: {
          publishVideo: options["publishVideo"],
          publishAudio: options["publishAudio"],
          planB:        options["planB"],
        },
      }
    });
    return txn;
  }

  sendRoomRTCAnswer(room: string, answer: string, txn: string): void {
    this.sendMessage({
      to:   "room:" + room,
      type: "rtc:answer",
      txn:   txn,
      content: {
        sdp: answer
      }
    });
  }

  sendRoomRTCCandidates(room: string, candidates: RTCIceCandidate[], txn: string): void {
    this.sendMessage({
      to:   "room:" + room,
      type: "rtc:candidates",
      txn:   txn,
      content: {
        candidates: candidates
      }
    });
  }

  sendRoomRTCBye(room: string, reason: string, txn: string): void {
    this.sendMessage({
      to:   "room:" + room,
      type: "rtc:bye",
      txn:   txn,
      content: {
        reason: reason
      }
    });
  }

  joinRoom(room: string, greeting?: string): void {
    const greetingText = greeting || "";
    this.sendMessage({
      to:   "room:" + room,
      type: "join",
      txn:   Date.now().toString(),
      content: {
        greeting: greetingText
      }
    });
  }

  leaveRoom(room: string, will?: string): void {
    const willText = will || "";
    this.sendMessage({
      to:   "room:" + room,
      type: "leave",
      txn:   Date.now().toString(),
      content: {
        will: willText
      }
    });
  }

  sendMessage(message: any) {
    if (!this.connected) {
      Logger.info("[SMSP] socket is not connected");
      return;
    }
    var data = JSON.stringify(message);
    this.socket!.send(data);
  }

  close(): void {
    if (this.connected) {
      this.socket!.close();
    }
    this.socket = null;

    this._onReady = null;
    this._onRoomChatMessage = null;
    this._onDirectChatMessage = null;
    this._onJoinedMember = null;
    this._onLeftMember = null;
    this._onJoinedRoom = null;
    this._onLeftRoom = null;
    this._onRoomRTCOffer = null;
    this._onRoomRTCAnswer = null;
    this._onRoomRTCCandidate = null;
    this._onRoomRTCBye = null;
    this._onDirectRTCOffer = null;
    this._onDirectRTCAnswer = null;
    this._onDirectRTCCandidate = null;
    this._onDirectRTCBye = null;
  }

}
