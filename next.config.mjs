import 'dotenv/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    serverRuntimeConfig: {
        DATABASE_URL: process.env.DATABASE_URL,
    },
};

export default nextConfig;
