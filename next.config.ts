// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",       value: "DENY"                          },
          { key: "X-Content-Type-Options", value: "nosniff"                       },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.dynamic.xyz *.walletconnect.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://img.mlbstatic.com https://img.mlbstatic.com",
              "font-src 'self' data:",
              "connect-src 'self' wss: https://*.supabase.co https://statsapi.mlb.com https://site.api.espn.com https://api.coingecko.com https://cloudflare-eth.com https://eth.llamarpc.com https://mainnet.base.org https://sepolia.base.org https://*.dynamic.xyz https://*.walletconnect.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:  "img.mlbstatic.com",
      },
    ],
  },
};

module.exports = nextConfig;