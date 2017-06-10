export default class PeerHelper {

  static streamHasVideo(stream:MediaStream):boolean {
    const tracks = stream.getVideoTracks();
    if (!tracks) {
      return false;
    }
    return tracks.length > 0;
  }

  static createPeerTxn(channelType: string, channelName: string, txn: string): string {
    return channelType + ":" + channelName + ":" + txn;
  }


}

