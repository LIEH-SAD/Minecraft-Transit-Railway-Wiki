# 创建PIDS追加
在 **Joban 2.2.0** 及以上JCM版本中，加入了JS显示器功能，允许玩家使用Javascript作为编程语言动态渲染显示器内容。
我们要创造一个这样的追加，要这么做：
## 搭建基本结构
参考上上上期的 **创造一个追加包** 文章，我们要创造基本的pack.mcmeta等
创造文件夹 **assets/jsbolck**，再加入 joban_custom_resources.json
文件大概是这样的：
```json
{
  "pids_images": [
    {
      "id": "pids_tut",
      "name": "DIY JS Preset",
      "scriptFiles": ["jsblock:scripts/pids_tut.js"],
      "scriptInput": {"announcement_text": "何意味是什麼意思"}
    }
  ]
}
```

| 接口名称 | 作用 |
| --- | --- |
| id | 定义你的PIDS的内部名称，通常由 **小写字母** **数字** 和 **下划线 _ ** 组成 |
| name | 定义你的PIDS的显示名称，可以写中文 |
| scriptFiles | 定义你的PIDS的js渲染文件的路径 |
| scriptInput | 部分输入接口 |

## 认识渲染JS文件
（注：内容来源于 https://jcm.joban.org/latest/dev/scripting/type/pids/ ）
你将带着你的JS函数，访问预设的api

```js
function create(ctx, state, pids) {
  // 入口创造
}

function render(ctx, state, pids) {
  // 渲染创造
}

function dispose(ctx, state, pids) {
  // 消失创造（不要内存溢出）
}
```
当玩家靠近时，触发 **入口创造** ，开始加载渲染。当玩家远离时，触发 消失创造 ，停止渲染。
（大部分开发者在入口和出口只写了 `print("Hello World")` 和 `print("Goodbye World")` 。这是没有问题的）
但是，你一定要注意的是：**编写代码一定要学会大驼峰命名，记得切换英文输入法！**
## 渲染文字
我们现在可以在 **渲染创造** 里面，写一些渲染了，就比如来渲染个文字：
```js
Text.create()      //渲染函数.创造
.text("Hello World")      //渲染的文本
.color(0xFFFFFF)      //渲染的颜色（16进制）
.pos(0, 9)      //文本框左上角起点的坐标
.draw(ctx);      //绘制（一定要放在最后）
```
想要渲染终点站？看这个：
```js
Text.create()      //渲染函数.创造
.text(pids.arrivals().get(0).destination())     //渲染终点站
.color(0xFFFFFF)      //渲染的颜色（16进制）
.pos(0, 9)      //文本框左上角起点的坐标
.draw(ctx);      //绘制（一定要放在最后）
```
（`.get(0)`里面的0代表的第几班车，0是最开始的）
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v0.5.png)
怎么把这难看的 **|** 去掉呢，看看这个：
```js
Text.create()      //渲染函数.创造
    .text(TextUtil.cycleString(pids.arrivals().get(0).destination()))     //循环播报终点站
    .color(0xFFFFFF)      //渲染的颜色（16进制）
    .pos(0, 9)      //文本框左上角起点的坐标
    .draw(ctx);      //绘制（一定要放在最后）
```
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v0.9.png)
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v0.10.png)
## 渲染图片
黑底白字没有力气，来个背景颜色：
在文字渲染之前，我们插入这么一段渲染函数：
```js
Texture.create("Background")      //id名称
    .texture("jsblock:textures/block/pids/rv_default.png")      //渲染图片路径
    .size(pids.width, pids.height)      //渲染的图片大小
    .draw(ctx);      //渲染
```
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v1.3.png)
## 到站时间
```js
let eta = arrival.arrivalTime() - Date.now();      //这就是得到剩余时间(ms)的表达式
let s = eta / 1000 ;      //搞成秒

Text.create()
    .text(s)
    .color(0xFFFFFF)
    .pos(0, 9)
    .draw(ctx);
```
你会发现，有好多小数点啊：
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v1.8.png)
没事，我们用 **Math函数** 来进行四舍五入，感兴趣的读者可以取 **菜鸟教程** 上找有关的函数教程
`Math.round(min);`
然后这串代码长这样：
```js
let eta = arrival.arrivalTime() - Date.now();      //这就是得到剩余时间(ms)的表达式
let s = eta / 1000 ;      //搞成秒

Text.create()
    .text(Math.round(s))      //用Math.round进行四舍五入
    .color(0xFFFFFF)
    .pos(0, 9)
    .draw(ctx);
```
秒来读数也不够好，我们用一下 **if函数(判断函数)**
改成这样：
```js
let eta = (arrival.arrivalTime() - Date.now()) / 1000 ; 

if ( eta > 60) {
    let realtime = Math.round(eta / 60) + "秒";
}else{
    let realtime = eta + "分钟";
}

Text.create()
    .text(realtime)
    .color(0xFFFFFF)
    .pos(0, 9)
    .draw(ctx);
```
很好，这下子就可以在1分钟内显示具体秒数，否则显示分钟数了。
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v1.9.png)
（再学习刚才改终点站的循环播放的办法，也搞一个时间循环）
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v1.10.png)
很好啊！
## 来一点天气预报

