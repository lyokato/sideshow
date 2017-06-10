export class VerticesCatalog {

  static randomCloud(num: number, halfLen: number): Float32Array {
    const vertices = [];
    const range = halfLen * 2;
    for (let i = 0; i < num; i++) {
      const x = Math.floor(Math.random() * range - halfLen);
      const y = Math.floor(Math.random() * range - halfLen);
      const z = Math.floor(Math.random() * range - halfLen);
      vertices.push(x, y, z);
    }
    return new Float32Array(vertices);
  }

  static orderedCloud(halfLen: number, step: number): Float32Array {
    const vertices = [];
    const start = halfLen * -1;
    const end = halfLen;
    for (let x = start; x < end; x+=step) {
      for (let y = start; y < end; y+=step) {
        for (let z = start; z < end; z+=step) {
          vertices.push(x, y, z);
        }
      }
    }
    return new Float32Array(vertices);
  }
}

export default VerticesCatalog;
