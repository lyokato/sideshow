import * as THREE from 'three';

export class RenderPass {

    scene             : THREE.Scene;
    camera            : THREE.Camera;
    overrideMaterial? : THREE.Material;
    clearColor?       : number;
    clearAlpha        : number;
    oldClearColor     : string;
    oldClearAlpha     : number;
    clearDepth        : boolean = false;
    enabled           : boolean = true;
    clear             : boolean = true;
    needsSwap         : boolean = false;
    renderToScreen    : boolean = false;

    constructor(scene             : THREE.Scene,
                camera            : THREE.Camera,
                overrideMaterial? : THREE.Material,
                clearColor?       : number,
                clearAlpha?       : number) {

      this.scene = scene;
      this.camera = camera;
      this.overrideMaterial = overrideMaterial;
      this.clearColor = clearColor;
      this.clearAlpha = (clearAlpha) ? clearAlpha : 0;
    }

    setSize(width:number, height:number) {
    }

    render(renderer    : THREE.WebGLRenderer,
           writeBuffer : THREE.WebGLRenderTarget,
           readBuffer  : THREE.WebGLRenderTarget,
           delta       : number,
           maskActive  : boolean = false): void {

      const oldAutoClear = renderer.autoClear;
      renderer.autoClear = false;

      if (this.overrideMaterial) {
        this.scene.overrideMaterial = this.overrideMaterial!;
      }

      let oldClearColor, oldClearAlpha;

      if (this.clearColor) {
        oldClearColor = renderer.getClearColor().getHex();
        oldClearAlpha = renderer.getClearAlpha();
        renderer.setClearColor(this.clearColor!, this.clearAlpha);
      }

      if (this.clearDepth) {
        renderer.clearDepth();
      }

      renderer.render(this.scene, this.camera, this.renderToScreen ? undefined : readBuffer, this.clear);

      if (this.clearColor) {
        renderer.setClearColor(oldClearColor!, oldClearAlpha!);
      }

      //this.scene.overrideMaterial = undefined;
      renderer.autoClear = oldAutoClear;

    }
}

export default RenderPass;
