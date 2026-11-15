# Front-End Developer Portfolio

A statically generated portfolio built with Vue 3, ViteSSG, and GSAP, featuring custom WebGL shaders and smooth scrolling.

## Overview
This project serves as both a personal portfolio and a technical sandbox. It utilizes a **Jamstack architecture**, decoupling the frontend from a **Headless WordPress** backend. Content is fetched at build-time to generate a quick static site. The interface is heavily animated using GSAP and features custom interactive WebGL ASCII art rendering.

This is my first project using shaders and WebGL, probably got a little too ambitious with it and some components. Site is best experienced with decent machine. But! I'd rather make mistakes I can learn from than take the easy way out :). Work in progress...

## Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Framework** | Vue 3 (Composition API), Vite, ViteSSG |
| **Styling** | Tailwind CSS, SCSS / Sass |
| **Animation & Rendering** | GSAP (ScrollTrigger), Lenis (Smooth Scroll), p5.js (WebGL Shaders) |
| **Data & Architecture** | Jamstack, Headless WordPress (REST API), Axios |
| **Deployment** | Netlify |

## Key Features

* **Static Site Generation (SSG):** `scripts/fetch-wp-data.js` fetches content from the WordPress REST API during the build process, generating static HTML and JSON payloads to ensure zero client-side database calls.
* **Custom WebGL Shaders:** Integrates `p5.js` with custom fragment and vertex shaders (`bgAscii.frag`, `bgAscii.vert`) to render performant, interactive ASCII art backgrounds that react to mouse and touch events.
* **Advanced Scroll Animations:** Implements `GSAP` and `ScrollTrigger` for complex timeline animations. It utilizes custom Vue directives (`v-on-enter`) and `ResizeObserver` logic to ensure precise layout calculations dynamically.
* **Smooth Scrolling Engine:** Integrates `Lenis` natively with GSAP's ticker, providing a seamless, momentum-based scrolling experience across all devices.
* **Responsive & Touch-Optimized:** Custom Vue composables (`useMouse`, `useTouch`) detect hardware capabilities to adjust rendering logic for mobile devices dynamically.
* **Search metadata:** Static HTML includes titles, descriptions, canonical URLs, PL/EN language alternates and social previews. Metadata also updates during client navigation; the SSG build generates `sitemap.xml`.

## Architecture & Build Process

1. **Data Fetching:** During `npm run build`, the build script paginates through the Headless WP API to retrieve pages, posts, and custom post types (Technologies).
2. **Asset Processing:** External images are downloaded locally to the `public/files` directory, and structured JSON files are generated for client-side routing.
3. **SSG Rendering:** ViteSSG renders Vue components into static HTML strings, externalizing Node modules safely.
4. **Hosting:** The output `dist` folder is deployed globally via the Netlify CDN.


## Indexing and validation

WordPress owns public project slugs, translations, SEO fields and images. The
exporter writes the currently published routes to `public/data/routes.json`.
Adding, removing or unpublishing a project reaches the public site after a new
export, static build and deployment; WordPress changes do not update hosting directly.

The sitemap uses the current rendered routes, requires matching canonical URLs,
and excludes `noindex` pages and the generated `404.html`. It omits `lastmod`
because an individual post modification time does not capture changes to shared
project data, technologies or templates. Language alternates are declared in the
HTML. `public/robots.txt` is copied unchanged; the JSON resources needed for
client rendering remain crawlable. Design Lab routes exist only in development.
Netlify serves missing static pages with HTTP 404; no SPA fallback is required.
The existing edge function redirects GET/HEAD requests with query parameters to
the same path without a query using HTTP 301.

```sh
node --test tests/*.test.js
npm run build
```

The full build formats source files, exports WordPress content and optimizes
images before SSG. For validation using already exported data without formatting
or refreshing content:

```sh
npx vite-ssg build
```

There is no dedicated lint script. Prettier can check selected changed files
without writing them. A successful build verifies static rendering, but hosting
HTTP behavior and client navigation require separate checks. Technical readiness
does not guarantee indexing or search positions.
