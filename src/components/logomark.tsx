import Image from "next/image";

export function Logomark({ size = 24 }: { size?: number }) {
  return <Image src="/icon.svg" alt="" width={size} height={size} aria-hidden="true" />;
}
