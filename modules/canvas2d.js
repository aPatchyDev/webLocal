/*
Transferrable Path2D builder
Support method chaining
*/
class CanvasJob2D {
    constructor(styles) {
        this.styles = styles
        this.instArr = []
        this.argsArr = []
    }

    static from(obj) {
        const res = new CanvasJob2D()
        res.instArr = obj.instArr
        res.argsArr = obj.argsArr
        return res
    }

    toObj() {
        return {
            styles: this.styles,
            instArr: this.instArr,
            argsArr: this.argsArr
        }
    }

    toPath2D() {
        const p = new Path2D()
        for(let i = 0; i < this.instArr.length; ++i) {
            const inst = this.instArr[i]
            const args = this.argsArr[i]
            p[inst](...args)
        }

        return p
    }

    addJobPath(other) {
        this.instArr.push(...other.instArr)
        this.argsArr.push(...other.argsArr)
        return this
    }

    moveTo(x, y) {
        this.instArr.push("moveTo")
        this.argsArr.push([x, y])
        return this
    }

    lineTo(x, y) {
        this.instArr.push("lineTo")
        this.argsArr.push([x, y])
        return this
    }

    rect(x, y, width, height) {
        this.instArr.push("rect")
        this.argsArr.push([x, y, width, height])
        return this
    }

    roundRect(x, y, width, height, radii) {
        this.instArr.push("roundRect")
        this.argsArr.push([x, y, width, height, radii])
        return this
    }

    arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        this.instArr.push("arc")
        this.argsArr.push([x, y, radius, startAngle, endAngle, counterclockwise])
        return this
    }

    arcTo(x1, y1, x2, y2, radius) {
        this.instArr.push("arcTo")
        this.argsArr.push([x1, y1, x2, y2, radius])
        return this
    }
}

/*
Use OffscreenCanvas as backing buffer
Support method chaining
*/
class BufferedCanvas {
    constructor(frontCanvas, backWidth = frontCanvas.width, backHeight = frontCanvas.height, autoflush = false) {
        this.front = frontCanvas
        this.back = new OffscreenCanvas(backWidth, backHeight)

        this.frontCtx = this.front.getContext("2d")
        this.backCtx = this.back.getContext("2d", {willReadFrequently: true})

        this.camX = 0
        this.camY = 0
        this.autoflush = autoflush
    }

    updated() {
        return this.autoflush ? this.flush() : this
    }

    /* Re-use old settings if arguments omitted */
    flush(centerX, centerY) {
        if(arguments.length >= 2) {
            this.camX = centerX - (this.front.width >> 1)
            this.camY = centerY - (this.front.height >> 1)
        }

        const backData = this.backCtx.getImageData(this.camX, this.camY, this.front.width, this.front.height)
        this.frontCtx.putImageData(backData, 0, 0)

        return this     // Do not call updated() to avoid infinite recursion
    }

    drawJob(job) {
        return this.drawPath(job.toPath2D(), job.styles)        // updated() is redundant on methods
    }

    drawPath(path, styles = {}) {
        for(const style in styles) {
            this.backCtx[style] = styles[style]
        }

        if("fillStyle" in styles)
            this.backCtx.fill(path)
        if("strokeStyle" in styles)
            this.backCtx.stroke(path)

        return this.updated()
    }

    drawImage(...args) {
        this.backCtx.drawImage(...args)
        return this.updated()
    }

    clearRect(x = 0, y = 0, width = this.back.width - x, height = this.back.height - y) {
        this.backCtx.clearRect(x, y, width, height)
        return this.updated()
    }

    reset() {
        this.backCtx.reset()
        return this.updated()
    }
}

/**
 * @param modifierFunc A function that accepts (canvas, layerIndex) to perform any modifying operations on the canvas element
 */
function createCanvasLayers(wrapper, layerCount, modifierFunc = (x, i) => {}) {
    const layers = []
    for (let i = 0; i < layerCount; ++i) {
        const canvas = document.createElement("canvas")
        wrapper.appendChild(canvas)
        layers.push(canvas)

        canvas.style.zIndex = i
        modifierFunc(canvas, i)
    }

    return layers
}
