import * as THREE from 'three';

// Just a JS -> TS translation
export class ShaderPass {

  enabled        : boolean = true;
  needsSwap      : boolean = true;
  clear          : boolean = false;
  renderToScreen : boolean = false;

  textureID      : string;
  uniforms       : any;
  material       : THREE.ShaderMaterial;
  scene          : THREE.Scene;
  quad           : THREE.Mesh;
  camera         : THREE.Camera;

  constructor(shader: THREE.Shader, textureID?: string) {

    this.textureID = textureID ? textureID : "tDiffuse";

    if (shader instanceof THREE.ShaderMaterial) {
      this.uniforms = shader.uniforms;
      this.material = shader;
    } else {
      this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
      this.material = new THREE.ShaderMaterial({
        //defines        : shader.defines || {},
        uniforms       : this.uniforms,
        vertexShader   : shader.vertexShader,
        fragmentShader : shader.fragmentShader,
      });
    }
    this.camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), this.material);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  setSize(w:number, h:number){}

  render(renderer     : THREE.WebGLRenderer,
          writeBuffer : THREE.WebGLRenderTarget,
          readBuffer  : THREE.WebGLRenderTarget,
          delta       : number,
          maskActive  : boolean = false) {

    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }

    //this.quad.material = this.material;

    if (this.renderToScreen) {
      renderer.render(this.scene, this.camera);
    } else {
      renderer.render(this.scene, this.camera, writeBuffer, this.clear);
    }
  }
}

export default ShaderPass;
