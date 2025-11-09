import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reefregen.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/submit/",
          "/profile/setup/",
          "/profile/details/",
          "/profile/setting/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/submit/",
          "/profile/setup/",
          "/profile/details/",
          "/profile/setting/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

