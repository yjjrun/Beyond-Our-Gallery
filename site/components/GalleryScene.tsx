"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";

type SceneProps = {
  progress: MutableRefObject<number>;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value: number, from: number, to: number) => clamp((value - from) / (to - from));
const ease = (value: number) => value * value * (3 - 2 * value);

function drawFinancialTexture(context: CanvasRenderingContext2D, reveal = 1) {
  const canvas = context.canvas;
  context.fillStyle = "#073d37";
  context.fillRect(0, 0, 1200, 1200);
  context.fillStyle = "rgba(255,255,255,.045)";
  for (let y = 0; y < 1200; y += 80) context.fillRect(0, y, 1200, 1);
  for (let x = 0; x < 1200; x += 100) context.fillRect(x, 0, 1, 1200);

  context.fillStyle = "#f7f0f2";
  context.font = "600 28px Arial";
  context.fillText("BEYOND OUR GALLERY / ANALYSIS 01", 76, 94);
  context.font = "600 70px Georgia";
  context.fillText("Kingsmen Creatives", 76, 188);
  context.fillStyle = "#eba0bd";
  context.font = "500 24px Arial";
  context.fillText("SGX: 5MZ  ·  FY2025 QUALITY REVIEW", 78, 236);

  const values = [273.2, 328.4, 361.5, 388.4, 372.5];
  const margins = [21.6, 21.4, 21.6, 23.3, 24.7];
  const x0 = 95;
  const chartBottom = 780;
  const barWidth = 118;
  const gap = 72;
  values.forEach((value, index) => {
    const height = (value / 430) * 390 * reveal;
    const x = x0 + index * (barWidth + gap);
    const gradient = context.createLinearGradient(x, chartBottom - height, x, chartBottom);
    gradient.addColorStop(0, "#f18aac");
    gradient.addColorStop(1, "#b84d7a");
    context.fillStyle = gradient;
    context.fillRect(x, chartBottom - height, barWidth, height);
    context.globalAlpha = range(reveal, 0.48, 0.72);
    context.fillStyle = "#f7f0f2";
    context.font = "600 23px Arial";
    context.fillText(value.toFixed(1), x + 14, chartBottom - height - 18);
    context.fillStyle = "rgba(247,240,242,.72)";
    context.font = "18px Arial";
    context.fillText(`FY${2021 + index}`, x + 22, chartBottom + 38);
    context.globalAlpha = 1;
  });

  context.save();
  context.beginPath();
  context.rect(0, 0, 1200 * reveal, 1200);
  context.clip();
  context.strokeStyle = "#f7f0f2";
  context.lineWidth = 8;
  context.beginPath();
  margins.forEach((margin, index) => {
    const x = x0 + index * (barWidth + gap) + barWidth / 2;
    const y = 460 - (margin - 20) * 34;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  margins.forEach((margin, index) => {
    const x = x0 + index * (barWidth + gap) + barWidth / 2;
    const y = 460 - (margin - 20) * 34;
    context.fillStyle = "#f7f0f2";
    context.beginPath();
    context.arc(x, y, 10, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();

  context.globalAlpha = range(reveal, 0.58, 0.86);
  context.fillStyle = "rgba(247,240,242,.65)";
  context.font = "18px Arial";
  context.fillText("REVENUE (S$M) / GROSS MARGIN (%)", 76, 854);
  context.fillStyle = "#f7f0f2";
  context.font = "600 32px Arial";
  context.fillText("Margin expansion is carrying more", 76, 920);
  context.fillText("of the earnings recovery.", 76, 960);
  context.strokeStyle = "#eba0bd";
  context.lineWidth = 2;
  context.strokeRect(846, 868, 250, 218);
  context.fillStyle = "#eba0bd";
  context.font = "600 22px Arial";
  context.fillText("RESEARCH SCORE", 882, 918);
  context.fillStyle = "#f7f0f2";
  context.font = "600 104px Georgia";
  context.fillText("78", 902, 1038);
  context.globalAlpha = 1;
}

function createFinancialTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d")!;
  drawFinancialTexture(context, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.userData.context = context;
  return texture;
}

function GalleryRoom({ progress }: SceneProps) {
  const room = useRef<THREE.Group>(null);
  const painting = useRef<THREE.Group>(null);
  const visitor = useRef<THREE.Mesh>(null);
  const particles = useRef<THREE.Points>(null);
  const pinkLight = useRef<THREE.PointLight>(null);
  const { camera, viewport, gl } = useThree();
  const paintingTexture = useTexture("/mockup/media/painting.jpg");
  const visitorSource = useTexture("/mockup/media/visitor-half.png");
  const financialTexture = useMemo(() => createFinancialTexture(), []);
  const lastChartReveal = useRef(-1);
  const visitorTexture = useMemo(() => {
    const texture = visitorSource.clone();
    texture.needsUpdate = true;
    texture.repeat.set(1, 0.64);
    texture.offset.set(0, 0.36);
    return texture;
  }, [visitorSource]);

  const particleData = useMemo(() => {
    const count = 760;
    const initial = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const pink = new THREE.Color("#df6f9a");
    const green = new THREE.Color("#0a756b");
    for (let index = 0; index < count; index += 1) {
      const i = index * 3;
      const theta = index * 0.31;
      const radius = 1.8 + ((index * 47) % 100) / 130;
      initial[i] = Math.cos(theta) * radius;
      initial[i + 1] = Math.sin(theta * 0.71) * 1.9;
      initial[i + 2] = -0.1 + ((index * 17) % 100) / 90;

      const column = index % 80;
      const row = Math.floor(index / 80);
      target[i] = -1.85 + column * 0.047;
      target[i + 1] = -0.7 + Math.sin(column * 0.19) * 0.55 + row * 0.045;
      target[i + 2] = 0.28 + row * 0.018;
      const color = index % 3 === 0 ? pink : green;
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    return { initial, target, colors };
  }, []);

  useFrame((state, delta) => {
    const p = progress.current;
    const introduction = ease(range(p, 0, 0.2));
    const exit = ease(range(p, 0.2, 0.45));
    const rotate = ease(range(p, 0.45, 0.7));
    const reveal = ease(range(p, 0.7, 0.9));
    const passThrough = ease(range(p, 0.9, 1));
    const mobile = viewport.width < 7;

    if (room.current) {
      room.current.position.x = THREE.MathUtils.lerp(-0.12, 0.08, introduction);
      room.current.position.z = THREE.MathUtils.lerp(-0.22, -0.04, introduction);
    }

    if (visitor.current) {
      const startX = mobile ? 1.08 : 3.45;
      visitor.current.position.x = THREE.MathUtils.lerp(startX, mobile ? 5.2 : 7.4, exit);
      visitor.current.position.y = mobile ? -0.92 : -0.66;
      visitor.current.position.z = 1.35 + introduction * 0.3;
      visitor.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.9) * 0.005 * (1 - exit);
      visitor.current.visible = exit < 0.995;
    }

    if (painting.current) {
      painting.current.rotation.y = THREE.MathUtils.lerp(-0.075, Math.PI, rotate);
      painting.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.42) * 0.004 * (1 - rotate);
      const scale = 1 + exit * (mobile ? 0.08 : 0.24) + passThrough * 0.5;
      painting.current.scale.setScalar(scale);
      painting.current.position.x = mobile ? THREE.MathUtils.lerp(-0.24, 0, exit) : THREE.MathUtils.lerp(0.48, 0, exit);
      painting.current.position.y = mobile ? THREE.MathUtils.lerp(-1.88, -0.08, exit) : 0.05;
    }

    camera.position.z = THREE.MathUtils.lerp(mobile ? 11.3 : 7.1, mobile ? 5.1 : 4.15, exit);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 1.35, passThrough);
    camera.position.x = THREE.MathUtils.lerp(-0.06, 0.12, passThrough);
    camera.position.y = THREE.MathUtils.lerp(0.05, 0, passThrough);
    camera.lookAt(0, 0, 0);

    if (particles.current) {
      const positions = particles.current.geometry.attributes.position.array as Float32Array;
      const morph = ease(range(p, 0.48, 0.78));
      for (let index = 0; index < positions.length; index += 3) {
        const drift = Math.sin(state.clock.elapsedTime * 0.35 + index) * 0.012;
        positions[index] = THREE.MathUtils.lerp(particleData.initial[index], particleData.target[index], morph) + drift;
        positions[index + 1] = THREE.MathUtils.lerp(
          particleData.initial[index + 1],
          particleData.target[index + 1],
          morph,
        );
        positions[index + 2] = THREE.MathUtils.lerp(
          particleData.initial[index + 2],
          particleData.target[index + 2],
          morph,
        );
      }
      particles.current.geometry.attributes.position.needsUpdate = true;
      const material = particles.current.material as THREE.PointsMaterial;
      material.opacity = THREE.MathUtils.damp(material.opacity, 0.22 + reveal * 0.64, 3, delta);
      material.size = THREE.MathUtils.lerp(0.028, 0.045, reveal);
    }

    if (pinkLight.current) {
      pinkLight.current.intensity = 10 + rotate * 22 + reveal * 16;
      pinkLight.current.position.x = Math.sin(state.clock.elapsedTime * 0.28) * 1.2;
    }
    if (Math.abs(lastChartReveal.current - reveal) > 0.012) {
      drawFinancialTexture(financialTexture.userData.context, reveal);
      financialTexture.needsUpdate = true;
      lastChartReveal.current = reveal;
    }
    gl.toneMappingExposure = THREE.MathUtils.lerp(1.08, 0.9, passThrough);
  });

  return (
    <>
      <color attach="background" args={["#f5f1ee"]} />
      <fog attach="fog" args={["#f5f1ee", 9, 18]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[-4, 6, 6]} intensity={2.2} castShadow color="#fff8f3" />
      <spotLight
        position={[0.6, 5.4, 4]}
        angle={0.42}
        penumbra={0.8}
        intensity={58}
        color="#fff5e9"
        castShadow
      />
      <pointLight ref={pinkLight} position={[0, 0.4, 2]} color="#df6f9a" distance={8} intensity={14} />
      <pointLight position={[-3.5, -0.4, 2]} color="#08736a" distance={8} intensity={10} />

      <group ref={room}>
        <mesh position={[0, 0.1, -0.34]} receiveShadow>
          <planeGeometry args={[18, 10]} />
          <meshStandardMaterial color="#f7f4f0" roughness={0.86} />
        </mesh>
        <mesh position={[5.75, 0.1, -0.315]} receiveShadow>
          <planeGeometry args={[3.45, 10]} />
          <meshStandardMaterial color="#052f2b" roughness={0.72} />
        </mesh>
        {[-3.4, 3.55].map((x) => (
          <mesh key={x} position={[x, 0.1, -0.285]}>
            <boxGeometry args={[0.012, 10, 0.012]} />
            <meshStandardMaterial color="#d8d3ce" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 3.13, -0.27]}>
          <boxGeometry args={[18, 0.012, 0.012]} />
          <meshStandardMaterial color="#ded9d4" roughness={0.8} />
        </mesh>
        <mesh position={[0, -2.38, 2.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 14]} />
          <meshPhysicalMaterial color="#e7e3df" roughness={0.22} metalness={0.04} clearcoat={0.32} />
        </mesh>
        <mesh position={[-6.2, 0, 2.2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[9, 9]} />
          <meshStandardMaterial color="#ece8e4" roughness={0.85} />
        </mesh>
        <mesh position={[6.2, 0, 2.2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[9, 9]} />
          <meshStandardMaterial color="#eeeae6" roughness={0.85} />
        </mesh>

        <group ref={painting} position={[0.48, 0.05, 0]}>
          <mesh position={[0, 0, -0.18]} scale={1.055}>
            <planeGeometry args={[3.72, 3.72]} />
            <meshBasicMaterial color="#df6f9a" transparent opacity={0.12} />
          </mesh>
          <mesh position={[0, 0, -0.11]} castShadow receiveShadow>
            <boxGeometry args={[3.72, 3.72, 0.22]} />
            <meshPhysicalMaterial color="#063f39" roughness={0.28} metalness={0.18} clearcoat={0.72} />
          </mesh>
          <mesh position={[0, 0, 0.025]} castShadow>
            <boxGeometry args={[3.48, 3.48, 0.13]} />
            <meshPhysicalMaterial
              map={paintingTexture}
              bumpMap={paintingTexture}
              bumpScale={0.042}
              roughness={0.34}
              clearcoat={0.82}
              clearcoatRoughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0, -0.245]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[3.48, 3.48]} />
            <meshPhysicalMaterial
              map={financialTexture}
              emissive="#063f39"
              emissiveIntensity={0.2}
              roughness={0.38}
              clearcoat={0.55}
            />
          </mesh>
          <mesh position={[0, -1.97, -0.16]} castShadow>
            <boxGeometry args={[3.95, 0.07, 0.34]} />
            <meshStandardMaterial color="#d9d0c7" roughness={0.55} />
          </mesh>
        </group>

        <mesh ref={visitor} position={[3.45, -0.66, 1.35]} castShadow>
          <planeGeometry args={[2.18, 3.27]} />
          <meshStandardMaterial map={visitorTexture} transparent alphaTest={0.08} roughness={0.72} />
        </mesh>

        <points ref={particles} position={[0, 0, 0.15]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particleData.initial, 3]} />
            <bufferAttribute attach="attributes-color" args={[particleData.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            transparent
            opacity={0.34}
            size={0.03}
            vertexColors
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

    </>
  );
}

export default function GalleryScene({ progress }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 0.05, 7.1], fov: 42, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: "default" }}
      shadows="basic"
      aria-label="A gallery painting transforms into financial research as the page scrolls"
    >
      <GalleryRoom progress={progress} />
    </Canvas>
  );
}
