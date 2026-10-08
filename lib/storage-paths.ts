// Turns a public artwork-images URL back into its file path in the bucket
// (null for anything that isn't stored there, e.g. the built-in portrait).
const PUBLIC_PREFIX = "/storage/v1/object/public/artwork-images/";

export function artworkImagePath(url: string | null | undefined): string | null {
  const path = url?.split(PUBLIC_PREFIX)[1];
  return path ? decodeURIComponent(path.split("?")[0]) : null;
}
