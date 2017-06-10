
export class CanvasCatalog {

  static gradientCircle(r: number): HTMLCanvasElement {
    const len = r * 2;
    const canvas = <HTMLCanvasElement>document.createElement("canvas");
    canvas.width = len;
    canvas.height = len;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, len, len);
    const gradient = ctx.createRadialGradient(r,r,0,r,r,r);
    gradient.addColorStop(0, "rgb(255,255,255)");
    gradient.addColorStop(1, "rgb(0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,len,len);
    return canvas;
  }

  static gradientBox(len: number): HTMLCanvasElement {
    const canvas = <HTMLCanvasElement>document.createElement("canvas");
    canvas.width = len;
    canvas.height = len;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, len, len);
    const gradient = ctx.createLinearGradient(0,0,0,len);
    gradient.addColorStop(0, "rgb(255,255,255)");
    gradient.addColorStop(1, "rgb(0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,len,len);
    return canvas;
  }
}

export default CanvasCatalog;
