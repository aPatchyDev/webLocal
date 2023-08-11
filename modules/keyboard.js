function measureKeyboardRepeatInterval(targetDom) {
    let counter = 0
    const timer = {start: null, end: null}

    const TEST_FROM = 100
    const TEST_FOR = 1000
    const TEST_UNTIL = TEST_FROM + TEST_FOR

    const CHECKER_INT = TEST_FOR * 40

    const handler = () => {
        ++counter
        if(counter === TEST_FROM)
            timer.start = Date.now()
        else if(counter === TEST_UNTIL)
            timer.end = Date.now
    }

    targetDom.addEventListener("keydown", handler)

    return new Promise((resolver, rejector) => {
        const checker = () => {
            if(timer.end !== null) {
                targetDom.removeEventListener("keydown", handler)
                resolver([timer.end - timer.start, TEST_FOR])
            } else {
                setTimeout(checker, 1000);
            }
        }

        setTimeout(checker, CHECKER_INT)
        setTimeout(rejector, CHECKER_INT << 1)  // Fail-safe
    })
}

/*
Simultaneous pressing of opposing arrow keys can be buggy on some PC
*/
class KeyboardHandler {
    // Default value obtained from empirical analysis that yielded:
    // 32.969, 32.965, 32.971, 32.963, 32.969 -> avg = 32.9674
    constructor(targetDom, repeatInterval = 33) {
        this.element = targetDom
        this.repeatInterval = repeatInterval
        this.elementHandler = {
            keyup: this.userKeyUp.bind(this),
            keydown: this.userKeyDown.bind(this)
        }

        // For small list, [].includes may be faster than Set.has
        // but probably micro-optimization that's not critical yet
        this.interceptedKeys = new Set()

        this.state = {}
        this.keyHandlers = {}
    }

    /*
    For internal use only
    */

    setKeyUp(e) {
        this.state[e.code] = false
    }

    setKeyDown(e) {
        if(!this.state[e.code]) {
            this.state[e.code] = true
            if(this.keyHandlers[e.code])
                this.keyHandlers[e.code](e)
        }
    }

    userKeyUp(e) {
        if(!this.interceptedKeys.has(e.code))
            this.setKeyUp(e)
    }

    userKeyDown(e) {
        if(!this.interceptedKeys.has(e.code))
            this.setKeyDown(e)
    }

    /*
    Methods below this point are for public usage
    */

    attach() {
        for(const eType in this.elementHandler) {
            this.element.addEventListener(eType, this.elementHandler[eType])
        }
        return this
    }

    detach() {
        for(const eType in this.elementHandler) {
            this.element.removeEventListener(eType, this.elementHandler[eType])
        }
        return this
    }

    /*
    @param handler (KeyboardEvent) => {do_stuff()}
    */
    setKeyHandler(onCode, handler, repeatable = true) {
        const repeater = (e) => {
            if(this.state[e.code]) {
                handler(e)
                setTimeout(repeater, this.repeatInterval, e)
            }
        }

        this.keyHandlers[onCode] = repeatable ? repeater : handler
        return this
    }

    unsetKeyHandler(onCode) {
        this.keyHandlers[onCode] = null
        return this
    }

    /*
    Methods below this point are for simulating user input programatically
    - User input of the same key input will be ignored
    */

    interceptKey(code) {
        this.interceptedKeys.add(code)
        return this
    }

    deinterceptKey(code) {
        this.interceptedKeys.delete(code)
        return this
    }

    injectKeyUp(e) {
        const ev = typeof(e) === "string" ? new KeyboardEvent("keyup", {code: e}) : e
        this.setKeyUp(ev)
        return this
    }

    injectKeyDown(e) {
        const ev = typeof(e) === "string" ? new KeyboardEvent("keydown", {code: e}) : e
        this.setKeyDown(ev)
        return this
    }
}

