// ==UserScript==
// @name         capturer
// @namespace    http://tampermonkey.net/
// @version      2024-05-11
// @description  capture your mouse event
// @author       aaadddfgh
// @grant        GM_registerMenuCommand



// ==/UserScript==
class SleepEvent {
    duration: number
}

class MouseEventExport {
    clientX: number
    clientY: number
    offsetX: number
    offsetY: number
    pageX: number
    pageY: number
    screenX: number
    screenY: number
    altKey: boolean
    bubbles: boolean
    button: number
    buttons: number
    cancelBubble?: boolean
    cancelable: boolean
}
class EventSctipt {
    url: string
    windowInfo: {
        outerHeight: number,
        outerWidth: number,
        innerHeight: number,
        innerWidth: number,
    }
    actions: (MouseEventExport | SleepEvent)[]
}

function downloadTextAsFile(text, fileName = 'download.txt') {
    // 创建一个新的 Blob 对象，包含要写入文件的数据  
    const blob = new Blob([text], { type: 'text/plain' });

    // 创建一个指向该对象的URL  
    const url = URL.createObjectURL(blob);

    // 创建一个新的a元素用于下载  
    const a = document.createElement('a');
    a.style.display = 'none'; // 隐藏这个元素  
    a.href = url;
    // 设置下载的文件名  
    a.download = fileName;

    // 触发下载  

    a.click(); // 模拟点击  


    // 释放URL对象  
    URL.revokeObjectURL(url);
}

var fullScreenProxyReord: (MouseEvent | SleepEvent)[] = []

var result = new EventSctipt();

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
                sleep.duration = Date.now() - this.lastActionTime;
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
    result = new EventSctipt()
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


    result.url = location.toString();
    result.windowInfo = {
        "outerHeight": window.outerHeight,
        "outerWidth": window.outerWidth,
        "innerHeight": window.innerHeight,
        "innerWidth": window.innerWidth,
    }

    let record: (MouseEventExport | SleepEvent)[] = []
    fullScreenProxyReord.forEach(
        (e) => {
            if (e instanceof SleepEvent) {
                record.push(e)
            }
            else {
                let { 
                    clientX,
                    clientY,
                    offsetX,
                    offsetY,
                    pageX,
                    pageY,
                    screenX,
                    screenY,
                    altKey,
                    bubbles,
                    button,
                    buttons,
                    cancelable
                } = e
                record.push({
                    clientX,
                    clientY,
                    offsetX,
                    offsetY,
                    pageX,
                    pageY,
                    screenX,
                    screenY,
                    altKey,
                    bubbles,
                    button,
                    buttons,
                    cancelable
                })
            }
        }
    )

    result.actions = record;

    downloadTextAsFile(JSON.stringify(result))
    console.log(result)


})

function Sleep(duration: number) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

function isSleepEvent(e: any): e is SleepEvent {
    if (e.duration) {
        return true;
    }
    return false;
}

GM_registerMenuCommand("play", async () => {
    for (const i of fullScreenProxyReord) {
        if (isSleepEvent(i)) {
            await Sleep(i.duration);
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


GM_registerMenuCommand("import", async () => {

    let code = prompt("输入导出的数据");

    try {
        const data: EventSctipt = JSON.parse(code);
        fullScreenProxyReord = data.actions as (MouseEvent | SleepEvent)[];

    }
    catch (err) {
        window.alert(err)
    }

    //** following code can not use in firefox */
    // const fileInput = document.createElement('input');
    // fileInput.type = 'file';
    // fileInput.accept = '.txt';
    // fileInput.id = 'dynamicFileInput';
    // // 将文件输入元素添加到页面中  
    // // 为文件输入元素添加change事件监听器  
    // fileInput.addEventListener('change', function (e) {
    //     var file = e.target.files[0];
    //     if (!file) {
    //         alert('请选择一个文件');
    //         return;
    //     }
    //     var reader = new FileReader();
    //     reader.onload = function (e) {
    //         var text = e.target.result;
    //         console.log(text); // 在控制台打印文本内容  
    //         alert('文件内容:\n' + text); // 使用弹窗显示文件内容  
    //     };
    //     // 读取文件内容作为文本  
    //     console.log(reader.readAsText(file));
    // });
    // fileInput.click();
});