import { Record } from 'immutable';

export interface ChannelSelectionParams {
  type?: string;
  name?:  string;
};

const defaultChannelSelection = {
  type: "system",
  name:  "system",
};

export class ChannelSelection extends Record(defaultChannelSelection) {

  type: string;
  name:  string;

  constructor(params?: ChannelSelectionParams) {
    params? super(params) : super();
  }

  update(values: ChannelSelectionParams): ChannelSelection {
    return this.merge(values) as this;
  }

  match(chType: string, chName: string) : boolean {
    return this.type === chType && this.name === chName;
  }
}

export default ChannelSelection;
