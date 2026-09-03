import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const vOnEnter = {
    mounted(el, binding) {
        el._st = ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () => {
                if (typeof binding.value === 'function') {
                    binding.value(el);
                }
            }
        });
    },
    unmounted(el) {
        if (el._st) {
            el._st.kill();
            delete el._st;
        }
    }
};