export interface IceServerSetting {
  urls:        string[];
  username?:   string;
  credential?: string;
}

export class NetworkSetting {

  private iceServers: IceServerSetting[] = [];

  addServer(url: string, username?: string, credential?: string) {
    let setting: IceServerSetting = { urls: [url] };
    if (username) {
      setting.username = username;
    }
    if (credential) {
      setting.credential = credential;
    }
    this.iceServers.push(setting);
  }

  createConfiguration(): any {
    return {
      iceServers: this.iceServers,
    }
  }
}

export default NetworkSetting;