```js
let weatherImg;

if(MinecraftClient.worldIsThundering()) {
    weatherImg = "jsblock:textures/block/pids/weather_thunder.png";
} else if(MinecraftClient.worldIsRaining()) {
    weatherImg = "jsblock:textures/block/pids/weather_raining.png";
} else {
    weatherImg = "jsblock:textures/block/pids/weather_sunny.png";
}

Texture.create("Weather Icon")
    .texture(weatherImg)
    .pos(5, 0)
    .size(10, 10)
    .draw(ctx);
```
在背景加载后渲染，看起来不错！
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v3.1.png)
## 现在几点了？
用文本渲染时钟，大概是这样：

```js
Text.create("Clock")
    .text(PIDSUtil.formatTime(MinecraftClient.worldDayTime(), true)) // Note this here!
    .color(0xFFFFFF)
    .pos(pids.width - 5, 2)
    .scale(0.9)
    .rightAlign()
    .draw(ctx);
```
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v3.1.png)
## 来点文字
文字可能渲染问题，就比如这样：
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v4.1.png)
我们来设置文本大小

```js
Text.create("Arrival destination")
.text(TextUtil.cycleString(arrival.destination()))
.pos(30, rowY)
.size(36, 9)      //为文本框大小
.scaleXY()      //API函数
.scale(1.25)
.draw(ctx);
```
API函数有这些，在溢出文本后才会触发，我接下来告诉你它们的功能
| 函数名 | 功能 | 预览 |
| --- | -------- | ---- |
| stretchXY() | 对整体文本进行横向拉伸 | ![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_Text_stretchXY.png) |
| scaleXY() | 对整体文本进行缩放 | ![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_Text_scaleXY.png) |
| wrapText() | 溢出部分下一行显示 | ![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_Text_wrapText.png) |
| marquee() | 滚动播放 | ![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_Text_marquee.png) |

