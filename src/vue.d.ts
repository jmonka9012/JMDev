import { Directive } from 'vue';

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        $anim: typeof import('./utils/animations.js');
    }
}

declare module 'vue' {
    export interface GlobalComponents {
        vOnEnter: Directive;
    }
}