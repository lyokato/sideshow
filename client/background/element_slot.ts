import ElementHelper from './element_helper'

export class DirectVideoElementSlot {

  private _local:  HTMLElement | null;
  private _remote: HTMLElement | null;

  constructor() {}

  prepare() {
    const local = ElementHelper.createListItem();
    ElementHelper.findVideoNode(local).className = "live-mine";
    ElementHelper.container.appendChild(local);
    this._local = local;

    const remote = ElementHelper.createListItem();
    ElementHelper.container.appendChild(remote);
    this._remote = remote;
  }

  get localVideo(): HTMLVideoElement {
    return ElementHelper.findVideoNode(this._local!);
  }

  get remoteVideo(): HTMLVideoElement {
    return ElementHelper.findVideoNode(this._remote!);
  }

  clear() {
    if (this._local) {
      const video = ElementHelper.findVideoNode(this._local!)
      video.pause();
      video.srcObject = null;
      ElementHelper.container.removeChild(this._local!);
      this._local = null;
    }
    if (this._remote) {
      const video = ElementHelper.findVideoNode(this._remote!)
      video.pause();
      video.srcObject = null;
      ElementHelper.container.removeChild(this._remote!);
      this._local = null;
    }
  }
}

export class RoomVideoElementSlot {

  /* Map<streamId, elementId> */
  private streams: Map<string, HTMLElement> = new Map<string, HTMLElement>();
  private _counter: number = 0;

  constructor(private maxElementNumber: number = 10) {}

  checkin(streamId: string) {
    if (this.streams.has(streamId)) {
      const element = this.streams.get(streamId)!;
      const video = ElementHelper.findVideoNode(element)
      video.pause();
      video.srcObject = null;
      this.streams.delete(streamId);
      ElementHelper.container.removeChild(element);
    }
  }

  hasEmpty(): boolean {
    return this.streams.size < this.maxElementNumber;
  }

  get counterText(): string {
    const str = this._counter.toString();
    if (str.length === 1) {
      return "0" + str;
    } else {
      return str;
    }
  }

  checkout(streamId: string): HTMLElement {
    if (this.streams.has(streamId)) {
      const element = this.streams.get(streamId)!;
      return element;
    } else {
      if (!this.hasEmpty()) {
        throw new Error("no empty slot.");
      }
      const element = ElementHelper.createListItem();
      ElementHelper.container.appendChild(element);
      this.streams.set(streamId, element);
      this._counter++;
      return element;
    }
  }

  clear() {
    const container = ElementHelper.container;
    this.streams.forEach((element: HTMLElement, streamId: string, origin: any): void => {
      container.removeChild(element);
    });
    this.streams = new Map<string, HTMLElement>();
    this._counter = 0;
  }
}

