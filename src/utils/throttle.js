export function throttle(func, limit) {
    let waiting = false;
    let lastArgs = null;

    const timeoutFunc = () => {
        if (lastArgs == null) {
            waiting = false;
        } else {
            func(...lastArgs);
            lastArgs = null;
            setTimeout(timeoutFunc, limit);
        }
    };

    return function(...args) {
        if (!waiting) {
            func(...args);
            waiting = true;
            setTimeout(timeoutFunc, limit);
        } else {
            lastArgs = args;
        }
    };
}