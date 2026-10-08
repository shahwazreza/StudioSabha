/** @type {import('next').NextConfig} */

// The image optimizer only accepts this site's own artwork photos: her
// Supabase project's public "artwork-images" bucket. (Allowing any
// *.supabase.co host would let anyone feed it images from their own project.)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/artwork-images/**",
          },
        ]
      : [
          // Demo mode only (no Supabase configured): sample placeholder photos.
          { protocol: "https", hostname: "picsum.photos" },
        ],
  },
};

export default nextConfig;
