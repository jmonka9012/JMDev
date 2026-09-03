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

* **Static Site Generation (SSG):** Custom scripts within `vite.config.js` fetch content from the WordPress REST API during the build process, generating static HTML and JSON payloads to ensure zero client-side database calls.
* **Custom WebGL Shaders:** Integrates `p5.js` with custom fragment and vertex shaders (`bgAscii.frag`, `bgAscii.vert`) to render performant, interactive ASCII art backgrounds that react to mouse and touch events.
* **Advanced Scroll Animations:** Implements `GSAP` and `ScrollTrigger` for complex timeline animations. It utilizes custom Vue directives (`v-on-enter`) and `ResizeObserver` logic to ensure precise layout calculations dynamically.
* **Smooth Scrolling Engine:** Integrates `Lenis` natively with GSAP's ticker, providing a seamless, momentum-based scrolling experience across all devices.
* **Responsive & Touch-Optimized:** Custom Vue composables (`useMouse`, `useTouch`) detect hardware capabilities to adjust rendering logic for mobile devices dynamically.
* **Fully SEO Optimized:** Features dynamic meta tag injection and automated `sitemap.xml` generation during the SSG build phase.

## Architecture & Build Process

1. **Data Fetching:** During `npm run build`, the build script paginates through the Headless WP API to retrieve pages, posts, and custom post types (Technologies).
2. **Asset Processing:** External images are downloaded locally to the `public/files` directory, and structured JSON files are generated for client-side routing.
3. **SSG Rendering:** ViteSSG renders Vue components into static HTML strings, externalizing Node modules safely.
4. **Hosting:** The output `dist` folder is deployed globally via the Netlify CDN.
