import { Record } from 'immutable';

export type SpeechType = "normal" | "system" | "ref";

export interface SpeechParams {
  type?:    SpeechType;
  title?:   string;
  image?:   string;
  speaker?: string;
  text?:    string;
  date?:    number;
  key?:     string;
};

const defaultSpeech = {
  type:    "normal",
  title:   "",
  image:   "",
  speaker: "",
  text:    "",
  date:     0,
  key:     "",
};

export class Speech extends Record(defaultSpeech) {

  type:    SpeechType;
  title:   string;
  image:   string;
  speaker: string;
  text:    string;
  date:    number;
  key:     string;

  constructor(params?: SpeechParams) {
    params? super(params) : super();
  }

  update(values: SpeechParams): Speech {
    return this.merge(values) as this;
  }
}

export default Speech;
