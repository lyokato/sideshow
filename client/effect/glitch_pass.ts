import * as THREE from 'three';

import ShaderCatalog from './shader_catalog';

// most of this code is borrowed from threejs/examples

export class GlitchPass {

  uniforms:any = {
    "tDiffuse":	{
      type: 't',
      value: null,
    },//diffuse texture
		"tDisp": {
      type: 't',
      value: null,
    },//displacement texture for digital glitch squares
		"byp": {
      type: 'i',
      value: 0,
    },//apply the glitch ?
		"amount": {
      type: 'f',
      value: 0.08,
    },
		"angle": {
      type: 'f',
      value: 0.02
    },
		"seed":	{
      type: 'f',
      value: 0.02
    },
		"seed_x": {
      type: 'f',
      value: 0.02
    },//-1,1
		"seed_y": {
      type: 'f',
      value: 0.02
    },//-1,1
		"distortion_x": {
      type: 'f',
      value: 0.5
    },
		"distortion_y": {
      type: 'f',
      value: 0.6
    },
		"col_s": {
      type: 'f',
      value: 0.05
    }
  };

  enabled: boolean = true;
  needsSwap: boolean = true;
  clear: boolean = false;
  goWild: boolean = false;
  renderToScreen: boolean = false;

  private curF: number = 0;
  private randX: number = 0;

  private material: THREE.ShaderMaterial;
  private camera: THREE.OrthographicCamera;
  private scene: THREE.Scene;
  private quad: THREE.Mesh;

  constructor(dtSize: number = 64) {

    this.uniforms["tDisp"].value = this.generateHeightmap(dtSize);

    this.material = new THREE.ShaderMaterial({
      uniforms       : this.uniforms,
      vertexShader   : ShaderCatalog.digitalGlitchVertexShader(),
      fragmentShader : ShaderCatalog.digitalGlitchFragmentShader(),
    });
    this.camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), this.material);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.generateTrigger();
  }

  setSize(width:number, height:number) {
  }

  render(renderer:any, writeBuffer:any, readBuffer:any, delta:any, maskActive:any) {

		this.uniforms[ "tDiffuse" ].value = readBuffer.texture;
		this.uniforms[ 'seed' ].value = Math.random();//default seeding
		this.uniforms[ 'byp' ].value = 0;

		if ( this.curF % this.randX == 0 || this.goWild == true ) {

			this.uniforms[ 'amount' ].value = Math.random() / 30;
			this.uniforms[ 'angle' ].value = THREE.Math.randFloat( - Math.PI, Math.PI );
			this.uniforms[ 'seed_x' ].value = THREE.Math.randFloat( - 1, 1 );
			this.uniforms[ 'seed_y' ].value = THREE.Math.randFloat( - 1, 1 );
			this.uniforms[ 'distortion_x' ].value = THREE.Math.randFloat( 0, 1 );
			this.uniforms[ 'distortion_y' ].value = THREE.Math.randFloat( 0, 1 );
			this.curF = 0;
			this.generateTrigger();

		} else if ( this.curF % this.randX < this.randX / 5 ) {

			this.uniforms[ 'amount' ].value = Math.random() / 90;
			this.uniforms[ 'angle' ].value = THREE.Math.randFloat( - Math.PI, Math.PI );
			this.uniforms[ 'distortion_x' ].value = THREE.Math.randFloat( 0, 1 );
			this.uniforms[ 'distortion_y' ].value = THREE.Math.randFloat( 0, 1 );
			this.uniforms[ 'seed_x' ].value = THREE.Math.randFloat( - 0.3, 0.3 );
			this.uniforms[ 'seed_y' ].value = THREE.Math.randFloat( - 0.3, 0.3 );

		} else if ( this.goWild == false ) {

			this.uniforms[ 'byp' ].value = 1;

		}

		this.curF++;
		this.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera );

		} else {

			renderer.render( this.scene, this.camera, writeBuffer, this.clear );
		}
  }

  private generateTrigger() {
    //this.randX = THREE.Math.randInt(120, 240);
    this.randX = THREE.Math.randInt(60, 120);
  }

  private generateHeightmap(dtSize: number) : THREE.DataTexture {
    const len = dtSize * dtSize;
    const arr = new Float32Array(len*3);
    for (let i = 0; i < len; i++) {
      const val = THREE.Math.randFloat(0,1);
      arr[i*3 + 0] = val;
      arr[i*3 + 1] = val;
      arr[i*3 + 2] = val;
    }
    const tex = new THREE.DataTexture(arr, dtSize, dtSize, THREE.RGBFormat, THREE.FloatType,
      THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter);
    tex.needsUpdate = true;
    return tex;
  }

}

export default GlitchPass;
