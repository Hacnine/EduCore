CSR — Client-Side Rendering
The browser downloads JS first, then React renders the page.
Useful for highly interactive pages or apps where content depends on user actions.
Not ideal for SEO or first-page speed.
SSR — Server-Side Rendering
The server renders the HTML on every request.
Good for fresh, request-specific content.
Slower per request than static pages, but always up-to-date.
SSG — Static Site Generation
Pages are built once at build time.
Great for static content, fast load, and SEO.
Best when content does not change often.
ISR — Incremental Static Regeneration
Static pages that can update after a time interval.
Gives SSG performance + periodic freshness.
Example: next: { revalidate: 3600 }.
DSG — Deferred Static Generation
Not in every Next.js version, but means generate a static page on first request and cache it afterwards.
Useful when you have many pages and don’t want to build all of them immediately.
“Dynamic” / force-dynamic
In App Router, pages can be marked dynamic to force server rendering.
Used when you need the latest data every request.
“Static” / force-static
Forces Next.js to treat the page as static even if it looks dynamic.
Useful when you know content can be cached.
Hydration
When static HTML loads in the browser and React takes over.
Not a rendering mode, but the process that makes the page interactive.
Summary
Use CSR for interactive app-like behavior.
Use SSR for content that must be fresh every request.
Use SSG for stable pages that can be pre-built.
Use ISR when you want static speed plus periodic updates.
If you want, I can also write a short table of these terms in your markdown file.

Raptor mini (Preview) • 0x