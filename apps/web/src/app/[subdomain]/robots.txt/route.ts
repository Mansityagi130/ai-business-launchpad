import { NextRequest } from "next/server";

interface RouteParams {
  params: {
    subdomain: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const subdomain = params.subdomain;
  const sitemapUrl = `https://${subdomain}.launchpad.ai/sitemap.xml`;

  const robots = `User-agent: *
Allow: /
Disallow: /_next/
Disallow: /static/

Sitemap: ${sitemapUrl}`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
