import AppState from '../models/app_state';

export default function sessionReducer(state: AppState, path: string, params: any): AppState {

  switch (path) {
    case "state":
      return handleConnectionStateChange(state, params);
    case "state/ready":
      return handleConnectionStateBecomeReady(state, params);
    default:
      return state;
  }

};

const handleConnectionStateChange = (state: AppState, params: any): AppState => {

  const newSession = state.session.update({
     connected: params.connected,
     loggedIn: false,
     nickname: "",
  });

  return state.update({
    session: newSession,
  });

};

const handleConnectionStateBecomeReady = (state: AppState, params: any): AppState => {

  const newSession = state.session.update({
     connected: true,
     loggedIn: true,
     nickname: params.nickname,
  });

  return state.update({
    session: newSession,
  }).addSystemLog("Welcome! you have signed in as @" + params.nickname);

};
