// ==UserScript==
// @name         capturer
// @namespace    http://tampermonkey.net/
// @version      2024-05-11
// @description  capture your mouse event
// @author       aaadddfgh
// @grant        GM_registerMenuCommand
// ==/UserScript==
class SleepEvent {
    durtion: number
}

class EventSctipt{
    url:string
    windowInfo:{
        outerHeight:number,
        outerWidth:number,
        innerHeight:number,
        innerWidth:number,
    }
    actions:(MouseEvent | SleepEvent)[]
}

var fullScreenProxyReord: (MouseEvent | SleepEvent)[] = []

var result=new EventSctipt();

class FullScreenProxy extends HTMLElement {
    lastActionTime: number;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.init();
    }

    init() {
        // 创建一个全屏的div  
        const fullScreenDiv = document.createElement('div');
        fullScreenDiv.style.position = 'fixed';
        fullScreenDiv.style.top = '0';
        fullScreenDiv.style.left = '0';
        fullScreenDiv.style.width = '100%';
        fullScreenDiv.style.height = '100%';
        fullScreenDiv.style.zIndex = '99999';
        fullScreenDiv.style.pointerEvents = 'auto'; // 确保可以接收点击事件  
        fullScreenDiv.style.background = 'rgba(0, 0, 0, 0)'; // 透明背景  

        // 监听点击事件  
        fullScreenDiv.addEventListener('click', (e) => {
            this.dispatchEventToElementFromPoint(e);
        });

        // 将全屏div添加到shadow DOM中  
        this.shadowRoot!.appendChild(fullScreenDiv);
    }

    // 代理事件到elementsFromPoint的第二个元素  
    dispatchEventToElementFromPoint(event: MouseEvent) {
        const elements = document.elementsFromPoint(event.clientX, event.clientY);
        // 确保有至少两个元素在指定点  
        if (elements.length > 1) {
            const targetElement = elements[1];
            // 创建并触发新的事件（这里以'click'为例）  
            const newEvent = new MouseEvent('click', event);
            targetElement.dispatchEvent(newEvent);

            if (this.lastActionTime != undefined && this.lastActionTime != null) {
                let sleep = new SleepEvent();
                sleep.durtion = Date.now() - this.lastActionTime;
                fullScreenProxyReord.push(sleep)
            }
            this.lastActionTime = Date.now();
            fullScreenProxyReord.push(newEvent)
        }
    }
}
customElements.define('full-screen-proxy', FullScreenProxy);

var proxyInstance = null;


GM_registerMenuCommand("start record", () => {
    result =new EventSctipt()
    if (fullScreenProxyReord.length !== 0) {
        if (!window.confirm("some thing may not save, still start record?")) {
            return
        }

    }
    fullScreenProxyReord = []
    if (proxyInstance !== null) {
        document.querySelector("html")?.removeChild(proxyInstance)
    }
    proxyInstance = new FullScreenProxy()
    document.querySelector("html")?.appendChild(proxyInstance)
})

GM_registerMenuCommand("stop", () => {

    document.querySelector("html")?.removeChild(proxyInstance)
    proxyInstance = null

})
GM_registerMenuCommand("export", () => {

    
    result.url=location.toString();
    result.windowInfo={
        "outerHeight":window.outerHeight,
        "outerWidth":window.outerWidth,
        "innerHeight":window.innerHeight,
        "innerWidth":window.innerWidth,
    }
    result.actions=fullScreenProxyReord;
    console.log(result)
    

})

function Sleep(duration: number) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

GM_registerMenuCommand("play", async () => {
    for (const i of fullScreenProxyReord) {
        if (i instanceof SleepEvent) {
            await Sleep(i.durtion);
        }
        else {
            const elements = document.elementsFromPoint(i.clientX, i.clientY);
            if (elements.length > 1) {
                const targetElement = elements[0];
                // 创建并触发新的事件（这里以'click'为例）  
                const newEvent = new MouseEvent('click', i);
                targetElement.dispatchEvent(newEvent);
            }
        }
    }
})
