import AppState from '../models/app_state';

export default function roomReducer(state: AppState, path: string, params: any): AppState {

  switch (path) {
    case "joined":
      return handleJoined(state, params);
    case "left":
      return handleLeft(state, params);
    case "chat/history":
      return handleChatMessage(state, params);
    case "chat/ref":
      return handleChatReference(state, params);
    case "member/joined":
      return handleMemberJoined(state, params);
    case "member/left":
      return handleMemberLeft(state, params);
    default:
      return state;
  }

};

const handleJoined = (state: AppState, params: any): AppState => {

  let msg = "@" + state.session.nickname + " joined.";

  return createRoomSessionIfNeeded(state, params.room, params.members)
    .chooseChannel("room", params.room)
    .addSystemLog("joined #" + params.room)
    .addRoomSystemLog(params.room, msg);
};

const createRoomSessionIfNeeded = (state: AppState, roomName: string, members: string[]): AppState => {
  if (state.hasRoomSession(roomName)) {
    return state;
  } else {
    return state.createRoomSession(roomName, members);
  }
}

const handleLeft = (state: AppState, params: any): AppState => {
  const roomName: string = params.room;
  return deleteRoomSessionIfNeeded(state, roomName)
    .chooseSystemChannel()
    .addSystemLog("left from #" + roomName);
};

const deleteRoomSessionIfNeeded = (state: AppState, roomName: string): AppState => {
  if (state.hasRoomSession(roomName)) {
    return state.deleteRoomSession(roomName);
  } else {
    return state;
  }
}

const handleMemberJoined = (state: AppState, params: any): AppState => {
  if (!state.hasRoomSession(params.room)) {
    return state;
  }
  if (state.hasRoomMember(params.room, params.member)) {
    return state;
  }
  let msg = "@" + params.member + " joined.";
  if (params.greeting) {
    msg += "  " + params.greeting;
  }
  return state.addRoomMember(params.room, params.member)
    .addRoomSystemLog(params.room, msg);
};

const handleMemberLeft = (state: AppState, params: any): AppState => {
  if (!state.hasRoomMember(params.room, params.member)) {
    return state;
  }

  let msg = "@" + params.member + " left.";
  if (params.will) {
    msg += " " + params.will;
  }
  return state.removeRoomMember(params.room, params.member)
    .addRoomSystemLog(params.room, msg);
};

const handleChatReference = (state: AppState, params: any): AppState => {
  if (state.hasRoomSession(params.room)) {
    return state.addRoomChatReference(params.room,
      params.url, params.title, params.description, params.image);
  } else {
   return state;
  }
}

const handleChatMessage = (state: AppState, params: any): AppState => {
  if (state.hasRoomSession(params.room)) {

    const state2 = state.addRoomChatMessage(params.room, params.member, params.text)
    if (params.member !== state2.session.nickname && !state.ui.isChoosed("room", params.room)) {
      return state2.enableUnreadFlag("room", params.room);
    } else {
      return state2;
    }
  } else {
    return state;
  }
};

