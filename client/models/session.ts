import { Record } from 'immutable';

export interface SessionParams {
  connected?: boolean;
  loggedIn?:  boolean;
  nickname?:  string;
};

const defaultSession = {
  connected: false,
  loggedIn:  false,
  nickname:  "",
};

export class Session extends Record(defaultSession) {

  connected: boolean;
  loggedIn:  boolean;
  nickname:  string;

  constructor(params?: SessionParams) {
    params? super(params) : super();
  }

  update(values: SessionParams): Session {
    return this.merge(values) as this;
  }
}

export default Session;
