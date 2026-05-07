import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function App() {
  const leftMount = useRef(null)
  const rightMount = useRef(null)

  useEffect(() => {
    function createScene(mountElement) {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x111111)

      const width = mountElement.clientWidth
      const height = mountElement.clientHeight

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
      camera.position.set(6, 6, 6)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      mountElement.appendChild(renderer.domElement)

      const ambient = new THREE.AmbientLight(0xffffff, 1.5)
      scene.add(ambient)

      const directional = new THREE.DirectionalLight(0xffffff, 2)
      directional.position.set(10, 10, 10)
      scene.add(directional)

      const cubeGroup = new THREE.Group()

      const spacing = 1.05

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9)

            const materials = [
              new THREE.MeshStandardMaterial({ color: x === 1 ? 0xffffff : 0x222222 }),
              new THREE.MeshStandardMaterial({ color: x === -1 ? 0xffff00 : 0x222222 }),
              new THREE.MeshStandardMaterial({ color: y === 1 ? 0x0000ff : 0x222222 }),
              new THREE.MeshStandardMaterial({ color: y === -1 ? 0x00ff00 : 0x222222 }),
              new THREE.MeshStandardMaterial({ color: z === 1 ? 0xff0000 : 0x222222 }),
              new THREE.MeshStandardMaterial({ color: z === -1 ? 0xff8800 : 0x222222 }),
            ]

            const cubie = new THREE.Mesh(geometry, materials)
            cubie.position.set(x * spacing, y * spacing, z * spacing)
            cubeGroup.add(cubie)
          }
        }
      }

      scene.add(cubeGroup)

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xff00ff })
      )

      scene.add(marker)

      return {
        scene,
        camera,
        renderer,
        cubeGroup,
        marker,
      }
    }

    const left = createScene(leftMount.current)
    const right = createScene(rightMount.current)

    const startEuler = new THREE.Euler(0, 0, 0, 'XYZ')

    const endEuler = new THREE.Euler(
      Math.PI * 1.4,
      Math.PI * 0.8,
      Math.PI * 1.2,
      'XYZ'
    )

    const qStart = new THREE.Quaternion().setFromEuler(startEuler)
    const qEnd = new THREE.Quaternion().setFromEuler(endEuler)

    const trackedPoint = new THREE.Vector3(1.5, 1.5, 1.5)

    const leftTrailPoints = []
    const rightTrailPoints = []

    const leftTrailGeometry = new THREE.BufferGeometry()
    const rightTrailGeometry = new THREE.BufferGeometry()

    const leftTrailMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff })
    const rightTrailMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff })

    const leftTrail = new THREE.Line(leftTrailGeometry, leftTrailMaterial)
    const rightTrail = new THREE.Line(rightTrailGeometry, rightTrailMaterial)

    left.scene.add(leftTrail)
    right.scene.add(rightTrail)

    function updateTrail(trailPoints, geometry, point) {
      trailPoints.push(point.x, point.y, point.z)

      if (trailPoints.length > 3000) {
        trailPoints.splice(0, 3)
      }

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(trailPoints, 3)
      )

      geometry.computeBoundingSphere()
    }

    function animate(time) {
      requestAnimationFrame(animate)

      const t = (Math.sin(time * 0.0005) + 1) / 2

      // Euler interpolation
      const rx = THREE.MathUtils.lerp(startEuler.x, endEuler.x, t)
      const ry = THREE.MathUtils.lerp(startEuler.y, endEuler.y, t)
      const rz = THREE.MathUtils.lerp(startEuler.z, endEuler.z, t)

      left.cubeGroup.rotation.set(rx, ry, rz)

      const eulerQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rx, ry, rz, 'XYZ')
      )

      const leftMarkerPosition = trackedPoint
        .clone()
        .applyQuaternion(eulerQuat)

      left.marker.position.copy(leftMarkerPosition)

      updateTrail(leftTrailPoints, leftTrailGeometry, leftMarkerPosition)

      // Quaternion SLERP
      const currentQuat = qStart.clone().slerp(qEnd, t)
      right.cubeGroup.quaternion.copy(currentQuat)

      const rightMarkerPosition = trackedPoint
        .clone()
        .applyQuaternion(currentQuat)

      right.marker.position.copy(rightMarkerPosition)

      updateTrail(rightTrailPoints, rightTrailGeometry, rightMarkerPosition)

      left.renderer.render(left.scene, left.camera)
      right.renderer.render(right.scene, right.camera)
    }

    animate(0)
  }, [])

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
          borderRight: '1px solid #333',
          background: 'black',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: 'white',
            zIndex: 10,
            background: 'rgba(0,0,0,0.7)',
            padding: '10px',
          }}
        >
          <h2>Euler Interpolation</h2>
          <p>Independent Roll Pitch Yaw interpolation</p>
        </div>

        <div ref={leftMount} style={{ width: '100%', height: '100%' }} />
      </div>

      <div
        style={{
          width: '50%',
          height: '100%',
          position: 'relative',
          background: 'black',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: 'white',
            zIndex: 10,
            background: 'rgba(0,0,0,0.7)',
            padding: '10px',
          }}
        >
          <h2>Quaternion SLERP</h2>
          <p>Smooth geodesic interpolation</p>
        </div>

        <div ref={rightMount} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

