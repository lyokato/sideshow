import { LocalCandidateHandlerListener,
         LocalCandidateHandler } from './candidate_handler';
import { LocalMediaSettingCallback } from './local_media_setting'
import { MediaSetting } from './media_setting'
import { NetworkSetting } from './network_setting'

import { SimulcastAnswerModifier } from './simulcast'
import Logger from '../logger';

export type SDPModifier           = (type: string, sdp: string) => string;
export type MediaStreamCallback   = (stream: MediaStream) => void;
//export type RTCTrackCallback      = (ev: RTCTrackEvent) => void;
export type DescriptionCallback   = (ev: RTCSessionDescription) => void;
export type StateCallback         = () => void;
export type IceCandidatesCallback = (candidates: RTCIceCandidate[]) => void;

export class PeerConnection implements LocalCandidateHandlerListener, LocalMediaSettingCallback {

  private conn: RTCPeerConnection;

  private closing: boolean = false;
  private _sdpModifier: SDPModifier = (type: string, sdp: string) => { return sdp  };
  private sdpConstraints: any = {};
  private localStream: MediaStream | null = null;

  private _onAddLocalStream: MediaStreamCallback | null = (stream: MediaStream) => {};
  //private _onAddRemoteTrack: RTCTrackCallback = (ev: RTCTrackEvent) => {};
  private _onAddRemoteStream: MediaStreamCallback | null = (stream: MediaStream) => {};
  private _onRemoveRemoteStream: MediaStreamCallback | null = (stream: MediaStream) => {};
  private _onVanillaIceDescription: DescriptionCallback | null = (desc: RTCSessionDescription) => {};
  private _onLocalIceCandidates: IceCandidatesCallback | null = (candidates: RTCIceCandidate[]) => {};
  private _onConnected: StateCallback | null = () => {};
  private _onCompleted: StateCallback | null = () => {};
  private _onFailed: StateCallback | null = () => {};
  private _onDisconnected: StateCallback | null = () => {};
  private _onClosed: StateCallback | null = () => {};

  private initialNegotiationDone: boolean = false;

  constructor(private networkSetting:          NetworkSetting,
              private mediaSetting:            MediaSetting,
              private simulcastAnswerModifier: SimulcastAnswerModifier,
              private localCandidateHandler:   LocalCandidateHandler) {

    this.localCandidateHandler.setListener(this);
    this.mediaSetting.modifySDPConstraints(this.sdpConstraints);
    this.initPeerConnection();
  }

  onLocalCandidateHandlerPushCandidate(candidate: RTCIceCandidate) {
    this._onLocalIceCandidates!([candidate]);
  }

  onLocalCandidateHandlerPushCandidates(candidates: RTCIceCandidate[]) {
    this._onLocalIceCandidates!(candidates);
  }

  private initPeerConnection(): void {
    this.conn = new RTCPeerConnection(
      this.networkSetting.createConfiguration());
    this.conn.onsignalingstatechange = this.onConnectionSignalingStateChange;
    this.conn.onicegatheringstatechange = this.onConnectionIceGatheringStateChange;
    this.conn.onnegotiationneeded = this.onConnectionNegotiationNeeded;
    this.conn.onicecandidate = this.onConnectionIceCandidate;
    /*
    if ("ontrack" in this.conn) {
      this.conn.ontrack = this.onConnectionTrack;
    } else {
   */
    this.conn.onaddstream = this.onConnectionAddStream;
    //}
    this.conn.onremovestream = this.onConnectionRemoveStream;
    this.conn.oniceconnectionstatechange = this.onConnectionIceConnectionStateChange;
  }

  onConnectionSignalingStateChange = (ev: Event) => {
    Logger.debug("[RTC] @signaling_state:" + this.conn.signalingState);
  };

  onConnectionIceGatheringStateChange = (ev: Event) => {
    Logger.debug("[RTC] @ice_gathering_state:" + this.conn.iceGatheringState);
  };

  onConnectionNegotiationNeeded = (ev: Event) => {
    Logger.debug("[RTC] @negotiation_needed");
  };

  onConnectionIceCandidate = (ev: RTCPeerConnectionIceEvent) => {

    if (this.closing) {
      return;
    }

    if (ev.candidate) {
      this.localCandidateHandler.handleCandidate(ev.candidate);
    } else if (this.conn.localDescription) {
      this._onVanillaIceDescription!(this.conn.localDescription);
    }
  };

  /*
  onConnectionTrack = (ev: RTCTrackEvent) => {

    if (this.closing) {
      return;
    }

    this._onAddRemoteTrack(ev);
  };
 */

  addLocalStream = (stream: MediaStream) => {
    this.localStream = stream;
    this.conn.addStream(stream);
    this._onAddLocalStream!(stream);
  };

  onConnectionAddStream = (ev: MediaStreamEvent) => {

    if (this.closing) {
      return;
    }

    if (!ev.stream) {
      return;
    }

    const stream = ev.stream!;

    this._onAddRemoteStream!(stream);
  };

  onConnectionRemoveStream = (ev: MediaStreamEvent) => {

    if (this.closing) {
      return;
    }

    if (!ev.stream) {
      return;
    }

    const stream = ev.stream!;

    this._onRemoveRemoteStream!(stream);
  };

