/*
Reference: https://gist.github.com/walfie/a80c4432bcff70fb826d5d28158e9cc4
*/

function createWorkerFromFunc(func, ...definitions) {
    const definitionContents = [...definitions, func].map(x => x.toString()).join("\n")
    const blobContents = [`${definitionContents}\n${func.name}()`]
    const blob = new Blob(blobContents, { type: "application/javascript" })

    const blobUrl = URL.createObjectURL(blob)
    const worker = new Worker(blobUrl)
    URL.revokeObjectURL(blobUrl)

    return worker
}

// Add self.originUri to the worker context
function createWorkerFromFile(scriptFile, isRelative = true) {
    function initWorker() {
        // importScripts(...URIs) can be used in worker threads using full path (synchronous import)
        self.onmessage = (e) => {
            console.log(`Loading script: ${e.data}`)
            self.originUri = e.data     // Add scriptFile path to worker context
            importScripts(e.data)
        }
    }

    const worker = createWorkerFromFunc(initWorker)
    if(!isRelative) {
        worker.postMessage(scriptFile)
    } else {
        // Resolve relative path
        const selfOrigin = self.document !== undefined ? document.location.href : self.originUri
        const relativePathParts = scriptFile.split("/").reduce((accArr, part) => {
            if(part === "..")
                accArr.pop()
            else if(part !== ".")
                accArr.push(part)

            return accArr
        }, [])

        const absolutePath = selfOrigin.split("/").slice(0, -1).concat(relativePathParts).join("/")
        worker.postMessage(absolutePath)
    }

    return worker
}
