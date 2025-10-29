/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // ensures static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
