import type { CSSProperties } from "react";
import { PARTY, type PartyId } from "@/data/parties";

type Props = {
  id: PartyId;
  size?: number;
};

export function PartyDot({ id, size = 8 }: Props) {
  const p = PARTY[id];
  if (!p) return null;

  const base: CSSProperties = {
    width: size,
    height: size,
    background: p.colorVar,
    display: "inline-block",
    flex: "0 0 auto",
  };

  if (p.shape === "circle") base.borderRadius = "50%";
  if (p.shape === "square") base.borderRadius = 1;
  if (p.shape === "diamond") {
    base.transform = "rotate(45deg)";
    base.borderRadius = 1;
  }
  if (p.shape === "hex") {
    base.borderRadius = 1;
    base.clipPath = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";
  }
  if (p.shape === "triangle") {
    return (
      <span
        aria-hidden
        style={{
          display: "inline-block",
          flex: "0 0 auto",
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${p.colorVar}`,
          width: 0,
          height: 0,
        }}
      />
    );
  }

  if (id === "cdu" && p.ringVar) {
    base.boxShadow = `0 0 0 1px ${p.ringVar}`;
  }

  return <span aria-hidden style={base} />;
}
