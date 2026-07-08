// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: __dirname },

  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options",             value: "DENY"                            },
        { key: "X-Content-Type-Options",       value: "nosniff"                         },
        { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
        { key: "X-XSS-Protection",            value: "1; mode=block"                   },
        { key: "Cross-Origin-Opener-Policy",   value: "same-origin-allow-popups"        },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin"                    },
        { key: "Permissions-Policy",           value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Strict-Transport-Security",    value: "max-age=63072000; includeSubDomains; preload" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.dynamicauth.com *.walletconnect.com *.walletconnect.org cdn.dynamicauth.com dynamic-static-assets.com",
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
            "img-src 'self' data: blob: https:",
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
              "https://*.dynamicauth.com",
              "wss://*.dynamicauth.com",
              "https://app.dynamicauth.com",
              "https://cdn.dynamicauth.com",
              "https://dynamic-static-assets.com",
              "https://*.walletconnect.com",
              "wss://*.walletconnect.com",
              "https://*.walletconnect.org",
              "wss://*.walletconnect.org",
              "https://*.coinbase.com",
              "wss://*.coinbase.com",
              "https://coinbase.com",
              "https://*.upstash.io",
            ].join(" "),
            "frame-src https://*.dynamicauth.com https://*.walletconnect.com https://*.coinbase.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
      ],
    }];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Security hardening
  poweredByHeader:  false, // hide X-Powered-By: Next.js
  compress:         true,
  productionBrowserSourceMaps: false, // don't expose source maps in production
};

module.exports = nextConfig;