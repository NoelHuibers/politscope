type IconName =
  | "search"
  | "filter"
  | "info"
  | "chev"
  | "chevR"
  | "chevL"
  | "reset"
  | "book"
  | "expand"
  | "pin"
  | "download"
  | "close"
  | "plus"
  | "dot"
  | "methodology";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 14, color = "currentColor" }: Props) {
  const stroke = {
    stroke: color,
    fill: "none",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ display: "block" }}
      aria-hidden="true"
      focusable="false"
    >
      {name === "search" && (
        <>
          <circle cx="7.5" cy="7.5" r="5" {...stroke} />
          <line x1="11.5" y1="11.5" x2="14" y2="14" {...stroke} />
        </>
      )}
      {name === "filter" && (
        <polyline points="2,3 14,3 9.5,9 9.5,13.5 6.5,12.5 6.5,9 2,3" {...stroke} />
      )}
      {name === "info" && (
        <>
          <circle cx="8" cy="8" r="6" {...stroke} />
          <line x1="8" y1="7" x2="8" y2="11" {...stroke} />
          <circle cx="8" cy="5" r="0.6" fill={color} />
        </>
      )}
      {name === "chev" && <polyline points="5,6 8,9 11,6" {...stroke} />}
      {name === "chevR" && <polyline points="6,4 9,8 6,12" {...stroke} />}
      {name === "chevL" && <polyline points="10,4 7,8 10,12" {...stroke} />}
      {name === "reset" && (
        <>
          <path d="M3 8a5 5 0 1 0 1.5-3.5" {...stroke} />
          <polyline points="3,3 4,5 6,4.2" {...stroke} />
        </>
      )}
      {name === "book" && (
        <>
          <path d="M3 3h7a3 3 0 0 1 3 3v9H6a3 3 0 0 1-3-3V3z" {...stroke} />
          <path d="M13 6V15" {...stroke} />
        </>
      )}
      {name === "expand" && (
        <>
          <polyline points="3,7 3,3 7,3" {...stroke} />
          <polyline points="13,9 13,13 9,13" {...stroke} />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M5 2h6l-1 4 2 2v2H4V8l2-2-1-4z" {...stroke} />
          <line x1="8" y1="10" x2="8" y2="14" {...stroke} />
        </>
      )}
      {name === "download" && (
        <>
          <polyline points="4,9 8,13 12,9" {...stroke} />
          <line x1="8" y1="13" x2="8" y2="3" {...stroke} />
          <line x1="3" y1="14.5" x2="13" y2="14.5" {...stroke} />
        </>
      )}
      {name === "close" && (
        <>
          <line x1="4" y1="4" x2="12" y2="12" {...stroke} />
          <line x1="12" y1="4" x2="4" y2="12" {...stroke} />
        </>
      )}
      {name === "plus" && (
        <>
          <line x1="8" y1="3" x2="8" y2="13" {...stroke} />
          <line x1="3" y1="8" x2="13" y2="8" {...stroke} />
        </>
      )}
      {name === "dot" && <circle cx="8" cy="8" r="2" fill={color} />}
      {name === "methodology" && (
        <>
          <circle cx="8" cy="8" r="6" {...stroke} />
          <path d="M5 8h6M8 5v6" {...stroke} />
        </>
      )}
    </svg>
  );
}
