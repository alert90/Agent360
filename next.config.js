/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['@mui/material', '@mui/icons-material']
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  },

  // Add custom server configuration for larger file uploads
  async rewrites() {
    return [
      // Handle large file uploads through custom middleware
      {
        source: '/api/files/upload-chunk',
        destination: '/api/files/upload-chunk'
      }
    ]
  }
}
