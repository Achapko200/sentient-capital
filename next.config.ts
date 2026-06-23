// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY"                            },
          { key: "X-Content-Type-Options",  value: "nosniff"                         },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
          {
            key:   "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.dynamic.xyz *.walletconnect.com *.walletconnect.org cdn.dynamic.xyz",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "img-src 'self' data: blob: https://img.mlbstatic.com https://*.dynamic.xyz https://*.walletconnect.com https://cdn.dynamic.xyz",
              "font-src 'self' data: fonts.gstatic.com",
              [
                "connect-src 'self'",
                "https://*.supabase.co",
                "wss://*.supabase.co",
                "https://statsapi.mlb.com",
                "https://site.api.espn.com",
                "https://api.coingecko.com",
                "https://cloudflare-eth.com",
                "https://eth.llamarpc.com",
                "https://mainnet.base.org",
                "https://sepolia.base.org",
                "https://base.llamarpc.com",
                "https://rpc.ankr.com",
                "https://*.dynamic.xyz",
                "wss://*.dynamic.xyz",
                "https://api.dynamic.xyz",
                "https://app.dynamic.xyz",
                "https://cdn.dynamic.xyz",
                "https://*.walletconnect.com",
                "wss://*.walletconnect.com",
                "https://*.walletconnect.org",
                "wss://*.walletconnect.org",
                "https://*.coinbase.com",
                "wss://*.coinbase.com",
                "https://coinbase.com",
                "https://*.upstash.io",
              ].join(" "),
              "frame-src https://*.dynamic.xyz https://*.walletconnect.com https://*.coinbase.com",
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
      { protocol: "https", hostname: "img.mlbstatic.com" },
      { protocol: "https", hostname: "*.dynamic.xyz"     },
      { protocol: "https", hostname: "cdn.dynamic.xyz"   },
    ],
  },
};

module.exports = nextConfig;