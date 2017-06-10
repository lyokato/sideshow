import PeerConnection from './connection';
import { LocalCandidateHandlerType,
         LocalCandidateHandlerFactory } from './candidate_handler';
import { LocalMediaSetting,
         NullLocalMediaSetting,
         LocalAudioSetting,
         LocalVideoSetting } from './local_media_setting';
import { RemoteMediaSetting,
         NullRemoteMediaSetting,
         RemoteAudioSetting,
         RemoteVideoSetting } from './remote_media_setting';
import NetworkSetting from './network_setting';
import MediaSetting from './media_setting';
import { NullSimulcastAnswerModifier } from './simulcast';

export class Builder {

  private network              : NetworkSetting            = new NetworkSetting();
  private localMediaSetting    : LocalMediaSetting         = new NullLocalMediaSetting();
  private remoteMediaSetting   : RemoteMediaSetting        = new NullRemoteMediaSetting();
  private candidateHandlerType : LocalCandidateHandlerType = "buffering"

  remoteAudio(): Builder {
    this.remoteMediaSetting = new RemoteAudioSetting();
    return this;
  }

  remoteVideo(audio: boolean = true): Builder {
    this.remoteMediaSetting = new RemoteVideoSetting(audio);
    return this;
  }

  localAudio(): Builder {
    this.localMediaSetting = new LocalAudioSetting();
    return this;
  }

  localVideo(width: number,
             height: number,
             audio: boolean = true): Builder {
    this.localMediaSetting = new LocalVideoSetting(width, height, audio);
    return this;
  }

  candidateHandling(handlerType: LocalCandidateHandlerType): Builder {
    this.candidateHandlerType = handlerType;
    return this;
  }

  iceServer(url: string, username?: string, credential?: string): Builder {
    this.network.addServer(url, username, credential);
    return this;
  }

  build(): PeerConnection {
    const mediaSetting = new MediaSetting(this.localMediaSetting,
                                          this.remoteMediaSetting)

    const localCandidateHandler =
      LocalCandidateHandlerFactory.create(this.candidateHandlerType);

    // TODO make this configurable
    const simulcastAnswerModifier = new NullSimulcastAnswerModifier();

    return new PeerConnection(this.network,
                              mediaSetting,
                              simulcastAnswerModifier,
                              localCandidateHandler);
  }

}

export default Builder;