  onConnectionIceConnectionStateChange = (ev: Event) => {
      Logger.debug("[RTC] @ice_state:" + this.conn.iceConnectionState)
      if (this.closing) {
        return;
      }
      switch (this.conn.iceConnectionState) {
        case "connected":
          this._onConnected!();
          break;
        case "completed":
          this._onCompleted!();
          break;
        case "failed":
          this._onFailed!();
          this.close();
          break;
        case "disconnected":
          this._onDisconnected!();
          this.close();
          break;
        case "closed":
          this.close();
          break;
      }
  };

  /*
  set onAddRemoteTrack(callback: RTCTrackCallback) {
    this._onAddRemoteTrack = callback;
  }
 */

  set onAddLocalStream(callback: MediaStreamCallback) {
    this._onAddLocalStream = callback;
  }

  set onAddRemoteStream(callback: MediaStreamCallback) {
    this._onAddRemoteStream = callback;
  }

  set onRemoveRemoteStream(callback: MediaStreamCallback) {
    this._onRemoveRemoteStream = callback;
  }

  set sdpModifier(modifier: SDPModifier) {
    this._sdpModifier = modifier;
  }

  set onVanillaIceDescription(callback: DescriptionCallback) {
    this._onVanillaIceDescription = callback;
  }

  set onLocalIceCandidates(callback: IceCandidatesCallback) {
    this._onLocalIceCandidates = callback;
  }

  set onConnected(callback: StateCallback) {
    this._onConnected = callback;
  }

  set onDisconnected(callback: StateCallback) {
    this._onDisconnected = callback;
  }

  set onCompleted(callback: StateCallback) {
    this._onCompleted = callback;
  }

  set onFailed(callback: StateCallback) {
    this._onFailed = callback;
  }

  set onClosed(callback: StateCallback) {
    this._onClosed = callback;
  }

  async addRemoteIceCandidate(candidate: RTCIceCandidate) {
    if (this.closing) {
      return Promise.reject("already closing");
    }
    await this.conn.addIceCandidate(candidate);
  }

  private filterSDP(desc: RTCSessionDescription): RTCSessionDescription {
    const descType = desc.type || "offer";
    const descSDP  = desc.sdp || "";
    const filtered = this._sdpModifier(descType, descSDP);
    return new RTCSessionDescription({
      type: descType,
      sdp:  filtered,
    });
  }

  async createCapabilities() {
    if (this.closing) {
      return Promise.reject("already closing");
    }
    const offer = await this.conn.createOffer(this.sdpConstraints);
    const result = this.filterSDP(offer);
    return result.sdp;
  }

  async createOffer() {
    if (this.closing) {
      return Promise.reject("already closing");
    }
    await this.mediaSetting.prepareLocalMedia(this);
    const offer = await this.conn.createOffer(this.sdpConstraints);
    const result = this.filterSDP(offer);
    await this.conn.setLocalDescription(result);
    return result.sdp;
  }

  async processRemoteOffer(sdp: string) {
    if (this.closing) {
      return Promise.reject("already closing");
    }
    await this.mediaSetting.prepareLocalMedia(this);
    Logger.info("[RTC] @remote_offer");
    Logger.debug(sdp);
    const desc = new RTCSessionDescription({type: "offer", sdp: sdp});
    await this.conn.setRemoteDescription(desc);
    const answer  = await this.conn.createAnswer(this.sdpConstraints);
    const answer2 = this.filterAnswer(answer);
    const result  = this.filterSDP(answer2);
    await this.conn.setLocalDescription(result);
    this.localCandidateHandler.onOfferAnswerExchanged();
    this.initialNegotiationDone = true;
    Logger.info("[RTC] @local_answer");
    Logger.debug(result.sdp!);
    return result.sdp;
  }

  filterAnswer(answer: RTCSessionDescription): RTCSessionDescription {
    if (this.initialNegotiationDone) {
      // if this is not first time, just return
      return answer;
    }
    const filtered = this.simulcastAnswerModifier.modify(answer.sdp!);
    return new RTCSessionDescription({type: "answer", sdp: filtered});
  }

  async processRemoteAnswer(sdp: string) {
    if (this.closing) {
      return Promise.reject("already closing");
    }
    Logger.info("[RTC] @remote_answer");
    Logger.debug(sdp);
    const desc = new RTCSessionDescription({type: "answer", sdp: sdp});
    await this.conn.setRemoteDescription(desc);
    this.localCandidateHandler.onOfferAnswerExchanged();
    return;
  }

  private releasePeerConnectionCallbacks(): void {
    /*
    this.conn.onsignalingstatechange = null;
    this.conn.onicegatheringstatechange = null;
    this.conn.onnegotiationneeded = null;
    this.conn.onicecandidate = null;
    if ("ontrack" in this.conn) {
      this.conn.ontrack = null;
    } else {
      this.conn.onaddstream = null;
    }
    this.conn.onremovestream = null;
    this.conn.oniceconnectionstatechange = null;
    */

    // this.conn = null;
  }

  close() {
    if (this.closing) {
      return;
    }
    this.closing = true;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      this.localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      this.conn.removeStream(this.localStream!);
    }
    this.conn.close();
    this._onClosed!();
    this.localCandidateHandler.release();
    this.releasePeerConnectionCallbacks();
    //this._onAddRemoteTrack = null;
    this._onAddLocalStream = null;
    this._onAddRemoteStream = null;
    this._onRemoveRemoteStream = null;
    this._onVanillaIceDescription = null;
    this._onConnected = null;
    this._onCompleted = null;
    this._onFailed = null;
    this._onDisconnected = null;
    this._onLocalIceCandidates = null;
    this._onClosed = null;
  }

}

export default PeerConnection;
