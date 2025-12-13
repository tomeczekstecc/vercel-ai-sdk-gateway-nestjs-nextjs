/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
    // to rozwiazanie działa, ale bez steamingu
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.API_URL}/:path*`,
            },
        ]
    },
    // Enable standalone output for smaller Docker images
    output: 'standalone',
}

export default nextConfig
