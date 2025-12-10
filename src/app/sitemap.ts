import type { MetadataRoute } from 'next'

const BASE_URL = 'https://sawooeta.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = ['/', '/posts'].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
  }))

  return routes
}

