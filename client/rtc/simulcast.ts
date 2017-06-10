import * as sdpTransform from 'sdp-transform'

export interface SimulcastAnswerModifier {
  modify(sdp: string): string;
};

export default SimulcastAnswerModifier;

export class NullSimulcastAnswerModifier implements SimulcastAnswerModifier {
  modify(sdp: string): string {
    return sdp;
  }
};

interface SDPDocument {
  media: SDPMediaSection[];
}

interface SDPMediaSection {
  [index: string]: any;
}

interface SDPMediaSource {
  [index: string]: any;
}

export class PlanBSimulcastAnswerModifier implements SimulcastAnswerModifier {

  modify(answer: string): string {

    let parsedSdp: SDPDocument = <SDPDocument>sdpTransform.parse(answer);
    let videoMedia: SDPMediaSection | null = null;

    for (let m of parsedSdp.media) {
      if (m.type === 'video') {
        videoMedia = m;
        break;
      }
    }

    if (!videoMedia || !videoMedia.ssrcs)
      return answer;

    let ssrc1: string = "";
    let ssrc2: string = "";
    let ssrc3: string = "";
    let cname: string = "";
    let msid:  string = "";

    let ssrcs: SDPMediaSource[] = videoMedia!.ssrcs!

    ssrcs.forEach((ssrcObj: SDPMediaSource) => {
      switch (ssrcObj.attribute) {
        case 'cname':
          ssrc1 = ssrcObj.id;
          cname = ssrcObj.value;
          break;
        case 'msid':
          msid = ssrcObj.value;
          break;
      }
    });

    /*
      switch (ssrcObj.attribute) {
        case 'cname':
          ssrc1 = ssrcObj.id;
          cname = ssrcObj.value;
          break;
        case 'msid':
          msid = ssrcObj.value;
          break;
      }
    }
   */

    ssrc2 = ssrc1! + 1;
    ssrc3 = ssrc2 + 1;

    videoMedia.ssrcGroups = [
      {
        semantics: "SIM",
        ssrcs: `${ssrc1} ${ssrc2} ${ssrc3}`
      }
    ];

    videoMedia.ssrcs = [
      {
        id:        ssrc1,
        attribute: 'cname',
        value:     cname,
      },
      {
        id:        ssrc1,
        attribute: 'msid',
        value:     msid,
      },
      {
        id:        ssrc2,
        attribute: 'cname',
        value:     cname,
      },
      {
        id:        ssrc2,
        attribute: 'msid',
        value:     msid,
      },
      {
        id:        ssrc3,
        attribute: 'cname',
        value:     cname,
      },
      {
        id:        ssrc3,
        attribute: 'msid',
        value:     msid,
      },
    ];

    return sdpTransform.write(parsedSdp);

  }
};
