import AppState from '../models/app_state';

export default function channelReducer(state: AppState, path: string, params: any): AppState {

  switch (path) {
    case "choose":
      return handleChoose(state, params);
    default:
      return state;
  }

};

const handleChoose = (state: AppState, params: any): AppState  => {

  const chType = params.channelType;
  const chName = params.channelName;

  if (chType === "direct" && !state.hasDirectSession(chName)) {

    return state.chooseChannel(chType, chName)
      .createDirectSession(chName)
      .addSystemLog("start session with @" + params.user)
      .disableUnreadFlag(chType, chName);

  } else {

    return state.chooseChannel(chType, chName)
      .disableUnreadFlag(chType, chName);

  }
};


