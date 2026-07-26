/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep visited pages in the client router cache so revisiting a tab is
    // instant instead of re-fetching from scratch. Server Actions still call
    // revalidatePath after mutations, which busts these caches immediately.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
