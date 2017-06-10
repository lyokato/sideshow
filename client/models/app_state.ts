import { Record, Map, Set } from 'immutable';
import Session from './session';
import UI from './ui';
import Live from './live';
import ChannelHistory from './channel_history';

export interface AppStateParams {
  session?:  Session;
  ui?:       UI;
  live?:     Live;
  channels?: Map<string, Map<string, ChannelHistory>>;
  members?:  Map<string, Set<string>>;
};

const defaultAppState = {
  session:  new Session(),
  ui:       new UI(),
  live:     new Live(),
  channels: Map({
    "system": Map<string, ChannelHistory>({"system": new ChannelHistory()}),
    "direct": Map<string, ChannelHistory>(),
    "room":   Map<string, ChannelHistory>(),
  }),
  members: Map<string, Set<string>>(),
};

export class AppState extends Record(defaultAppState) {

  session:  Session;
  ui:       UI;
  live:     Live;
  channels: Map<string, Map<string, ChannelHistory>>;
  members:  Map<string, Set<string>>;

  constructor(params?: AppStateParams) {
    params? super(params) : super();
  }

  update(values: AppStateParams): AppState {
    return this.merge(values) as this;
  }

  chooseSystemChannel(): AppState {
    return this.chooseChannel("system", "system");
  }

  chooseChannel(chType: string, chName: string): AppState {
    return this.update({
      ui: this.ui.choose(chType, chName)
    });
  }

  addSystemLog(msg: string): AppState {
    return this.addChannelSystemLog("system", "system", msg);
  }

  addRoomChatMessage(roomName: string, speaker: string, msg: string): AppState {
    return this.addChannelMessage("room", roomName, speaker, msg);
  }

  addRoomSystemLog(roomName: string, msg: string): AppState {
    return this.addChannelSystemLog("room", roomName, msg);
  }

  addRoomChatReference(roomName: string, url: string, title: string, description: string, image?: string): AppState {
    return this.addChannelReference("room", roomName, url, title, description, image);
  }

  addDirectChatMessage(userName: string, speaker: string, msg: string): AppState {
    return this.addChannelMessage("direct", userName, speaker, msg);
  }

  addDirectChatReference(userName: string, url: string, title: string, description: string, image?: string): AppState {
    return this.addChannelReference("direct", userName, url, title, description, image);
  }

  addDirectSystemLog(userName: string, msg: string): AppState {
    return this.addChannelSystemLog("direct", userName, msg);
  }

  addChannelReference(chType: string, chName: string, url: string, title: string, description: string, image?: string): AppState {
    const newChannels = this.channels.updateIn([chType, chName], ch => {
      return ch.addReference(url, title, description, image);
    });
    return this.update({
      channels: newChannels
    });
  }

  addChannelSystemLog(chType: string, chName: string, msg: string): AppState {
    const newChannels = this.channels.updateIn([chType, chName], ch => {
      return ch.addSystemLog(msg);
    });
    return this.update({
      channels: newChannels
    });
  }

  addChannelMessage(chType: string, chName: string, speaker: string, msg: string): AppState {
    const newChannels = this.channels.updateIn([chType, chName], ch => {
      return ch.addNormalSpeech(speaker, msg);
    });
    return this.update({
      channels: newChannels
    });
  }

  enableUnreadFlag(chType: string, chName: string): AppState {
    const newChannels = this.channels.updateIn([chType, chName], ch => {
      return ch.update({hasUnread: true});
    });
    return this.update({
      channels: newChannels
    });
  }

  disableUnreadFlag(chType: string, chName: string): AppState {
    const newChannels = this.channels.updateIn([chType, chName], ch => {
      return ch.update({hasUnread: false});
    });
    return this.update({
      channels: newChannels
    });
  }

  hasDirectSession(userName: string): boolean {
    return this.channels.get("direct").has(userName);
  }

  createDirectSession(userName: string): AppState {
    const newChannels = this.channels.setIn(["direct", userName], new ChannelHistory());
    return this.update({
      channels: newChannels
    });
  }

  deleteDirectSession(userName: string): AppState {
    const newChannels = this.channels.updateIn(["direct"], ch => {
      return ch.delete(userName)
    });
    return this.update({
      channels: newChannels
    });
  }

  hasRoomSession(name: string): boolean {
    return this.channels.get("room").has(name);
  }

  createRoomSession(roomName: string, initialMembers: string[]): AppState {
    const newChannels = this.channels.setIn(["room", roomName], new ChannelHistory());
    const newMembers  = this.members.setIn([roomName], Set<string>(initialMembers));
    return this.update({
      channels: newChannels,
      members:  newMembers,
    });
  }

  deleteRoomSession(roomName: string): AppState {
    const newChannels = this.channels.updateIn(["room"], ch => {
      return ch.delete(roomName);
    });
    const newMembers = this.members.delete(roomName);
    return this.update({
      channels: newChannels,
      members:  newMembers,
    });
  }

  hasRoomMember(roomName: string, member: string): boolean {
    return this.members.has(roomName) && this.members.get(roomName).has(member);
  }

  addRoomMember(roomName: string, member: string): AppState {
    const newMembers = this.members.updateIn([roomName], members => {
      return members.add(member)
    });
    return this.update({
      members: newMembers,
    });
  }

  removeRoomMember(roomName: string, member: string): AppState {
    const newMembers = this.members.updateIn([roomName], members => {
      return members.delete(member)
    });
    return this.update({
      members: newMembers,
    });
  }

}

export default AppState;
