import sessionReducer from './reducers/session'
import roomReducer from './reducers/room'
import directReducer from './reducers/direct'
import liveReducer from './reducers/live'
import channelReducer from './reducers/channel'
import Logger from './logger';

import AppState from './models/app_state';

const initialState = new AppState();

class ReducerRouter {

  private routes: Map<string, any> = new Map<string, any>();

  route(category:string, reducer:any) {
    this.routes.set(category, reducer);
  }

  dispatch(state: AppState, actionType: string, params: any): any {

    const separator = actionType.indexOf("/");
    if (separator < 0) {
      return state;
    }

    const category  = actionType.substr(0, separator);
    const path      = actionType.substr(separator + 1)

    Logger.debug("[APP:REDUCER] dispatch category<" + category + "> path: " + path);

    if (this.routes.has(category)) {

      Logger.debug("[APP:REDUCER] dispatch to " + category + " reducer ");

      //const newState = Object.assign({}, state);
      const reducer = this.routes.get(category);
      return reducer(state, path, params);
      //return newState;

    } else {

      Logger.warn("[APP:REDUCER] category not found");
      return state;

    }
  }
}

const router = new ReducerRouter();
router.route("session", sessionReducer);
router.route("direct", directReducer);
router.route("room", roomReducer);
router.route("live", liveReducer);
router.route("channel", channelReducer);

export const rootReducer = (state = initialState, action: any): any => {

  const actionType: string = action.type;
  const params: any = action.params;

  Logger.info("[APP:REDUCER] #" + actionType);

  const newState = router.dispatch(state, actionType, params);
  Logger.debug(JSON.stringify(newState, null, 2));
  return newState;
};

export default rootReducer;
