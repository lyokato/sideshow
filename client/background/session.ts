import { DirectVideoElementSlot, RoomVideoElementSlot } from './element_slot';
import ElementHelper from './element_helper';
import PeerHelper from './peer_helper';
import EasyRTC from '../rtc';
import PeerConnection from '../rtc/connection';
import * as smsp from '../smsp';
import { createAction } from '../action';
import Logger from '../logger';
import { MessageText } from '../util';
import fetch from 'node-fetch'
import config from '../config';
import EffectView from '../effect/effect_view';
import FontTexture from '../effect/font_texture';

const VIDEO_WIDTH: number  = 300;
const VIDEO_HEIGHT: number = 190;
const MAX_VIDEO_ELEMENT_NUMBER = 10;

export default class BackgroundSession {

  private _client: smsp.Client;
  private _peer?:  PeerConnection | null = null;
  private _peerTxn: string = "";
  private effectView: EffectView;
  private digitalFontAtlas: HTMLImageElement;

  private directVideoSlot: DirectVideoElementSlot =
    new DirectVideoElementSlot();

  private remoteVideoSlot: RoomVideoElementSlot =
    new RoomVideoElementSlot(MAX_VIDEO_ELEMENT_NUMBER);

  constructor(url: string,
              private store: any) {
    this._client = new smsp.Client(url);
  }

  get client(): smsp.Client {
    return this._client;
  }

  get peer(): PeerConnection | null {
    return (this._peer !== null) ? this._peer! : null;
  }

  get peerTxn(): string {
    return this._peerTxn;
  }

  hasPeer(): boolean {
    return this._peer !== null;
  }

  quitPeer(): void {
    if (this.hasPeer()) {
      this._peer!.close();
    } else {
      this.dispatchAction("live/quit", {});
    }
  }

  async startPeer(channelType: string, channelName: string, role: string) {
    if (this.hasPeer()) {
      throw new Error("peer already exists");
    }
    if (channelType === "room") {
      await this.startRoomPeer(channelName, role);
    } else {
      await this.startDirectPeer(channelName, role);
    }
  }

  private matchPeer(channelType: string, channelName: string, txn: string): boolean {
    return PeerHelper.createPeerTxn(channelType, channelName, txn) === this._peerTxn;
  }

  private initDirectPeer(userName: string, txn: string, role: string) {

    const builder = EasyRTC.builder()
      .candidateHandling("buffering")
      .remoteVideo(true)
      .iceServer("stun:stun.l.google.com:19302");

    if (role === "performer/video") {
      builder.localVideo(VIDEO_WIDTH, VIDEO_HEIGHT, true);
    } else if (role === "performer/audio") {
      builder.localAudio();
    }

    this._peer = builder.build();

    this._peerTxn = PeerHelper.createPeerTxn("direct", userName, txn);

    this.peer!.onConnected    = () => {};
    this.peer!.onCompleted    = () => {};
    this.peer!.onFailed       = () => {};
    this.peer!.onDisconnected = () => {};

    this.peer!.onClosed = () => {

      this._peerTxn = "";
      this._peer = null;

      this.directVideoSlot.clear();

      setTimeout(() => {
        this.dispatchAction("live/quit", {});
      }, 200);

    };

    this.peer!.onLocalIceCandidates = (candidates: RTCIceCandidate[]) => {
      Logger.info("[APP:SESSION] -> @direct:rtc:candidates");
      this.client.sendDirectRTCCandidates(userName, candidates, txn);
    };

    this.directVideoSlot.prepare();

    this.peer!.onAddLocalStream = (stream: MediaStream) => {

      Logger.info("[APP:SESSION] @direct:local_stream:add:" + stream.id);

      const element = this.directVideoSlot.localVideo;
      ElementHelper.attachStream(element, "01", stream, true);
    };

    this.peer!.onAddRemoteStream = (stream: MediaStream) => {

      Logger.info("[APP:SESSION] @direct:remote_stream:add:" + stream.id);

      const element = this.directVideoSlot.remoteVideo;
      ElementHelper.attachStream(element, "02", stream, false);
    };

    this.peer!.onRemoveRemoteStream = (stream: MediaStream) => {

      Logger.info("[APP:SESSION] @direct:remote_stream:remove:" + stream.id);

      const element = this.directVideoSlot.remoteVideo;
      element.pause();
      element.srcObject = null;

    };
  }

