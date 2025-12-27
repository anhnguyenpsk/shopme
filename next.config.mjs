import 'dotenv/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    serverRuntimeConfig: {
        DATABASE_URL: process.env.DATABASE_URL,
    },
};

export default nextConfig;
