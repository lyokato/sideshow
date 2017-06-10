import * as THREE from 'three';
import ShaderPass from './shader_pass';
import CopyShader from './copy_shader';

export class EffectComposer {

    renderTarget1 : THREE.WebGLRenderTarget;
    renderTarget2 : THREE.WebGLRenderTarget;
    writeBuffer   : THREE.WebGLRenderTarget;
    readBuffer    : THREE.WebGLRenderTarget;
    passes        : any[];
    copyPass      : ShaderPass;

  constructor(private renderer      : THREE.WebGLRenderer,
                      renderTarget? : THREE.WebGLRenderTarget) {

    if (!renderTarget) {
      const parameters = {
        minFilter     : THREE.LinearFilter,
        magFilter     : THREE.LinearFilter,
        format        : THREE.RGBAFormat,
        stencilBuffer : false,
      };
      const size = renderer.getSize();
      renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, parameters);
      renderTarget.texture.name = "EffectComposer.rt1";
    }
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = "EffectComposer.rt2";
    this.writeBuffer = this.renderTarget1;
    this.readBuffer  = this.renderTarget2;

    this.passes = [];

    this.copyPass = new ShaderPass(CopyShader);
  }

  swapBuffers(): void {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }

  addPass(pass: any): void {
    this.passes.push(pass);
    const size = this.renderer.getSize();
    pass.setSize(size.width, size.height);
  }

  insertPass(pass: any, index: number): void {
    this.passes.splice(index, 0, pass);
  }

  render(delta: number): void {
    const maskActive = false;
    const il= this.passes.length;
    for (let i = 0; i < il; i++) {
      const pass = this.passes[i];
      if (pass.enabled === false) {
        continue;
      }
      pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

      if (pass.needsSwap) {
        if (maskActive) {
          const context = this.renderer.context;
          context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);
          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);
          context.stencilFunc(context.EQUAL, 1, 0xffffffff);
        }
        this.swapBuffers();
      }
    }
  }

  reset(renderTarget?: THREE.WebGLRenderTarget): void {
    if (!renderTarget) {
      const size = this.renderer.getSize();
      renderTarget = this.renderTarget1.clone();
      renderTarget.setSize(size.width, size.height);
    }
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();

    this.writeBuffer = this.renderTarget1;
    this.readBuffer  = this.renderTarget2;
  }

  setSize(width: number, height: number): void {
    this.renderTarget1.setSize(width, height);
    this.renderTarget2.setSize(width, height);
    for (let i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(width, height);
    }
  }
}

export default EffectComposer;
