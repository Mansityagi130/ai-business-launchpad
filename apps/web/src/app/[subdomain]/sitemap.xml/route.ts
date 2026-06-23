import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    subdomain: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const subdomain = params.subdomain;
  const baseUrl = `https://${subdomain}.launchpad.ai`;

  // Fetch page slugs from tenant API fallback if connection errors occur
  let slugs = ["/"];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/tenant/resolve?subdomain=${subdomain}`);
    if (res.ok) {
      const body = await res.json();
      slugs = (body.data?.pages || []).map((p: any) => p.slug);
    }
  } catch (e) {
    console.warn("Could not query pages list for dynamic sitemap. Emitting fallback '/' index.");
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${slugs
    .map((slug) => {
      const path = slug === "/" ? "" : slug;
      return `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${slug === "/" ? "1.0" : "0.7"}</priority>
  </url>`;
    })
    .join("")}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
