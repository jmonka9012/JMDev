import { ViteSSG } from 'vite-ssg'
import Lenis from 'lenis'
import App from './App.vue'
import PageResolver from './views/PageResolver.vue' // <--- Twój nowy kontroler
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useMouse } from "./utils/useMouse.js"
import { useTouch } from "./utils/useTouch.js";
import { vSvgInject } from './utils/svgInjectDirective.js';
import { vOnEnter } from "./utils/onEnterDirective.js";
import * as animations from "./utils/animations.js";
import { ref } from 'vue';

const routes = [
    { path: '/', component: PageResolver },
    { path: '/:lang(en|de)', component: PageResolver },
    { path: '/:slug', component: PageResolver },
    { path: '/:lang(en|de)/:slug', component: PageResolver },
]

export const createApp = ViteSSG(
    App,
    {
        routes,
    },
    ({ app, router, isClient }) => {
        app.directive('svg-inject', vSvgInject);
        app.directive('on-enter', vOnEnter);
        app.config.globalProperties.$anim = animations;
        if (isClient) {
            const lenis = new Lenis({ autoRaf: false });
            lenis.on('scroll', ScrollTrigger.update);
            if (!window._lenisTicker) {
                window._lenisTicker = (time) => { lenis.raf(time * 1000); };
                gsap.ticker.add(window._lenisTicker);
            }
            app.provide('lenis', lenis);

            let mousePos = useMouse();
            app.provide('mousePos', mousePos);

            let touchPos = useTouch(lenis);
            app.provide('touchPos', touchPos);

            const isTouch = ref(typeof window !== 'undefined' ? window.matchMedia("(pointer: coarse)").matches : false);
            app.provide('isTouch', isTouch);

            window.asciiString = ".,' -:xlj!=o;JLI>+<^X34#ahgurefO/A8H@$%ハツソメルれけサナモオきほまねたぬあお終ボをぽふんゆいうえかが";
            window.asciiStringNoJp = "1234567890qwertyuiopasdfghjklzxcvbnm!@#$%^&*()+<>/'[]{}AHXOJLI=:;.,-`";

            let isInitialLoad = true;

            console.log(router.getRoutes());
        }
    }
)