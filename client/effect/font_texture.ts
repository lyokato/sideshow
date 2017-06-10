/// <reference types="createjs" />
//
export interface FontParams {
  name: string;
  url:  string;
}

export interface AtlasParams {
  fontSize:          number;
  fontStyle?:        string;
  text:              string;
  slotNum:           number;
  imgLen:            number;
  verticalAdjuster?: number
}

export class FontTexture {

  constructor(private font: FontParams) {}

  async createAtlas(params: AtlasParams): Promise<HTMLImageElement> {
    if (params.slotNum * params.slotNum < params.text.length) {
      throw new Error("len * len should be greater than length of text");
    }
    let font = params.fontSize.toString() + "px " + this.font.name;
    if (params.fontStyle) {
      font = params.fontStyle + " " + font;
    }
    await (<any>document).fonts.load(font);
    //await this.loadFont();
    return this.createInternal(params);
  }

  private createInternal(params: AtlasParams): HTMLImageElement {
    const container = new createjs.Container();
    const chars = params.text.split('');
    for (let y = 0; y < params.slotNum; y++) {
      for (let x = 0; x < params.slotNum; x++) {
        const idx = y * params.slotNum + x;
        const ch = (idx < chars.length) ? chars[idx] : "-";
        const t = this.createCharSlot(ch, x, y, params);
        container.addChild(t);
      }
    }
    container.cache(0, 0, params.imgLen, params.imgLen);
    const url = container.getCacheDataURL();
    const img = document.createElement('img');
    img.src = url;
    return img;
  }

  private createCharSlot(c: string, x: number, y: number, params: AtlasParams): createjs.Text {
    let font = params.fontSize.toString() + "px " + this.font.name;
    if (params.fontStyle) {
      font = params.fontStyle + " " + font;
    }
    const t = new createjs.Text(c, font, "#fff");
    t.textBaseline = "middle";
    t.textAlign = "center";
    const slotLen = params.imgLen / params.slotNum;
    const adjuster = params.verticalAdjuster || 0;
    t.x = slotLen * x + slotLen / 2;
    t.y = slotLen * y + slotLen / 2 + adjuster;
    t.shadow = new createjs.Shadow("#ffffff", 0, 0, 18);
    return t;
  }
}

export default FontTexture;
