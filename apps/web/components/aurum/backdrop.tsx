import type { CSSProperties } from "react";

export function Backdrop() {
  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden">
      <RoomBackdrop />
    </div>
  );
}

function CeilingOvals() {
  const rings = [
    { width: 2400, height: 900, alpha: 0.16, blur: 0 },
    { width: 1900, height: 700, alpha: 0.22, blur: 0 },
    { width: 1450, height: 540, alpha: 0.28, blur: 0 },
    { width: 1050, height: 400, alpha: 0.36, blur: 0 },
    { width: 720, height: 260, alpha: 0.55, blur: 2 },
    { width: 420, height: 140, alpha: 0.85, blur: 4 },
  ];

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: -120,
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
      }}
    >
      {rings.map((ring) => (
        <div
          key={`${ring.width}-${ring.height}`}
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: ring.width,
            height: ring.height,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 50% 50%, rgba(244,222,170,${ring.alpha}) 0%, rgba(244,222,170,${ring.alpha * 0.4}) 35%, transparent 62%)`,
            filter: ring.blur ? `blur(${ring.blur}px)` : "none",
            mixBlendMode: "screen",
          }}
        />
      ))}
      <svg
        height="900"
        style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", overflow: "visible" }}
        viewBox="0 0 2400 900"
        width="2400"
      >
        {[
          { rx: 1100, ry: 410, opacity: 0.22 },
          { rx: 880, ry: 330, opacity: 0.3 },
          { rx: 680, ry: 250, opacity: 0.38 },
          { rx: 490, ry: 180, opacity: 0.5 },
          { rx: 320, ry: 115, opacity: 0.7 },
        ].map((ellipse) => (
          <ellipse
            cx="1200"
            cy="380"
            fill="none"
            key={`${ellipse.rx}-${ellipse.ry}`}
            opacity={ellipse.opacity}
            rx={ellipse.rx}
            ry={ellipse.ry}
            stroke="#d4a85a"
            strokeWidth="0.6"
          />
        ))}
      </svg>
    </div>
  );
}

function Chandelier({ left = "50%", top = 80, scale = 1 }: { left?: string; top?: number; scale?: number }) {
  const rods = Array.from({ length: 48 });

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left,
        top,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "top center",
        pointerEvents: "none",
        width: 340,
        height: 360,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 240,
          height: 14,
          borderRadius: 3,
          background: "linear-gradient(180deg, #3a2a12, #1a1208 70%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: 260,
          height: 2,
          background: "linear-gradient(90deg, transparent, #d4a85a 50%, transparent)",
          opacity: 0.7,
        }}
      />
      {rods.map((_, index) => {
        const total = rods.length;
        const x = (index - total / 2) / (total / 2);
        const height = 220 + Math.sin(index * 0.6) * 30 + (1 - Math.abs(x)) * 90;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: `translateX(${x * 120}px)`,
              width: 1.2,
              height,
              background: "linear-gradient(180deg, #f0d9a4 0%, #d4a85a 30%, #8b6a2e 80%, transparent 100%)",
              opacity: 0.75 + (1 - Math.abs(x)) * 0.2,
              boxShadow: "0 0 3px rgba(240,217,164,0.6)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 40,
          transform: "translateX(-50%)",
          width: 280,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,220,160,0.35) 0%, transparent 60%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}

function BrassColumn({ style }: { style: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        width: 28,
        background:
          "linear-gradient(90deg, #2a1d0a 0%, #6b4e1e 12%, #d4a85a 32%, #f0d9a4 48%, #d4a85a 56%, #8b6a2e 72%, #2a1d0a 100%)",
        boxShadow: "0 0 24px rgba(212,168,90,0.35)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 4px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -4,
          left: -6,
          right: -6,
          height: 10,
          background: "linear-gradient(180deg, #f0d9a4, #8b6a2e)",
          borderRadius: 2,
        }}
      />
    </div>
  );
}

function CarpetFloor() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "46%",
        pointerEvents: "none",
        perspective: 900,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-10%",
          right: "-10%",
          top: 0,
          bottom: 0,
          transform: "rotateX(62deg) translateZ(-20px)",
          transformOrigin: "top center",
          background: "radial-gradient(ellipse at 50% 0%, #1a2248 0%, #0e1433 40%, #070a1a 85%)",
          backgroundImage:
            "radial-gradient(rgba(212,168,90,0.16) 1.4px, transparent 1.8px), radial-gradient(ellipse at 50% 0%, #1a2248 0%, #0e1433 40%, #070a1a 85%)",
          backgroundSize: "22px 22px, 100% 100%",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "22%",
          transform: "translateX(-50%) rotateX(62deg)",
          transformOrigin: "top center",
          background: "linear-gradient(180deg, rgba(253,251,244,0.55) 0%, rgba(230,220,195,0.35) 50%, rgba(230,220,195,0.08) 100%)",
          backgroundImage: "repeating-linear-gradient(90deg, transparent 0 40px, rgba(0,0,0,0.08) 40px 41px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "60%",
          background: "linear-gradient(180deg, rgba(11,16,36,0.7), transparent)",
        }}
      />
    </div>
  );
}

function RoomBackdrop({ intensity = 1 }: { intensity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background:
          "radial-gradient(1600px 800px at 50% -10%, rgba(212,168,90,0.14), transparent 60%), radial-gradient(900px 600px at 50% 50%, rgba(31,41,88,0.5), transparent 70%), linear-gradient(180deg, #0a0f22 0%, #0b1024 40%, #060917 100%)",
      }}
    >
      <CeilingOvals />
      <BrassColumn style={{ left: "8%", top: "10%", height: "44%" }} />
      <BrassColumn style={{ left: "16%", top: "8%", height: "42%" }} />
      <BrassColumn style={{ right: "16%", top: "8%", height: "42%" }} />
      <BrassColumn style={{ right: "8%", top: "10%", height: "44%" }} />
      <Chandelier left="50%" scale={0.75 * intensity} top={30} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <CarpetFloor />
    </div>
  );
}
