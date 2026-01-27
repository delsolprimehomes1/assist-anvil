import { memo } from "react";

/**
 * PremiumBackground - Ambient gradient mesh backdrop with floating orbs
 * Creates a luxury, high-end aesthetic for the Agent Command Center
 */
export const PremiumBackground = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient mesh */}
      <div className="absolute inset-0 premium-ambient-bg" />
      
      {/* Floating orbs for depth */}
      <div 
        className="floating-orb absolute w-96 h-96 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(139, 186, 196, 0.3) 0%, transparent 70%)',
          top: '10%',
          left: '5%',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="floating-orb-delayed absolute w-80 h-80 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(201, 138, 58, 0.25) 0%, transparent 70%)',
          bottom: '15%',
          right: '10%',
          filter: 'blur(50px)',
        }}
      />
      <div 
        className="floating-orb absolute w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(139, 186, 196, 0.2) 0%, transparent 70%)',
          top: '50%',
          right: '30%',
          filter: 'blur(40px)',
          animationDelay: '-3s',
        }}
      />
      
      {/* Subtle noise overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

PremiumBackground.displayName = "PremiumBackground";
