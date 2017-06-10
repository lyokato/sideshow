import { Record, List } from 'immutable';
import Speech from './speech';
import { randomString } from '../util';

export interface ChannelHistoryParams {
  speeches?:  List<Speech>;
  hasUnread?: boolean;
};

const defaultChannelHistory = {
  speeches:  List<Speech>(),
  hasUnread: false,
};

export class ChannelHistory extends Record(defaultChannelHistory) {

  speeches:  List<Speech>;
  hasUnread: boolean;

  constructor(params?: ChannelHistoryParams) {
    params? super(params) : super();
  }

  update(values: ChannelHistoryParams): ChannelHistory {
    return this.merge(values) as this;
  }

  private needToMergeLastSpeech(speaker: string, now: number): boolean {

    if (this.speeches.size > 0) {
      const last = this.speeches.last()
      return (last.speaker === speaker && (now - last.date < 1000 * 60));
    } else {
      return false;
    }
  }

  addSystemLog(msg: string): ChannelHistory {
    const newSpeeches = this.speeches.push(new Speech({
        type:    "system",
        speaker: "system",
        text:    msg,
        date:    Date.now(),
        key:     randomString(20),
    }));
    return this.update({speeches: newSpeeches});
  }

  addReference(url: string, title: string, description: string, image?: string): ChannelHistory {
    const newSpeeches = this.speeches.push(new Speech({
        type:    "ref",
        speaker: "system",
        title:   title,
        text:    description,
        date:    Date.now(),
        key:     randomString(20),
        image:   image,
    }));
    return this.update({speeches: newSpeeches});
  }

  addNormalSpeech(speaker: string, msg: string): ChannelHistory {

    const now = Date.now();

    let newSpeeches;
    if (this.needToMergeLastSpeech(speaker, now)) {
      newSpeeches = this.speeches.updateIn([this.speeches.size-1], speech => {
        return speech.update({
          text: speech.text + "\n" + msg,
          date: now
        });
      });
      return this.update({speeches: newSpeeches});
    } else {
      newSpeeches = this.speeches.push(new Speech({
          type:    "normal",
          speaker: speaker,
          text:    msg,
          date:    now,
          key:     randomString(20),
      }));
      return this.update({speeches: newSpeeches});
    }
  }
}

export default ChannelHistory;
