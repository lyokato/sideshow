import BackgroundSession from './background/session';
import Logger from './logger';

let session: BackgroundSession;

export const startBackgroundSession = (url: string, store: any): void => {
  session = new BackgroundSession(url, store);
  session.start();
};

type HandlerFunc = (params: any) => void;
interface HandlerDictionary {
  [index: string]: HandlerFunc;
}

const Handlers: HandlerDictionary = {
  "session/login": (params: any): void => {
    session.login(params.nickname, params.txn);
  },
  "direct/chat": (params: any): void => {
    session.sendDirectChat(params.user, params.text);
  },
  "room/chat": (params: any): void => {
    session.sendRoomChat(params.room, params.text);
  },
  "room/join": (params: any): void => {
    session.joinRoom(params.room, params.greeting);
  },
  "room/leave": (params: any): void => {
    session.leaveRoom(params.room, params.will)
  },
  "rtc/start": (params: any): void => {
    if (session.clientIsAvailable()) {
      session.startPeer(params.channelType, params.channelName, params.role)
        .catch((err: Error) => {
          Logger.error("[APP:SESSION] failed to start peer connectoin: " + err.message);
        });
    }
  },
  "rtc/quit": (params: any): void => {
    session.quitPeer();
  },

  "url/get": (params: any): void => {
    session.fetchURLs(params.channelType, params.channelName, params.urls)
      .catch((err: Error) => {
       Logger.warn("[APP:SESSION] failed to fetch urls: " + err.message);
     });
  },

  "background/start": (params: any): void => {
    session.startBackgroundEffect();
  },
}

export const backgroundMiddleware = (store: any) => (next: any) => (action: any) => {

  const actionType: string = action.type;
  const params:     any    = action.params;

  Logger.info("[APP:SESSION] #" + actionType);

  if (actionType in Handlers) {
    const handler: HandlerFunc = Handlers[actionType];
    handler(params);
  } else {
    Logger.debug("[APP:SESSION] pass to reducer");
    return next(action);
  }
};

