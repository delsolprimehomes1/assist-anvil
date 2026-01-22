import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  EnhancedAgent,
  determineAgentZone,
  zoneColors,
  getZonePulseSpeed,
  getStarSize,
} from "@/lib/licensing-logic";

interface AgentStarProps {
  agent: EnhancedAgent;
  position: [number, number, number];
  onClick?: (agent: EnhancedAgent) => void;
  isSelected?: boolean;
}

export function AgentStar({ agent, position, onClick, isSelected }: AgentStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const zone = determineAgentZone(agent);
  const color = zoneColors[zone];
  const pulseSpeed = getZonePulseSpeed(zone);
  const baseSize = getStarSize(agent.ytdPremium);

  // Animate the star with breathing pulse
  useFrame((state) => {
    if (meshRef.current) {
      // Breathing pulse effect
      const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed * Math.PI * 2) * 0.15;
      const hoverScale = hovered ? 1.3 : 1;
      const selectedScale = isSelected ? 1.5 : 1;
      meshRef.current.scale.setScalar(pulse * hoverScale * selectedScale);

      // Gentle rotation
      meshRef.current.rotation.y += 0.005;
    }
  });

  const initials = agent.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <group position={position}>
      {/* Core star sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(agent);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[baseSize, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 1.2 : 0.8}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh scale={[1.5, 1.5, 0.1]}>
        <ringGeometry args={[baseSize * 0.9, baseSize * 1.1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point light for glow effect */}
      <pointLight color={color} intensity={hovered ? 2 : 0.5} distance={5} />

      {/* Tooltip on hover */}
      {hovered && (
        <Html
          position={[0, baseSize + 1, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-xl min-w-[140px]">
            <p className="font-semibold text-sm text-foreground">{agent.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {agent.tier.replace("_", " ")}
            </p>
            <p className="text-xs text-muted-foreground">
              ${agent.ytdPremium.toLocaleString()} YTD
            </p>
            <div
              className="mt-1 text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: color, color: "white" }}
            >
              {zone.toUpperCase()} ZONE
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
