import { Record } from 'immutable';
import ChannelSelection from './channel_selection';

export type LiveRole  = "audience" | "performer/video" | "performer/audio";
export type LivePhase = "init" | "negotiating";

export interface LiveParams {
  opened?:          boolean;
  selectedChannel?: ChannelSelection;
  role?:            LiveRole;
  phase?:           LivePhase;
};

const defaultLive = {
  opened:          false,
  selectedChannel: new ChannelSelection(),
  role:            "audience",
  phase:           "init",
};

export class Live extends Record(defaultLive) {

  opened:          boolean;
  selectedChannel: ChannelSelection;
  role:            LiveRole;
  phase:           LivePhase;

  constructor(params?: LiveParams) {
    params? super(params) : super();
  }

  update(values: LiveParams): Live {
    return this.merge(values) as this;
  }
}

export default Live;
