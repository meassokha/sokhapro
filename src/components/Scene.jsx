import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 2600

const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 0.5) + aPhase * 40.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.8 + vTwinkle * 0.5);
    gl_Position = projectionMatrix * mv;
  }
`
const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 2.2) * vTwinkle;
    gl_FragColor = vec4(vColor, a);
  }
`
const atmoVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const atmoFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uStrength;
  uniform float uBack;
  void main() {
    float d = dot(normalize(vNormal), normalize(vView));
    float f = uBack > 0.5 ? clamp(-d, 0.0, 1.0) : 1.0 - max(d, 0.0);
    float i = pow(f, uPower) * uStrength;
    gl_FragColor = vec4(uColor, i);
  }
`

function makeStars() {
  const pos = new Float32Array(STAR_COUNT * 3)
  const size = new Float32Array(STAR_COUNT)
  const phase = new Float32Array(STAR_COUNT)
  const color = new Float32Array(STAR_COUNT * 3)
  const tints = [
    [0.78, 0.86, 1.0],
    [1.0, 0.95, 0.88],
    [0.95, 0.82, 0.95],
    [1.0, 1.0, 1.0],
  ]
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = 40 + Math.random() * 60
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    pos[i * 3 + 2] = r * Math.cos(ph)
    size[i] = Math.random() < 0.04 ? 9 + Math.random() * 7 : 2 + Math.random() * 4
    phase[i] = Math.random()
    color.set(tints[(Math.random() * tints.length) | 0], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
  return g
}

function atmosphere(radius, color, power, strength, backSide) {
  const geo = new THREE.SphereGeometry(radius, 64, 64)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uStrength: { value: strength },
      uBack: { value: backSide ? 1 : 0 },
    },
    vertexShader: atmoVertex,
    fragmentShader: atmoFragment,
    transparent: true,
    side: backSide ? THREE.BackSide : THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  return new THREE.Mesh(geo, mat)
}

export default function Scene({ onReady }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(pixelRatio)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300)
    camera.position.set(0, 0, 9)

    // Stars
    const starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
      vertexShader: starVertex,
      fragmentShader: starFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const starGeo = makeStars()
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // Globe group: the thing the user rotates
    const globe = new THREE.Group()
    globe.rotation.z = THREE.MathUtils.degToRad(-12)
    scene.add(globe)

    const loader = new THREE.TextureLoader()
    const load = (file, srgb = true, cb) => {
      const t = loader.load(`/textures/${file}`, cb)
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = renderer.capabilities.getMaxAnisotropy()
      return t
    }
    const dayMap = load('earth_atmos_2048.jpg', true, () => onReady?.())
    const specMap = load('earth_specular_2048.jpg', false)
    const lightsMap = load('earth_lights_2048.png')
    const cloudMap = load('earth_clouds_1024.png')

    const R = 2.2
    const earthGeo = new THREE.SphereGeometry(R, 96, 96)
    const earthMat = new THREE.MeshPhongMaterial({
      map: dayMap,
      specularMap: specMap,
      specular: new THREE.Color(0x3a5a78),
      shininess: 18,
      emissiveMap: lightsMap,
      emissive: new THREE.Color(0xffc27a),
      emissiveIntensity: 0.55,
    })
    globe.add(new THREE.Mesh(earthGeo, earthMat))

    const cloudGeo = new THREE.SphereGeometry(R * 1.012, 80, 80)
    const cloudMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: cloudMap,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    })
    const clouds = new THREE.Mesh(cloudGeo, cloudMat)
    globe.add(clouds)

    // Soft atmosphere: wide outer halo + thin rim
    const halo = atmosphere(R * 1.28, 0x6fa4ff, 5.0, 0.9, true)
    const rim = atmosphere(R * 1.02, 0x9cc8ff, 4.0, 0.55, false)
    scene.add(halo, rim)

    // Light: warm sun from upper left, cool fill from the right
    scene.add(new THREE.AmbientLight(0x3a4c8c, 1.6))
    const sun = new THREE.DirectionalLight(0xfff0dc, 2.8)
    sun.position.set(-6, 3, 5)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x6a8cff, 0.5)
    fill.position.set(6, -2, 2)
    scene.add(fill)

    // Drag to rotate, with inertia
    const el = renderer.domElement
    el.style.touchAction = 'none'
    el.style.cursor = 'grab'
    let dragging = false
    let lastX = 0
    let lastY = 0
    let velX = 0
    let velY = 0
    const idle = reduceMotion ? 0 : 0.0016

    const onDown = (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!dragging) return
      velY = (e.clientX - lastX) * 0.006
      velX = (e.clientY - lastY) * 0.006
      lastX = e.clientX
      lastY = e.clientY
      globe.rotation.y += velY
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + velX, -1.2, 1.2)
    }
    const onUp = (e) => {
      dragging = false
      el.style.cursor = 'grab'
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    // Subtle parallax of the star field
    let px = 0
    let py = 0
    const onHover = (e) => {
      px = (e.clientX / window.innerWidth - 0.5) * 2
      py = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onHover)

    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.position.z = w / h < 0.8 ? 12.5 : 9
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    const start = performance.now()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = (performance.now() - start) / 1000
      starMat.uniforms.uTime.value = t
      if (!dragging) {
        velY *= 0.95
        velX *= 0.95
        globe.rotation.y += velY + idle
        globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + velX, -1.2, 1.2)
      }
      if (!reduceMotion) clouds.rotation.y += 0.0006
      stars.rotation.y = t * 0.004 + px * 0.03
      stars.rotation.x = py * 0.02
      globe.position.y = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.06
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onHover)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      ;[starGeo, earthGeo, cloudGeo, halo.geometry, rim.geometry].forEach((g) => g.dispose())
      ;[starMat, earthMat, cloudMat, halo.material, rim.material].forEach((m) => m.dispose())
      ;[dayMap, specMap, lightsMap, cloudMap].forEach((t) => t.dispose())
      renderer.dispose()
      if (el.parentNode === mount) mount.removeChild(el)
    }
  }, [onReady])

  return <div ref={mountRef} className="scene" aria-hidden="true" />
}
