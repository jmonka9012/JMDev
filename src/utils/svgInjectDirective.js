import { SVGInject } from "@iconfu/svg-inject";

export const vSvgInject = {
  mounted(el) {
    SVGInject(el);
  },
  updated(el) {
    SVGInject(el);
  },
};