const KeyboardCodes = {
    F1: "F1", F2: "F2", F3: "F3", F4: "F4",
    F5: "F5", F6: "F6", F7: "F7", F8: "F8",
    F9: "F9", F10: "F10", F11: "F11", F12: "F12",

    UP: "ArrowUp", DOWN: "ArrowDown",
    LEFT: "ArrowLeft", RIGHT: "ArrowRight",

    KEY1: "Digit1", KEY2: "Digit2",
    KEY3: "Digit3", KEY4: "Digit4",
    KEY5: "Digit5", KEY6: "Digit6",
    KEY7: "Digit7", KEY8: "Digit8",
    KEY9: "Digit9", KEY0: "Digit0",

    CAPS: "CapsLock", SCROLLLOCK: "ScrollLock",

    INSERT: "Insert", HOME: "Home", DEL: "Delete",
    END: "End", PGUP: "PageUp", PGDOWN: "PageDown",

    PAUSE: "Pause", /* PrintScreen not detectable */

    LSHIFT: "ShiftLeft", RSHIFT: "ShiftRight",
    LCTRL: "ControlLeft", RCTRL: "ControlRIght",
    LALT: "AltLeft", RALT: "AltRight",
    LWIN: "MetaLeft", RWIN: "MetaRight",
    HANGUL: "Lang1", HANJA: "Lang2", RMENU: "ContextMenu",

    ESC: "Escape",

    NUMLOCK: "NumLock",
    NUM0: "Numpad0", NUM1: "Numpad1",
    NUM2: "Numpad2", NUM3: "Numpad3",
    NUM4: "Numpad4", NUM5: "Numpad5",
    NUM6: "Numpad6", NUM7: "Numpad7",
    NUM8: "Numpad8", NUM9: "Numpad9",
    NUMSLASH: "NumpadDivide", NUMMUL: "NumpadMultiply",
    NUMMINUS: "NumpadSubtract", NUMPLUS: "NumpadAdd",
    NUMENTER: "NumpadEnter", NUMPERIOD: "NumpadDecimal",

    TAB: "Tab", ENTER: "Enter", BACKSPACE: "Backspace",
    BACKTICK: "Backquote", MINUS: "Minus", EQUAL: "Equal",
    LSQRBRACKET: "BracketLeft", RSQRBRACKET: "BracketRight",
    BACKSLASH: "Backslash", SLASH: "Slash",
    SEMICOLON: "Semicolon", QUOTE: "Quote",
    COMMA: "Comma", PERIOD: "Period",

    KEYA: "KeyA", KEYB: "KeyB", KEYC: "KeyC",
    KEYD: "KeyD", KEYE: "KeyE", KEYF: "KeyF",
    KEYG: "KeyG", KEYH: "KeyH", KEYI: "KeyI",
    KEYJ: "KeyJ", KEYK: "KeyK", KEYL: "KeyL",
    KEYM: "KeyM", KEYN: "KeyN", KEYO: "KeyO",
    KEYP: "KeyP", KEYQ: "KeyQ", KEYR: "KeyR",
    KEYS: "KeyS", KEYT: "KeyT", KEYU: "KeyU",
    KEYV: "KeyV", KEYW: "KeyW", KEYX: "KeyX",
    KEYY: "KeyY", KEYZ: "KeyZ"
}

const KeyboardCodesets = {
    fn: [
        KeyboardCodes.F1, KeyboardCodes.F2,
        KeyboardCodes.F3, KeyboardCodes.F4,
        KeyboardCodes.F5, KeyboardCodes.F6,
        KeyboardCodes.F7, KeyboardCodes.F8,
        KeyboardCodes.F9, KeyboardCodes.F10,
        KeyboardCodes.F11, KeyboardCodes.F12
    ],

    arrows: [
        KeyboardCodes.UP, KeyboardCodes.DOWN,
        KeyboardCodes.LEFT, KeyboardCodes.RIGHT
    ],

    mainNums: [
        KeyboardCodes.KEY1, KeyboardCodes.KEY2,
        KeyboardCodes.KEY3, KeyboardCodes.KEY4,
        KeyboardCodes.KEY5, KeyboardCodes.KEY6,
        KeyboardCodes.KEY7, KeyboardCodes.KEY8,
        KeyboardCodes.KEY9, KeyboardCodes.KEY0
    ],

    mainToggles: [
        KeyboardCodes.CAPS, KeyboardCodes.SCROLLLOCK
    ],

    unprintable: [
        KeyboardCodes.INSERT, KeyboardCodes.HOME,
        KeyboardCodes.DEL, KeyboardCodes.END,
        KeyboardCodes.PGUP, KeyboardCodes.PGDOWN,
        KeyboardCodes.BACKSPACE
    ],

    numpads: [
        KeyboardCodes.NUMLOCK,
        KeyboardCodes.NUM0, KeyboardCodes.NUM1,
        KeyboardCodes.NUM2, KeyboardCodes.NUM3,
        KeyboardCodes.NUM4, KeyboardCodes.NUM5,
        KeyboardCodes.NUM6, KeyboardCodes.NUM7,
        KeyboardCodes.NUM8, KeyboardCodes.NUM9,
        KeyboardCodes.NUMSLASH, KeyboardCodes.NUMMUL,
        KeyboardCodes.NUMMINUS, KeyboardCodes.NUMPLUS,
        KeyboardCodes.NUMENTER, KeyboardCodes.NUMPERIOD
    ],

    printable: [
        KeyboardCodes.TAB, KeyboardCodes.ENTER,
        KeyboardCodes.BACKTICK, KeyboardCodes.MINUS, KeyboardCodes.EQUAL,
        KeyboardCodes.LSQRBRACKET, KeyboardCodes.RSQRBRACKET,
        KeyboardCodes.BACKSLASH, KeyboardCodes.SLASH,
        KeyboardCodes.SEMICOLON, KeyboardCodes.QUOTE,
        KeyboardCodes.COMMA, KeyboardCodes.PERIOD,

        KeyboardCodes.KEYA, KeyboardCodes.KEYB, KeyboardCodes.KEYC,
        KeyboardCodes.KEYD, KeyboardCodes.KEYE, KeyboardCodes.KEYF,
        KeyboardCodes.KEYG, KeyboardCodes.KEYH, KeyboardCodes.KEYI,
        KeyboardCodes.KEYJ, KeyboardCodes.KEYK, KeyboardCodes.KEYL,
        KeyboardCodes.KEYM, KeyboardCodes.KEYN, KeyboardCodes.KEYO,
        KeyboardCodes.KEYP, KeyboardCodes.KEYQ, KeyboardCodes.KEYR,
        KeyboardCodes.KEYS, KeyboardCodes.KEYT, KeyboardCodes.KEYU,
        KeyboardCodes.KEYV, KeyboardCodes.KEYW, KeyboardCodes.KEYX,
        KeyboardCodes.KEYY, KeyboardCodes.KEYZ
    ]
}
