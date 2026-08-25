import Image from "next/image";

type LogoProps = {
  compact?: boolean;
  centered?: boolean;
};

export function Logo({ compact = false, centered = false }: LogoProps) {
  const wrapperSize = compact
    ? "h-[28px] w-[96px] sm:h-[30px] sm:w-[110px]"
    : "h-[32px] w-[110px] md:h-[36px] md:w-[130px] lg:h-[40px] lg:w-[150px]";
  const imageSize = compact
    ? "w-[96px] sm:w-[110px]"
    : "w-[110px] md:w-[130px] lg:w-[150px]";

  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        wrapperSize,
        centered ? "mx-auto" : "",
      ].join(" ")}
    >
      <Image
        src="/brand/yarnme-logo-v2-transparent.png"
        alt="YarnMe"
        width={2000}
        height={2000}
        priority
        sizes={
          compact
            ? "(min-width: 640px) 110px, 96px"
            : "(min-width: 1024px) 150px, (min-width: 768px) 130px, 110px"
        }
        className={[
          "pointer-events-none absolute left-1/2 top-1/2 h-auto -translate-x-1/2 -translate-y-1/2 object-contain",
          imageSize,
        ].join(" ")}
      />
    </span>
  );
}
