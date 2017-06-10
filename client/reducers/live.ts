import AppState from '../models/app_state';
import ChannelSelection from '../models/channel_selection';

export default function liveReducer(state: AppState, path: string, params: any): AppState {

  switch (path) {
    case "open":
      return handleLiveOpen(state, params);
    case "quit":
      return handleLiveQuit(state, params);
    case "start":
      return handleLiveStart(state, params);
    default:
      return state;
  }

};

const handleLiveOpen = (state: AppState, params: any): AppState => {

  const channel = new ChannelSelection({
    type: params.channelType,
    name: params.channelName
  });

  const newLiveState = state.live.update({
    opened:          true,
    role:            params.role,
    phase:           "init",
    selectedChannel: channel,
  });

  return state.update({
    live: newLiveState,
  });

};

const handleLiveQuit = (state: AppState, params: any): AppState => {

  const newLiveState = state.live.update({
    opened: false
  });

  return state.update({
    live: newLiveState,
  });

};

const handleLiveStart = (state: AppState, params: any): AppState => {

  const newLiveState = state.live.update({
    opened: true,
    role:   params.role,
    phase: "negotiating",
  });

  return state.update({
    live: newLiveState,
  });

};

