import { Builder } from './rtc/builder';

export default class EasyRTC {
  static builder() {
    return new Builder();
  };
}
