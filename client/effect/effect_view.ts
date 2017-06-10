import * as THREE from 'three';

import CanvasCatalog from './canvas_catalog';
import ShaderCatalog from './shader_catalog';
import VerticesCatalog from './vertices_catalog';

import EffectComposer from './effect_composer';
import RenderPass from './render_pass';
import GlitchPass from './glitch_pass';
import FilmPass from './film_pass';

export class EffectView {

  private scene      : THREE.Scene;
  private camera     : THREE.PerspectiveCamera;
  private renderer   : THREE.WebGLRenderer;
  private background : THREE.Mesh;
  private points     : THREE.Points;

  private composer : EffectComposer;

  private hasStopRequest : boolean = false;
  private spinSpeed      : number  = 0.006;

  private backgroundMaterial: THREE.MeshBasicMaterial;

  constructor(private container: HTMLElement) {
    this.initScene();
    this.initRenderer();
    this.initBackground();
    //this.initSphere();
    this.container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.onWindowResize, false);
  }

  initParticles(image   : HTMLImageElement,
                slotNum : number,
                slotLen : number): void {

    const tex = new THREE.Texture(image);
    tex.minFilter = THREE.NearestFilter;
    tex.needsUpdate = true;

    const vertices = VerticesCatalog.randomCloud(6000, 100);
    const geom = new THREE.BufferGeometry();
    geom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const mat = new THREE.ShaderMaterial({
      fragmentShader : ShaderCatalog.particleFragmentShader(),
      vertexShader   : ShaderCatalog.particleVertexShader(),
      transparent    : true,
      depthWrite     : false,
      blending       : THREE.AdditiveBlending,
      uniforms       : {
        slots: {
          type: 'f',
          value: 4,
        },
        idx: {
          type: 'f',
          value: 5,
        },
        size: {
          type  : 'f',
          value : 4000,
        },
        texture: {
          type  : 't',
          value : tex,
        },
      },
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);
    this.points = points;
  }

  initScene(): void {
    // Scnee
    this.scene = new THREE.Scene();
    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.z = 0;
    this.camera.lookAt(new THREE.Vector3(0,0,0));
    // Light
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0,1,1).normalize();
    this.scene.add(light);
  }

  /*
  sphere: THREE.Mesh;

  initSphere(): void {
    const geom = new THREE.SphereGeometry(20, 20, 20);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      wireframeLinewidth: 10,
      blending       : THREE.AdditiveBlending,
    });
    const sphere = new THREE.Mesh(geom, material);
    sphere.position.x = 0;
    sphere.position.y = 0;
    sphere.position.z = -50;
    this.scene.add(sphere);
    sphere.rotation.x = 10;
    sphere.rotation.z = 10;

    this.sphere = sphere;
  }
  */


  initBackground(): void {
    const tex = new THREE.Texture(CanvasCatalog.gradientCircle(256));
    tex.minFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    const plane = new THREE.PlaneBufferGeometry(800, 800, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      map: tex,
    });
    this.backgroundMaterial = mat;
    const bg = new THREE.Mesh(plane, mat);
    this.scene.add(bg);

    this.background = bg;

    const direction = this.camera.getWorldDirection();
    this.background.lookAt(this.camera.position);
    this.background.position.copy(direction.multiplyScalar(500));
  }

  initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({antialias: (window.devicePixelRatio == 1.0)});
    this.renderer.setClearColor(0x0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const glitchPass = new GlitchPass();
    //glitchPass.renderToScreen = true;
    this.composer.addPass(glitchPass);
    const filmPass = new FilmPass(0.35, 0.5, 1024, false);
    filmPass.renderToScreen = true;
    this.composer.addPass(filmPass);
  }

  onWindowResize = (e: Event) => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  start(image: HTMLImageElement) {
    this.hasStopRequest = false;
    this.initParticles(image, 4, 512.0/4.0);
    this.update();
    return;
  }

  goSlow() {
    this.spinSpeed = 0.003;
    this.backgroundMaterial.color.setHex(0x00ddff);
  }

  stop() {
    this.hasStopRequest = true;
  }

  update = () => {
    if (!this.hasStopRequest) {
      requestAnimationFrame(this.update);
      this.onTick();
      this.render();
    }
  };

  render() {
    this.composer.render(0);
   // this.renderer.render(this.scene, this.camera);
  }

  onTick() {
    this.points.rotation.y += this.spinSpeed;
    //this.sphere.rotation.y += this.spinSpeed;
    //const direction = this.camera.getWorldDirection();
    //this.background.position.copy(direction.multiplyScalar(500));
    //this.background.lookAt(this.camera.position);
  }

}

export default EffectView;
