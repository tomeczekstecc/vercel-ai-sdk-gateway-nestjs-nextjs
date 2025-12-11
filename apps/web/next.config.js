/** @type {import('next').NextConfig} */
const nextConfig = {
    // to rozwiazanie działa, ale bez steamingu
    // async rewrites() {
    //     return [
    //         {
    //             source: '/api/:path*',
    //             destination: `${process.env.API_URL}/:path*`,
    //         },
    //     ]
    // },
}

export default nextConfig
