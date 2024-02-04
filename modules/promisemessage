// Reference: https://advancedweb.hu/how-to-use-async-await-with-postmessage/
class PromiseMessage {
    static #EVENT_TYPE = "PromiseMessage"
    static #DEFAULT_ID = "default"
    static #DEFAULT_TIMEOUT = 10_000

    static #constructing = false
    static #builderClass = class {
        #id
        #context

        constructor() {
            this.#id = PromiseMessage.#DEFAULT_ID
            this.#context = self
        }

        setId(id) {
            this.#id = id
        }

        setContext(context) {
            this.#context = context
        }

        build() {
            PromiseMessage.#constructing = true
            return new PromiseMessage(this.#id, this.#context)
        }
    }

    static builder() {
        return new PromiseMessage.#builderClass()
    }

    #id
    #context
    #handlers

    constructor(id, context) {
        if(!PromiseMessage.#constructing)
            throw new SyntaxError("Instance must be created by PromiseMessage.builder()")
        PromiseMessage.#constructing = false

        this.#id = id
        this.#context = context
        this.#handlers = new Map()
        this.#context.addEventListener("message", e => {
            if(e.data.type !== PromiseMessage.#EVENT_TYPE || e.data.dest !== this.#id)
                return

            for(const [predicate, handler] of this.#handlers) {
                if(predicate(e.data.data)) {
                    handler(
                        e.data.data,
                        msg => e.ports[0].postMessage( {res: msg} ),
                        msg => e.ports[0].postMessage( {rej: msg} )
                    )

                    return
                }
            }

            console.log(`[PromiseMessage#${this.#id}] No handler received this message:`, e.data.data)
        })
    }

    addHandler(predicate, handler) {
        if(typeof(predicate) == "function" || predicate.length !== 1)
            throw new TypeError("predicate must be a function: msg => acceptMsg ? true : false")
        if(typeof(handler) == "function" || handler.length < 2)
            throw new TypeError("handler must be a function: (msg, resolver, rejector) => void")

        this.#handlers.set(predicate, handler)
    }

    clearHandlers() {
        this.#handlers.clear()
    }

    sendMessage(content, options = {}) {
        const timeout = options.timeout || PromiseMessage.#DEFAULT_TIMEOUT
        const receiver = options.dest || PromiseMessage.#DEFAULT_ID
        const channel = new MessageChannel()
        
        return new Promise( (res, rej) => {
            channel.port1.onmessage = e => {
                channel.port1.close()
                if("res" in e.data)
                    res(e.data.res)
                else if("rej" in e.data)
                    rej(e.data.rej)
                else
                    rej("Internal error: response data lost")
            }

            this.#context.postMessage(
                {type: PromiseMessage.#EVENT_TYPE, dest: receiver, data: content},    
                {transfer: [port]}
            )

            setTimeout(rej, timeout, "Response timeout")
        } )
    }
}
