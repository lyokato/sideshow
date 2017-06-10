import { LocalMediaSetting, LocalMediaSettingCallback } from './local_media_setting'
import { RemoteMediaSetting } from './remote_media_setting'

export class MediaSetting {
  constructor(private local: LocalMediaSetting,
              private remote: RemoteMediaSetting) {
  }

  async prepareLocalMedia(conn: LocalMediaSettingCallback) {
    return await this.local.prepare(conn);
  }

  modifySDPConstraints(constraints: any): void {
    this.remote.modifySDPConstraints(constraints)
  }
}

export default MediaSetting;
