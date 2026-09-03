import { ref } from 'vue'

export function useTouch() {
    const x = ref(-30000)
    const y = ref(-30000)

    const update = (e) => {
        if (e.touches && e.touches.length > 0) {
            // Używamy pageX/Y, które = pozycja na ekranie + obecny scroll strony
            x.value = e.touches[0].pageX
            y.value = e.touches[0].pageY
        }
        else if (e.changedTouches && e.changedTouches.length > 0) {
            x.value = e.changedTouches[0].pageX
            y.value = e.changedTouches[0].pageY
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('touchstart', update, { passive: true })
        window.addEventListener('touchmove', update, { passive: true })
        window.addEventListener('touchend', update, { passive: true })
    }

    return { x, y }
}