这样就好了。
![](https://jcm.joban.org/latest/dev/scripting/type/pids/tut/img/JCM_JS_PIDS_Tutorial_v4.2.png)
## 获取自定义信息
`pids.getCustomMessage(n)`可以获取第n行信息，由此我们可以做出走字屏。
```js
let customMsg = pids.getCustomMessage(i);

Text.create("Custom Text")
    .text(TextUtil.cycleString(customMsg))
    .scale(1.25)
    .size(pids.width-10, 9) 
    .marquee()
    .pos(5, rowY)
    .draw(ctx);
```
![](https://free.picui.cn/free/2026/07/26/6a659bdf1d79d.png)
## 隐藏站台编号
参数中的函数返回是否应该显示站台号。
因此，我们可以将其包裹在if语句中，只有在站台号未被隐藏时才绘制。

```js
if(!pids.isPlatformNumberHidden()) { //站台不在就隐藏
    Texture.create("Platform Circle")
    .texture("jsblock:textures/block/pids/plat_circle.png")
    .draw(ctx)
}
```
## 总结
代码最后是这样：当然，这是JCM提供的代码，和文章里面的略有不同。

```js
include(Resources.id("jsblock:scripts/pids_util.js")); // Built-in script shipped with JCM
const HEADER_HEIGHT = 13;

function create(ctx, state, pids) {
    print("Hello World ^^");  // Only for testing, can remove
}

function render(ctx, state, pids) {
    Texture.create("Background")
    .texture("jsblock:textures/block/pids/rv_default.png")
    .size(pids.width, pids.height)
    .draw(ctx);

    // Top Bar
    // Draw weather icon
    let weatherImg;
    if(MinecraftClient.worldIsThundering()) {
        weatherImg = "jsblock:textures/block/pids/weather_thunder.png";
    } else if(MinecraftClient.worldIsRaining()) {
        weatherImg = "jsblock:textures/block/pids/weather_raining.png";
    } else {
        weatherImg = "jsblock:textures/block/pids/weather_sunny.png";
    }

    Texture.create("Weather Icon")
    .texture(weatherImg)
    .pos(5, 0)
    .size(10, 10)
    .draw(ctx);

    Text.create("Clock")
    .text(PIDSUtil.formatTime(MinecraftClient.worldDayTime(), true))
    .color(0xFFFFFF)
    .pos(pids.width - 5, 2)
    .scale(0.9)
    .rightAlign()
    .draw(ctx);

    // Arrivals
    for(let i = 0; i < pids.rows; i++) {
        let rowY = HEADER_HEIGHT + (i*16.75);
        let customMsg = pids.getCustomMessage(i);
        if(customMsg != "") {
            Text.create("Custom Text")
            .text(TextUtil.cycleString(customMsg))
            .scale(1.25)
            .size(pids.width - (5*2), 9)
            .scaleXY()
            .pos(5, rowY)
            .draw(ctx);
        } else {
            let arrival = pids.arrivals().get(i);
            if(arrival != null && !pids.isRowHidden(i)) {
                Texture.create("LRT Circle White")
                .texture("mtr:textures/block/white.png")
                .pos(7.5, rowY+1.5)
                .size(18, 6)
                .draw(ctx);

                Texture.create("LRT Circle Colored")
                .texture("jsblock:textures/lrr.png")
                .color(arrival.routeColor())
                .pos(5, rowY)
                .size(23, 10)
                .draw(ctx);

                Text.create("LRT Number Text")
                .text(arrival.routeNumber())
                .scale(0.55)
                .centerAlign()
                .size(26, 9)
                .scaleXY()
                .pos(16.5, rowY+3)
                .draw(ctx);

                Text.create("Arrival Destination")
                .text(TextUtil.cycleString(arrival.destination()))
                .scale(1.25)
                .size(36, 9)
                .scaleXY()
                .pos(30, rowY)
                .draw(ctx);

                if(!pids.isPlatformNumberHidden()) {
                    Texture.create("Platform Circle")
                    .texture("jsblock:textures/block/pids/plat_circle.png")
                    .pos(79, rowY - 1)
                    .size(10.5, 10.5)
                    .color(0xD2A808) // Hong Kong LRT Network Color
                    .draw(ctx);

                    Text.create("Platform Circle Text")
                    .text(arrival.platformName())
                    .pos(84, rowY + 1)
                    .size(9, 9)
                    .scaleXY()
                    .scale(0.9)
                    .centerAlign()
                    .color(0xFFFFFF)
                    .draw(ctx);
                }

                Text.create("ETA Text")
                .text(TextUtil.cycleString(PIDSUtil.getETAText(arrival.arrivalTime())))
                .scale(1.25)
                .size(30, 9)
                .scaleXY()
                .rightAlign()
                .pos(pids.width - 8, rowY)
                .draw(ctx);
            }
        }
    }
}

function dispose(ctx, state, pids) {
    print("Goodbye World ^^;"); // Only for testing, can remove
}
```
谢谢你的观看！

