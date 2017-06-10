
export interface LocalMediaSettingCallback {
  addLocalStream(stream: MediaStream): void;
}

export interface LocalMediaSetting {
  prepare(conn: LocalMediaSettingCallback): Promise<void>;
}

export class NullLocalMediaSetting implements LocalMediaSetting {
  async prepare(conn: LocalMediaSettingCallback) {
    return;
  }
}

export class LocalVideoSetting implements LocalMediaSetting {

  private prepared: boolean = false;

  constructor(private width:  number,
              private height: number,
              private audio:  boolean = true) {}

  async prepare(conn: LocalMediaSettingCallback) {

    if (this.prepared) {
      return;
    }

    const constraints = {
      video: { width: this.width, height: this.height },
      audio: this.audio,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    conn.addLocalStream(stream);

    this.prepared = true;

    return;
  }

}

export class LocalAudioSetting implements LocalMediaSetting {

  private prepared: boolean = false;

  constructor() {}

  async prepare(conn: LocalMediaSettingCallback) {

    if (this.prepared) {
      return;
    }

    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({audio: true});

    conn.addLocalStream(stream);

    this.prepared = true;

    return;
  }
}

export default LocalMediaSetting;
