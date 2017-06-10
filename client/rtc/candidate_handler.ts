
export interface LocalCandidateHandlerListener {
  onLocalCandidateHandlerPushCandidate(candidate: RTCIceCandidate): void;
  onLocalCandidateHandlerPushCandidates(candidate: RTCIceCandidate[]): void;
}

export interface LocalCandidateHandler {
  setListener(listener: LocalCandidateHandlerListener): void;
  handleCandidate(candidate: RTCIceCandidate): void;
  onOfferAnswerExchanged(): void;
  release(): void;
}

export class DirectLocalCandidateHandler implements LocalCandidateHandler {

  private listener: LocalCandidateHandlerListener | null;

  setListener(listener: LocalCandidateHandlerListener): void {
    this.listener = listener;
  }

  handleCandidate(candidate: RTCIceCandidate): void {
    if (this.listener) {
      this.listener.onLocalCandidateHandlerPushCandidate(candidate);
    }
  }

  onOfferAnswerExchanged(): void {
    // do nothing
  }

  release(): void {
    this.listener = null;
  }
}

export class BufferingLocalCandidateHandler implements LocalCandidateHandler {

  private bufferedCandidates: RTCIceCandidate[] = [];
  private initialOfferAnswerExchanged: boolean = false;
  private listener: LocalCandidateHandlerListener | null;

  setListener(listener: LocalCandidateHandlerListener): void {
    this.listener = listener;
  }

  handleCandidate(candidate: RTCIceCandidate): void {
    if (this.initialOfferAnswerExchanged) {
      if (this.listener) {
        this.listener.onLocalCandidateHandlerPushCandidate(candidate);
      }
    } else {
      this.bufferedCandidates.push(candidate);
    }
  }

  onOfferAnswerExchanged(): void {
    if (this.initialOfferAnswerExchanged) {
      return;
    }
    this.initialOfferAnswerExchanged = true;
    if (this.bufferedCandidates.length == 0) {
      return;
    }
    if (this.listener) {
      this.listener.onLocalCandidateHandlerPushCandidates(
        this.bufferedCandidates);
    }
    this.bufferedCandidates = [];
  }

  release(): void {
    this.listener = null;
  }
}

export class DumbLocalCandidateHandler implements LocalCandidateHandler {

  setListener(listener: LocalCandidateHandlerListener): void {
    // do nothing
  }

  handleCandidate(candidate: RTCIceCandidate): void {
    // do nothing
  }

  onOfferAnswerExchanged(): void {
    // do nothing
  }

  release(): void {
    // do nothing
  }
}

export type LocalCandidateHandlerType = "dumb" | "direct" | "buffering";

export class LocalCandidateHandlerFactory {
  static create(type: LocalCandidateHandlerType) {
    switch (type) {
      case "dumb":
        return new DumbLocalCandidateHandler();
      case "direct":
        return new DirectLocalCandidateHandler();
      case "buffering":
        return new BufferingLocalCandidateHandler();
      default:
        return new BufferingLocalCandidateHandler();
    }
  }
}

export default LocalCandidateHandlerFactory;
