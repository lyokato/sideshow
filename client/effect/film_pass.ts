import * as THREE from 'three';

export const FilmShader: any = {

  uniforms: {
    "tDiffuse"   : { value: null },
    "time"       : { value: 0.0 },
    "nIntensity" : { value: 0.5 },
    "sIntensity" : { value: 0.05 },
    "sCount"     : { value: 4096 },
    "grayscale"  : { type: 't', value: false },
  },

  vertexShader: `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,

  fragmentShader: `
   #include <common>

   uniform float time;
   uniform bool grayscale;
   uniform float nIntensity;
   uniform float sIntensity;
   uniform float sCount;
   uniform sampler2D tDiffuse;
   varying vec2 vUv;
   void main() {
    vec4 cTextureScreen = texture2D(tDiffuse, vUv);
    float dx = rand(vUv + time);
    vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp(0.1 + dx, 0.0, 1.0);
    vec2 sc = vec2(sin(vUv.y * sCount), cos(vUv.y * sCount));
    cResult += cTextureScreen.rgb * vec3(sc.x, sc.y, sc.x) * sIntensity;
    cResult = cTextureScreen.rgb + clamp(nIntensity, 0.0, 1.0) * (cResult - cTextureScreen.rgb);
    if (grayscale) {
      cResult = vec3(cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11);
    }
    gl_FragColor = vec4(cResult, cTextureScreen.a);
   }
  `,

}

export class FilmPass {

  enabled        : boolean = true;
  needsSwap      : boolean = true;
  clear          : boolean = false;
  renderToScreen : boolean = false;

  uniforms       : any;
  material       : THREE.ShaderMaterial;
  scene          : THREE.Scene;
  quad           : THREE.Mesh;
  camera         : THREE.Camera;

  constructor(noiseIntensity?     : number,
              scanlinesIntensity? : number,
              scanlinesCount?     : number,
              grayscale           :boolean = false) {

    this.camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.scene  = new THREE.Scene();

    const shader = FilmShader;

    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    if (noiseIntensity !== undefined) {
      this.uniforms["nIntensity"].value = noiseIntensity;
    }
    if (scanlinesIntensity !== undefined) {
      this.uniforms["sIntensity"].value = scanlinesIntensity;
    }
    if (scanlinesCount !== undefined) {
      this.uniforms["sCount"].value = scanlinesCount;
    }

    this.uniforms["grayscale"] = grayscale;

    this.material = new THREE.ShaderMaterial({
      uniforms       : this.uniforms,
      vertexShader   : shader.vertexShader,
      fragmentShader : shader.fragmentShader,
    });

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
    this.uniforms["tDiffuse"].value = readBuffer.texture;
    this.uniforms["time"].value += delta;

    if (this.renderToScreen) {
      renderer.render(this.scene, this.camera);
    } else {
      renderer.render(this.scene, this.camera, writeBuffer, this.clear);
    }
  }

}

export default FilmPass;
