import { Vector2 } from 'three'

import { TtfPathSegment } from '../../../examples/common/testFontPathData'
import SDFCurveMesh from '../meshes/SDFCurveMesh'

const __v2Zero = new Vector2()

export function makeTtfShapeMeshes(
  ttfPath: TtfPathSegment[],
  offset?: Vector2,
  scale: number = 1,
  windingOrder: 1 | -1 = 1
) {
  const meshes: SDFCurveMesh[] = []
  const cursor = new Vector2()
  for (const seg of ttfPath) {
    let curveMesh: SDFCurveMesh | undefined
    switch (seg.type) {
      case 'M':
        cursor.set(seg.x!, seg.y!)
        break
      case 'C':
        curveMesh = new SDFCurveMesh('bezier', 16, windingOrder)
        curveMesh.setAnchor1v(cursor)
        curveMesh.setHandle1(seg.x1!, seg.y1!)
        curveMesh.setHandle2(seg.x2!, seg.y2!)
        cursor.set(seg.x!, seg.y!)
        curveMesh.setAnchor2v(cursor)
        break
      case 'Q':
        curveMesh = new SDFCurveMesh('quadratic', 16, windingOrder)
        curveMesh.setAnchor1v(cursor)
        curveMesh.setHandle1(seg.x1!, seg.y1!)
        cursor.set(seg.x!, seg.y!)
        curveMesh.setAnchor2v(cursor)
        break
      case 'L':
        curveMesh = new SDFCurveMesh('linear', 2, windingOrder)
        curveMesh.setAnchor1v(cursor)
        cursor.set(seg.x!, seg.y!)
        curveMesh.setAnchor2v(cursor)
        break
      case 'Z':
        break
      default:
        debugger
    }
    if (curveMesh) {
      meshes.push(curveMesh)
      if (offset || scale !== 1) {
        if (!offset) {
          offset = __v2Zero
        }
        curveMesh.transform(offset, scale)
      }
    }
  }
  return meshes
}