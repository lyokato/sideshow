import PeerHelper from './peer_helper';

const VIDEO_CONTAINER_ID = "live-stream-container"

export default class ElementHelper {

  static findVideoNode(element: HTMLElement): HTMLVideoElement {
    return <HTMLVideoElement>element.childNodes[0].lastChild;
  }

  static get container(): HTMLElement {
    return document.getElementById(VIDEO_CONTAINER_ID)!;
  }

  static createSoundOnlyTextBox(numberText: string): HTMLElement {
    const div = document.createElement("div");
    div.className = "live-stream-display-soundonly";
    const num = document.createElement("div");
    num.className = "soundonly-board-number";
    num.appendChild(document.createTextNode(numberText));
    div.appendChild(num);
    div.appendChild(document.createTextNode("SOUND"));
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode("ONLY"));
    return div;
  }

  static createListItem(): HTMLElement {
    const li = document.createElement("li");
    li.className = "live-stream-list-item";
    const div = document.createElement("div");
    div.className = "live-stream-display";
    const video = document.createElement("video");
    div.appendChild(video);
    li.appendChild(div);
    return li;
  };

  static attachStream(element: HTMLElement, num: string, stream: MediaStream, isLocal: boolean) {

    const video = ElementHelper.findVideoNode(element);

    if (isLocal) {
      video.className = "live-mine";
      video.volume = 0;
    }

    video.srcObject = stream;
    if (video.paused) {
      video.play();
    }

    if (!PeerHelper.streamHasVideo(stream)) {
      video.parentNode!.insertBefore(
        ElementHelper.createSoundOnlyTextBox(num), video);
    }

  }
};

