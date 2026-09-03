import { ViteSSG } from "vite-ssg";
import Lenis from "lenis";
import App from "./App.vue";
import PageResolver from "./views/PageResolver.vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { vSvgInject } from "./utils/svgInjectDirective.js";
import { vOnEnter } from "./utils/onEnterDirective.js";
import * as animations from "./utils/animations.js";
import { ref } from "vue";

const routes = [
  { path: "/", component: PageResolver },
  { path: "/:lang(en|de)", component: PageResolver },
  { path: "/:slug", component: PageResolver },
  { path: "/:lang(en|de)/:slug", component: PageResolver },
];

export const createApp = ViteSSG(
  App,
  {
    routes,
  },
  ({ app, router, isClient }) => {
    app.directive("svg-inject", vSvgInject);
    app.directive("on-enter", vOnEnter);
    app.config.globalProperties.$anim = animations;
    if (isClient) {
      const lenis = new Lenis({ autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      if (!window._lenisTicker) {
        window._lenisTicker = (time) => {
          lenis.raf(time * 1000);
        };
        gsap.ticker.add(window._lenisTicker);
      }
      app.provide("lenis", lenis);

      const isTouch = ref(
        typeof window !== "undefined"
          ? window.matchMedia("(pointer: coarse)").matches
          : false,
      );
      app.provide("isTouch", isTouch);

      console.log(router.getRoutes());
    }
  },
);