  private async startDirectPeer(userName: string, role: string) {
    const txn: string = Date.now().toString();
    this.initDirectPeer(userName, txn, role);
    const sdp = await this.peer!.createOffer();
    Logger.info("[APP:SESSION] -> @direct:rtc:offer")
    const options = {
      publishVideo: role === "performer/video",
      publishAudio: role !== "audience",
      planB: true, // FIXME
    };
    this.client.sendDirectRTCOffer(userName, sdp!, options, txn);
  }

  private async startRoomPeer(roomName: string, role: string) {

    const builder = EasyRTC.builder()
      .candidateHandling("dumb")
      .remoteVideo(true);

    if (role === "performer/video") {
      builder.localVideo(VIDEO_WIDTH, VIDEO_HEIGHT, true);
    } else if (role === "performer/audio") {
      builder.localAudio();
    }

    this._peer = builder.build();

    const txn: string = Date.now().toString();
    this._peerTxn = PeerHelper.createPeerTxn("room", roomName, txn);

    this.peer!.onConnected    = () => {};
    this.peer!.onCompleted    = () => {};
    this.peer!.onFailed       = () => {};
    this.peer!.onDisconnected = () => {};

    this.peer!.onClosed  = () => {

      this._peerTxn = "";
      this._peer = null;

      this.remoteVideoSlot.clear();

      setTimeout(() => {
        this.dispatchAction("live/quit", {});
      }, 200);

    };

    this.remoteVideoSlot.clear();

    this.peer!.onAddLocalStream = (stream: MediaStream) => {

      Logger.info("[APP:SESSION] @room:local_stream:add:" + stream.id);

      if (!this.remoteVideoSlot.hasEmpty()) {
        Logger.info("[APP:SESSION] no empty video display slot");
        return;
      }

      const element = this.remoteVideoSlot.checkout(stream.id);
      const num     = this.remoteVideoSlot.counterText;

      ElementHelper.attachStream(element, num, stream, true);
    };

    this.peer!.onAddRemoteStream = (stream: MediaStream) => {

      Logger.debug("[APP:SESSION] @room:remote_stream:add:" + stream.id);

      if (!this.remoteVideoSlot.hasEmpty()) {
        Logger.warn("[APP:SESSION] no empty video display slot");
        return;
      }

      const element = this.remoteVideoSlot.checkout(stream.id);
      const num     = this.remoteVideoSlot.counterText;

      ElementHelper.attachStream(element, num, stream, false);
    };

    this.peer!.onRemoveRemoteStream = (stream: MediaStream) => {
      Logger.debug("[APP:SESSION] @room:remote_stream:remove:" + stream.id);
      this.remoteVideoSlot.checkin(stream.id);
    };

    const sdp = await this.peer!.createCapabilities();
    Logger.info("[APP:SESSION] -> @room:rtc:offer")

    const options = {
      publishVideo: role === "performer/video",
      publishAudio: role !== "audience",
      planB: true, // FIXME
    };

    this.client.sendRoomRTCOffer(roomName, sdp!, options, txn);
  }

