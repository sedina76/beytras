import type { CSSProperties } from "react";

type Props = {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

export default function TankerTruckIcon({ size = 24, color = "currentColor", className, style }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Cylindrical tank body */}
      <rect x="1" y="7" width="14" height="8" rx="3" />
      {/* Cab with angled windshield */}
      <path d="M15 15V8h4l2 4v3z" />
      {/* Fill/vent pipe on top of tank */}
      <line x1="8" y1="7" x2="8" y2="5" />
      <line x1="6" y1="5" x2="10" y2="5" />
      {/* Rear dual wheels */}
      <circle cx="5" cy="17" r="2" />
      <circle cx="11" cy="17" r="2" />
      {/* Front wheel */}
      <circle cx="19" cy="17" r="2" />
    </svg>
  );
}
