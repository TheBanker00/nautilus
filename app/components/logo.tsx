interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({
  size = 34,
  className = "",
}: LogoMarkProps) {
  return (
    <img
      src="/nautilus logo 1.png"
      alt="Nautilus Money Logo"
      className={`object-contain ${className}`}
      style={{ height: size, width: "auto" }}
    />
  );
}
