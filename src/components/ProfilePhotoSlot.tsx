import { UserRound } from "lucide-react";

import { resolveDirectoryAssetUrl } from "@/lib/directoryAssets";
import { cn } from "@/lib/utils";

const sizeStyles = {
  sm: "size-9 [&_svg]:size-4",
  md: "size-16 [&_svg]:size-7",
  lg: "size-28 [&_svg]:size-11",
} as const;

export type ProfilePhotoSlotSize = keyof typeof sizeStyles;

type ProfilePhotoSlotProps = {
  /** Absolute `https://…`, `data:…`, or directory path `/uploads/avatars/…`. */
  src?: string | null;
  alt: string;
  size?: ProfilePhotoSlotSize;
  className?: string;
};

/**
 * Rounded avatar area: shows the photo when `src` is set, otherwise a neutral
 * placeholder with the user icon.
 */
export function ProfilePhotoSlot({
  src,
  alt,
  size = "md",
  className,
}: ProfilePhotoSlotProps) {
  const trimmed = src?.trim();
  const resolved = trimmed ? resolveDirectoryAssetUrl(trimmed) : undefined;
  const hasPhoto = Boolean(resolved);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted/50 ring-1 ring-border",
        sizeStyles[size],
        className
      )}
    >
      {hasPhoto ? (
        <img
          src={resolved}
          alt={alt}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="flex size-full items-center justify-center rounded-full bg-muted/30"
          aria-hidden
        >
          <UserRound className="text-muted-foreground/45" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
