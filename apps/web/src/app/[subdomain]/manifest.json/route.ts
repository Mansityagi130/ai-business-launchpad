import { NextRequest } from "next/server";

interface RouteParams {
  params: {
    subdomain: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const subdomain = params.subdomain;
  let siteName = "AI Business Site";

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/tenant/resolve?subdomain=${subdomain}`);
    if (res.ok) {
      const body = await res.json();
      siteName = body.data?.siteName || "AI Business Site";
    }
  } catch (e) {
    console.warn("API resolved failed for manifest name query. Using fallback.");
  }

  const manifest = {
    name: siteName,
    short_name: siteName,
    description: `Professional online catalog for ${siteName}`,
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#F59E0B",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "64x64",
        type: "image/x-icon"
      }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
