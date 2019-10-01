import { DoubleSide, RawShaderMaterial, Uniform, Vector2, Vector4 } from 'three'

import fragmentShader from './frag.glsl'
import vertexShader from './vert.glsl'

export type CurveType = 'bezier' | 'quadratic' | 'linear'

export default class SDFCurveMaterial extends RawShaderMaterial {
  _vAHHAx: Vector4
  _vAHHAy: Vector4
  constructor(type: CurveType, windingOrder: 1 | -1) {
    const vAHHAx = new Vector4(0, 0.25, 1.75, 2)
    const vAHHAy = new Vector4(0, 1, 1, 0)
    const uniforms = {
      AHHAx: new Uniform(vAHHAx),
      AHHAy: new Uniform(vAHHAy),
      windingOrder: new Uniform(windingOrder)
    }
    const defines: any = {}
    switch (type) {
      case 'linear':
        defines.USE_LINEAR = true
        break
      case 'bezier':
        defines.USE_BEZIER = true
        break
      case 'quadratic':
        defines.USE_QUADRATIC = true
        break
    }
    super({
      defines,
      fragmentShader,
      vertexShader,
      uniforms,
      side: DoubleSide,
      depthTest: true,
      depthWrite: true
    })
    this._vAHHAx = vAHHAx
    this._vAHHAy = vAHHAy
  }
  setAnchor1(x: number, y: number) {
    this._vAHHAx.x = x
    this._vAHHAy.x = y
  }
  setHandle1(x: number, y: number) {
    this._vAHHAx.y = x
    this._vAHHAy.y = y
  }
  setHandle2(x: number, y: number) {
    this._vAHHAx.z = x
    this._vAHHAy.z = y
  }
  setAnchor2(x: number, y: number) {
    this._vAHHAx.w = x
    this._vAHHAy.w = y
  }
  offsetHandle1(x: number, y: number) {
    this._vAHHAx.y += x
    this._vAHHAy.y += y
  }
  offsetHandle2(x: number, y: number) {
    this._vAHHAx.z += x
    this._vAHHAy.z += y
  }
  transform(offset: Vector2, scale: number) {
    this._vAHHAx.x = (this._vAHHAx.x - offset.x) * scale
    this._vAHHAx.y = (this._vAHHAx.y - offset.x) * scale
    this._vAHHAx.z = (this._vAHHAx.z - offset.x) * scale
    this._vAHHAx.w = (this._vAHHAx.w - offset.x) * scale

    this._vAHHAy.x = (this._vAHHAy.x - offset.y) * scale
    this._vAHHAy.y = (this._vAHHAy.y - offset.y) * scale
    this._vAHHAy.z = (this._vAHHAy.z - offset.y) * scale
    this._vAHHAy.w = (this._vAHHAy.w - offset.y) * scale
  }
}