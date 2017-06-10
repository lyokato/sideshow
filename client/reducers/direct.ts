import AppState from '../models/app_state';

export default function directReducer(state: AppState, path: string, params: any): AppState {

  switch (path) {
    case "leave":
      return handleLeave(state, params);
    case "chat/history":
      return handleChatMessage(state, params);
    case "chat/ref":
      return handleChatReference(state, params);
    default:
      return state;
  }

};

const handleLeave = (state: AppState, params: any): AppState => {

  if (state.hasDirectSession(params.user)) {
    return state.deleteDirectSession(params.user)
    .addSystemLog("closed session with @" + params.user)
    .chooseSystemChannel();
  } else {
    return state;
  }

};

const handleChatReference = (state: AppState, params: any): AppState => {
  const state2 = createDirectSessionIfNeeded(state, params.user);
  const state3 = state2.addDirectChatReference(params.user,
    params.url, params.title, params.description, params.image);
  return state3;
};

const handleChatMessage = (state: AppState, params: any): AppState => {

  const sender = (params.mine) ? state.session.nickname : params.user;
  const state2 = createDirectSessionIfNeeded(state, params.user);
  const state3 = state2.addDirectChatMessage(params.user, sender, params.text);
  const state4 = enableUnreadFlagIfNeeded(state3, params.mine, params.user);

  return state4;
};

const enableUnreadFlagIfNeeded = (state: AppState, mine: boolean, user: string): AppState => {
  if (!mine && !state.ui.isChoosed("direct", user)) {
    return state.enableUnreadFlag("direct", user);
  } else {
    return state;
  }
};

const createDirectSessionIfNeeded = (state: AppState, user: string): AppState => {
  if (state.hasDirectSession(user)) {
    return state;
  } else {
    return state.createDirectSession(user)
      .addSystemLog("start session with @" + user);
  }
};