  start(): void {

    this.client.onConnected = () => {
      Logger.info("[APP:SESSION] <- @open");
      this.dispatchAction("session/state", {
        connected: true,
      });
    };

    this.client.onClose = () => {
      Logger.info("[APP:SESSION] <- @close");
      this.dispatchAction("session/state", {
        connected: false,
      });
    };

    this.client.onError = (msg: string) => {
      Logger.info("[APP:SESSION] <- @error");
      this.dispatchAction("session/error", {
        message: msg
      });
    };

    this.client.onReady = (txn: string, nickname: string) => {
      Logger.info("[APP:SESSION] <- @ready");
      this.effectView.goSlow();
      this.dispatchAction("session/state/ready", {
        nickname: nickname
      });
    };

    this.client.onDirectChatMessage = (txn: string, user: string, text: string) => {
      Logger.info("[APP:SESSION] <- @direct:chat");
      this.dispatchAction("direct/chat/history", {
        user: user,
        text: text,
        mine: false,
      });

      const result = MessageText.parse(text, 0);
      if (result.urls.length > 0) {
        Logger.info("[APP:SESSION] found URL in chat-text, start to fetch metadata.");
        this.fetchURLs("direct", user, result.urls).catch((err: Error) => {
          Logger.warn("[APP:SESSION] failed to fetch URL: " + err.message);
        });
      }
    };

    this.client.onDirectRTCOffer = (txn: string, user: string, offer: string) => {
      Logger.info("[APP:SESSION] <- @direct:rtc:offer");
      this.initDirectPeer(user, txn, "performer/video");
      this.peer!.processRemoteOffer(offer)
        .then((answer:string) => {
          Logger.info("[APP:SESSION] -> @direct:rtc:answer")
          this.client.sendDirectRTCAnswer(user, answer, txn);
        }).catch((err: Error) => {
          Logger.error("[APP:SESSION] failed to process remote offer: " + err.message);
          if (this._peer != null) {
            this._peer.close();
          }
        });
    };

    this.client.onDirectRTCAnswer = (txn: string, user: string, answer: string) => {
      Logger.info("[APP:SESSION] <- @direct:rtc:answer");

      if (!this.matchPeer("direct", user, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }

      this._peer.processRemoteAnswer(answer)
        .catch((err: Error) => {
          Logger.error("[APP:SESSION] failed to process remote answer: " + err.message);
          if (this._peer != null) {
            this._peer.close();
          }
        });
    };

    this.client.onDirectRTCCandidate = (txn: string, user: string, candidate: any) => {
      Logger.info("[APP:SESSION] <- @direct:rtc:candidate");

      if (!this.matchPeer("direct", user, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }

      this._peer.addRemoteIceCandidate(candidate)
        .catch((err: Error) => {
          Logger.error("[APP:SESSION] failed to process remote candidate: " + err.message);
          if (this._peer != null) {
            this._peer.close();
          }
        });

    };

    this.client.onDirectRTCBye = (txn: string, user: string, reason?: string): void => {
      Logger.info("[APP:SESSION] <- @direct:rtc:bye");

      if (!this.matchPeer("direct", user, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }

       this._peer.close()
    };

    this.client.onRoomChatMessage = (txn: string, room: string, member: string, text: string): void => {
      Logger.info("[APP:SESSION] <- @room:chat");


      this.dispatchAction("room/chat/history", {
        room:   room,
        member: member,
        text:   text,
      });

      const result = MessageText.parse(text, 0);
      if (result.urls.length > 0) {
        Logger.info("[APP:SESSION] found URL in chat-text, start to fetch metadata.");
        this.fetchURLs("room", room, result.urls).catch((err: Error) => {
          Logger.warn("[APP:SESSION] failed to fetch URL: " + err.message);
        });
      }
    };

    this.client.onJoinedRoom = (txn: string, room: string, members: string[]): void => {
      Logger.info("[APP:SESSION] <- @room:joined");
      this.dispatchAction("room/joined", {
        room:    room,
        members: members,
      });
    };

    this.client.onLeftRoom = (txn: string, room: string): void => {
      Logger.info("[APP:SESSION] <- @room:left");
      this.dispatchAction("room/left", {
        room: room,
      });
    };

    this.client.onJoinedMember = (txn: string, room: string, member: string, greeting?: string): void => {
      Logger.info("[APP:SESSION] <- @room:join");
      this.dispatchAction("room/member/joined", {
        room:     room,
        member:   member,
        greeting: greeting,
      });
    };

    this.client.onLeftMember = (txn: string, room: string, member: string, will?: string): void => {
      Logger.info("[APP:SESSION] <- @room:leave");
      this.dispatchAction("room/member/left", {
        room:   room,
        member: member,
        will:   will,
      });
    };

    this.client.onRoomRTCOffer = (txn: string, room: string, offer: string): void => {
      Logger.info("[APP:SESSION] <- @room:rtc:offer");

      if (!this.matchPeer("room", room, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }

      this._peer.processRemoteOffer(offer)
        .then((answer:string) => {
          Logger.info("[APP:SESSION] -> @room:rtc:answer");
          this.client.sendRoomRTCAnswer(room, answer, txn);
        }).catch((err:Error) => {
          Logger.error("[APP:SESSION] failed to handle remote offer: " + err.message);
          if (this._peer != null) {
            this._peer.close();
          }
        });
    };

    this.client.onRoomRTCAnswer = (txn: string, room: string, answer: string): void => {
      Logger.info("[APP:SESSION] <- @room:rtc:answer");

      if (!this.matchPeer("room", room, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }
      this._peer.processRemoteAnswer(answer)
        .catch((err: Error) => {
          Logger.error("[APP:SESSION] failed to process remote answer: " + err.message);
          if (this._peer != null) {
            this._peer.close();
          }
        })
    };

    this.client.onRoomRTCCandidate = (txn: string, room: string, candidate: any): void => {
      Logger.info("[APP:SESSION] <- @room:rtc:candidate");

      if (!this.matchPeer("room", room, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }

      this._peer.addRemoteIceCandidate(candidate)
      .catch((err:Error) => {
        Logger.error("[APP:SESSION] failed to process remote candidate:" + err.message);
        if (this._peer != null) {
          this._peer.close();
        }
      });
    };

    this.client.onRoomRTCBye = (txn: string, room: string, reason?:string): void => {

      Logger.info("[APP:SESSION] <- @room:rtc:bye");

      if (!this.matchPeer("room", room, txn)) {
        Logger.warn("[APP:SESSION] matched peer connection not found")
        return
      }

      if (!this._peer) {
        Logger.warn("[APP:SESSION] peer not found")
        return
      }

      this._peer.close();
    };

    this.client.connect();
  }

  async fetchURLs(chType:string, chName: string,  urls: string[]) {

    for (let url of urls) {

      Logger.info("[APP:SESSION] @api:fetch " + url);

      const res  = await fetch(config.fetchEndpoint + "?url=" + encodeURIComponent(url));
      const json = await res.json();

      if ("error" in json) {

        Logger.warn("[APP:SESSION] fetch failure: " + json["error"])
      } else if ("result" in json) {

        const result = json["result"]
        Logger.debug(JSON.stringify(result));

        if (chType === "room") {

          this.dispatchAction("room/chat/ref", {
            room:        chName,
            url:         url,
            title:       result["title"],
            description: result["description"],
            image:       result["image"],
          });

        } else if (chType === "direct") {

          this.dispatchAction("direct/chat/ref", {
            user:        chName,
            url:         url,
            title:       result["title"],
            description: result["description"],
            image:       result["image"],
          });

        }
      }
    }
  }

  login(nickname: string, txn: string): void {
    if (!this.clientIsAvailable()) {
      return;
    }
    this.client.login(nickname, txn);
  }

  sendRoomChat(room: string, text: string): void {
    if (!this.clientIsAvailable()) {
      return;
    }
    Logger.info("[APP:SESSION] -> @room:chat");
    this.client.sendRoomChat(room, text);
  }

  joinRoom(room: string, greeting?: string): void {
    if (!this.clientIsAvailable()) {
      return;
    }
    Logger.info("[APP:SESSION] -> @room:join");
    this.client.joinRoom(room, greeting);
  }

  leaveRoom(room: string, will: string): void {
    if (!this.clientIsAvailable()) {
      return;
    }
    Logger.info("[APP:SESSION] -> @room:leave");
    this.client.leaveRoom(room, will);
  }


  sendDirectChat(user: string, text: string):void {
    if (!this.clientIsAvailable()) {
      return;
    }
    this.dispatchAction("direct/chat/history", {
      user: user,
      text: text,
      mine: true,
    });

    Logger.info("[APP:SESSION] -> @direct:chat");
    this.client.sendDirectChat(user, text);

    const result = MessageText.parse(text, 0);
    if (result.urls.length > 0) {
      Logger.info("[APP:SESSION] found URL in chat-text, start to fetch metadata.");
      this.fetchURLs("direct", user, result.urls).catch((err: Error) => {
        Logger.warn("[APP:SESSION] failed to fetch URL: " + err.message);
      });
    }

  }

  dispatchAction(actionType: string, params: any): void {
     this.store.dispatch(createAction(actionType, params));
  }

  clientIsAvailable(): boolean {
    return (this.client && this.client.isConnected);
  }

  async loadDigitalFont() {
    if (this.digitalFontAtlas) {
      return this.digitalFontAtlas;
    }
    const fontTexture = new FontTexture({
      name: "Orbitron",
      url: "https://fonts.googleapis.com/css?family=Orbitron:700"
    });
    const image = await fontTexture.createAtlas({
      fontSize         : 140,
      fontStyle        : "700",
      text             : "0123456789ABCDEF",
      slotNum          : 4,
      imgLen           : 512,
      verticalAdjuster : 14,
    });
    this.digitalFontAtlas = image;
    return image;
  }

  startBackgroundEffect(): void {
    const container = <HTMLElement>document.getElementById("background")!;
    this.effectView = new EffectView(container);
    this.loadDigitalFont().then((image: HTMLImageElement) => {
      this.effectView.start(image);
    }).catch((err: Error) => {
      Logger.warn("[APP:SESSION] failed to start background effect: " + err.message);
    });
  }
}

