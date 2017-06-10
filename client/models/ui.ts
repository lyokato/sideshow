import { Record } from 'immutable';
import ChannelSelection from './channel_selection';

export interface UIParams {
  selectedChannel?: ChannelSelection;
};

const defaultUI = {
  selectedChannel: new ChannelSelection(),
};

export class UI extends Record(defaultUI) {

  selectedChannel: ChannelSelection;

  constructor(params?: UIParams) {
    params? super(params) : super();
  }

  update(values: UIParams): UI {
    return this.merge(values) as this;
  }

  isChoosed(chType: string, chName: string): boolean {
    return this.selectedChannel.match(chType, chName);
  }

  choose(chType: string, chName: string): UI {

    const newChannel = this.selectedChannel.update({
      type: chType,
      name: chName,
    });

    return this.update({
      selectedChannel: newChannel,
    });
  }
}

export default UI;
