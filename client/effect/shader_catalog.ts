export class ShaderCatalog {

  static particleVertexShader(): string {
    return `
    uniform float size;

    varying vec4 vMvPosition;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vMvPosition = mvPosition;
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = size / gl_Position.w;
    }
    `;
  }

  static particleFragmentShader(): string {
    return `
    uniform sampler2D texture;
    uniform float     slots;
    uniform float     idx;

    varying vec4 vMvPosition;

		float rand(vec2 co) {
			return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
		}

    void main() {

      float v, pos, offsetX, offsetY;

      if (gl_PointCoord.x >= 0.5) {
        v = float(floor((vMvPosition.x + vMvPosition.y) / vMvPosition.z * 10.0));
        pos = mod(v + 10.0, 16.0);
        offsetX = mod(pos, 4.0) * 0.25 - 0.25;
        offsetY = floor(((pos + 4.0) / 4.0) - 1.0) * 0.25;
      } else {
        v = float(floor((vMvPosition.x + vMvPosition.y) / vMvPosition.z * 10.0));
        pos = mod(v, 16.0);
        offsetX = mod(pos, 4.0) * 0.25;
        offsetY = floor(((pos + 4.0) / 4.0) - 1.0) * 0.25;
      }


      vec2 coord1 = gl_PointCoord / slots;
      vec2 coord2 = vec2(coord1.x * 2.0 + offsetX, coord1.y + offsetY);
      vec4 color  = texture2D(texture, vec2(coord2.x, 1.0 - coord2.y));
      color.a = clamp(color.a - 0.5 - abs(vMvPosition.z/300.0), 0.0, 1.0);
      gl_FragColor = color;
    }
    `;
  }

  // borrowed from three.js/examples
  static digitalGlitchVertexShader(): string {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  // borrowed from three.js/examples
  static digitalGlitchFragmentShader(): string {
    return `
		uniform int byp;

		uniform sampler2D tDiffuse;
		uniform sampler2D tDisp;

		uniform float amount;
		uniform float angle;
		uniform float seed;
		uniform float seed_x;
		uniform float seed_y;
		uniform float distortion_x;
		uniform float distortion_y;
		uniform float col_s;

		varying vec2 vUv;


		float rand(vec2 co) {
			return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
		}

		void main() {
			if(byp<1) {
				vec2 p = vUv;
				float xs = floor(gl_FragCoord.x / 0.5);
				float ys = floor(gl_FragCoord.y / 0.5);
				//based on staffantans glitch shader for unity https://github.com/staffantan/unityglitch
				vec4 normal = texture2D (tDisp, p*seed*seed);
				if(p.y<distortion_x+col_s && p.y>distortion_x-col_s*seed) {
					if(seed_x>0.){
						p.y = 1. - (p.y + distortion_y);
					}
					else {
						p.y = distortion_y;
					}
				}
				if(p.x<distortion_y+col_s && p.x>distortion_y-col_s*seed) {
					if(seed_y>0.){
						p.x=distortion_x;
					}
					else {
					  p.x = 1. - (p.x + distortion_x);
					}
				}
				p.x+=normal.x*seed_x*(seed/5.);
				p.y+=normal.y*seed_y*(seed/5.);
				//base from RGB shift shader
				vec2 offset = amount * vec2( cos(angle), sin(angle));
				vec4 cr = texture2D(tDiffuse, p + offset);
				vec4 cga = texture2D(tDiffuse, p);
				vec4 cb = texture2D(tDiffuse, p - offset);
				gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
				//add noise
				vec4 snow = 200.*amount*vec4(rand(vec2(xs * seed,ys * seed*50.))*0.2);
				gl_FragColor = gl_FragColor+ snow;
			}
			else {
				gl_FragColor=texture2D (tDiffuse, vUv);
			}
		}
    `;
  }
}

export default ShaderCatalog;
