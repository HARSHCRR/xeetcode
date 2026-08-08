/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `@xeetcode/shared` ships as a workspace package; Next needs to transpile it
  // rather than treat it as a prebuilt external.
  transpilePackages: ['@xeetcode/shared'],
};

export default nextConfig;
