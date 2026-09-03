// src/utils/useMouse.js
import { ref } from 'vue'

export function useMouse() {
    const x = ref(0)
    const y = ref(0)

    const update = (e) => {
        x.value = e.clientX
        y.value = e.clientY
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', update)
    }

    return { x, y }
}