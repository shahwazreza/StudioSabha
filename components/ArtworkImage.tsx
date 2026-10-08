import Image from "next/image";

// A painting inside a fixed-ratio slot, shown whole (never cropped) and
// centered, so tall and wide paintings sit evenly in the grid.
export default function ArtworkImage({
  src,
  alt,
  sizes,
  priority,
  className = "aspect-[4/5]",
}: {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-contain object-center"
          sizes={sizes}
        />
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}
    </div>
  );
}
