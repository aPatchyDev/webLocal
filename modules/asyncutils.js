function runAfter(delay, func = () => {}, ...args) {
    return new Promise((resolver, rejector) => {
        setTimeout(() => {
            resolver(func(...args))
        }, delay)
    })
}
