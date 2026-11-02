import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { person, site } from "@/content/facts";
import { projects } from "@/content/projects";
import { skillGroups } from "@/content/facts";
import "./globals.css";

const heroNoJsSummary =
  "I build enterprise systems end to end: web, IoT and AI, from the first conversation to the live deployment.";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  keywords: [
    "Software Engineer",
    "Web Development",
    "IoT",
    "AI Engineering",
    "Laravel",
    "Next.js",
    "Mandaluyong",
    "Philippines",
  ],
  authors: [{ name: person.name, url: person.linkedin }],
  creator: person.name,
  // NEXT_PUBLIC_SITE_URL in production; site.url is "" when unset (never undefined).
  metadataBase: new URL(site.url || "http://localhost:3000"),
  openGraph: {
    title: site.title,
    description: site.description,
    type: "profile",
    locale: "en_US",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${person.name} — ${person.role}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

/** JSON-LD Person — real, traceable facts only. */
function PersonJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.role,
    email: `mailto:${person.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Mandaluyong", addressCountry: "PH" },
    ...(person.linkedin ? { sameAs: [person.linkedin, person.github] } : {}),
    knowsAbout: [
      ...person.specialties,
      ...skillGroups.flatMap((g) => g.items as unknown as string[]),
    ],
    ...(site.url ? { url: site.url } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <PersonJsonLd />
        {/* [CACHE-02] Media Service Worker — registered before hydration so
            even the first visit's later fetches (the preloader queue) land
            in the SW cache. The SW intercepts ONLY same-origin /media/ GETs
            without a Range header (see public/sw.js): app code, hot reload
            and streaming fallbacks are untouched. Plain inline script — it
            must run before React ships any markup, so next/script's
            beforeInteractive puts it at the top of <head>. */}
        <Script id="media-sw-reg" strategy="beforeInteractive">
          {`if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){})}`}
        </Script>
        {/* [A11Y-10] Full content without JavaScript: identity, links, projects. */}
        <noscript>
          <div style={{ padding: "5rem clamp(20px,5vw,72px) 3rem", background: "#f4f2ee", color: "#111" }}>
            <h1 style={{ fontSize: "2.2rem", margin: 0 }}>{person.name}</h1>
            <p style={{ color: "rgba(17,17,17,.6)" }}>
              {person.role} — {person.specialties.join(" · ")} — {person.location}
            </p>
            <p>{heroNoJsSummary}</p>
            <h2 style={{ fontSize: "1.1rem" }}>Projects</h2>
            <ul>
              {projects.map((p) => (
                <li key={p.id}>
                  <a href={p.url}>{p.title}</a> — {p.oneLiner} ({p.stack.join(", ")})
                </li>
              ))}
            </ul>
            <h2 style={{ fontSize: "1.1rem" }}>Contact</h2>
            <p>
              <a href={`mailto:${person.email}`}>{person.email}</a> ·{" "}
              <a href={person.linkedin}>LinkedIn</a> · <a href={person.github}>GitHub</a> ·{" "}
              <a href={person.resumePath}>Resume (PDF)</a>
            </p>
          </div>
          <style>{".story-beats{display:none}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
