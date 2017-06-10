export interface SDPConstraints {
  offerToReceiveAudio?: boolean;
  offerToReceiveVideo?: boolean;
}

export interface RemoteMediaSetting {
  modifySDPConstraints(constraints: SDPConstraints): void;
}

export class NullRemoteMediaSetting implements RemoteMediaSetting {
  modifySDPConstraints(constraints: SDPConstraints): void {
    // do nothing
  }
}

export class RemoteAudioSetting implements RemoteMediaSetting {
  modifySDPConstraints(constraints: SDPConstraints): void {
    constraints.offerToReceiveAudio = true;
    constraints.offerToReceiveVideo = false;
  }
}

export class RemoteVideoSetting implements RemoteMediaSetting {

  constructor(private audio: boolean = true) {}

  modifySDPConstraints(constraints: SDPConstraints): void {
    constraints.offerToReceiveAudio = this.audio;
    constraints.offerToReceiveVideo = true;
  }
}

export default RemoteMediaSetting;
