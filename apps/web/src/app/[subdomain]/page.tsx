import React from "react";
import { Metadata } from "next";
import { DynamicRenderer } from "../../components/dynamic-renderer";

interface PageProps {
  params: {
    subdomain: string;
  };
}

// Fetches the cached layout from resolveTenant API
async function getWebsiteData(subdomain: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/tenant/resolve?subdomain=${subdomain}`, {
      next: { revalidate: 3600 } // ISR revalidation parameters
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (e) {
    console.warn("Could not retrieve published site layout. Utilizing offline mock configurations.");
  }

  // Fallback layout conforming to Zod specification schema
  return {
    siteName: "Apex Auto Repairs",
    pages: [
      {
        slug: "/",
        title: "Home",
        seo: {
          metaTitle: "Apex Auto Repairs | Premium Maintenance",
          metaDescription: "Professional alignment, brakes, and diagnostics station in Boston.",
          keywords: ["auto", "repairs", "boston"]
        },
        sections: [
          {
            id: "sec-hero-published",
            type: "hero",
            orderIndex: 1.0000,
            componentVersion: "1.0",
            title: "Premium Automotive Services",
            subtitle: "Wired and resolved from Edge CDN compilation"
          }
        ]
      }
    ]
  };
}

// Next.js dynamic metadata resolver (SEO header compiler)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getWebsiteData(params.subdomain);
  const homePage = data.pages?.find((p: any) => p.slug === "/");
  const seo = homePage?.seo || { metaTitle: data.siteName, metaDescription: "" };

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords || [],
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      type: "website",
      images: seo.ogImage ? [{ url: seo.ogImage }] : []
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: seo.ogImage ? [seo.ogImage] : []
    }
  };
}

export default async function TenantPage({ params }: PageProps) {
  const data = await getWebsiteData(params.subdomain);
  const homePage = data.pages?.find((p: any) => p.slug === "/");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="p-6 bg-slate-950 border-b border-slate-800">
        <h1 className="text-xl font-bold">{data.siteName}</h1>
      </header>
      <main>
        {homePage ? (
          <DynamicRenderer sections={homePage.sections} />
        ) : (
          <div className="p-12 text-center text-red-400">Home page configuration was not found.</div>
        )}
      </main>
    </div>
  );
}
