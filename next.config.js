/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Legacy universal URLs → role-scoped agent routes
      {
        source: "/integrations",
        destination: "/agent/integrations",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/agent/settings",
        permanent: false,
      },
      // Malformed paths (relative-link mistakes while on /integrations)
      {
        source: "/integrations/agent/settings",
        destination: "/agent/settings",
        permanent: false,
      },
      {
        source: "/integrations/agent/:path*",
        destination: "/agent/:path*",
        permanent: false,
      },
      {
        source: "/settings/agent/:path*",
        destination: "/agent/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
