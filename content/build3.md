# 入口点
在Fabric中，resources文件夹里面有 `fabric.mod.json` 文件，用来储存代码的入口点，以供加载器加载。
比较重要的客户端、主类、mixin的入口点一般会自动生成好，如果路径不存在，则模组不能加载，加载器报错。
我们来看一个比较特殊的入口点：模组菜单入口。
```json
"entrypoints": {
    "modmenu":  [
        "com.Nanbin.ModmenuConfig"
    ]
}
```
模组菜单通过读取它进行配置，当然，这个不是必要的，我们之后创造屏幕会细讲。
对于Forge模组，我们只需要在主类上这么写：
```java
@Mod
public class nanbin {
    [...]
}
```
## Init文件
Init主要负责对全局进行注册，一般的，`Init.java` 写成这样：
```java
package com.Nanbin;    //用来包装当前文件夹（必要）

import com.Nanbin.Blocks.Blocks;
import com.Nanbin.Items.Items;
//引入我们需要的支持库和文件

public final class Init {
    public static final String MOD_ID = "nanbin";    //我们的模组id
    public static final Logger LOGGER = LogManager.getLogger("Nanbin Create Mod");    //定义Logger和名称

    public static void init() {    //当接收到 Init.init() 的举动
        Blocks.init();
        LOGGER.info("Blocks has been Registered!")    //Logger在终端报的信息
        Items.init();
        //[...]
    }
}
```
我们这样要说一下，有些开发者在Logger里面写中文，这会导致两个问题：
    第一：国际化交流不便，不少开发者看不懂中文
    第二：部分终端不支持UTF-8编码文本，中文显示直接乱码
当然，编写完Init还需要让Forge和Fabric的主类去调用它
Fabric这边：
主类：
```java
package com.Nanbin.fabric;

import net.fabricmc.api.ModInitializer;

public class nanbin implements ModInitializer {
    @Override
    public void onInitialize() {
        Init.init();
    }
}
```
客户端一样：
```java
package com.Nanbin.fabric;

import net.fabricmc.api.ClientModInitializer;

public class nanbinClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        InitClient.init();
    }
}
```
然后是Forge这边：
主类
```java
package com.Nanbin.neoforge;

import com.Nanbin.neoforge.client.entrypointNeoForgeClient;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.common.Mod;

import com.verdant_harvest.Init;

@Mod(Init.MOD_ID)
public final class entrypointNeoForge {
    public entrypointNeoForge(IEventBus modEventBus) {
        Init.init();
        entrypointNeoForgeClient.initClient(modEventBus);
    }

}
```
客户端：
```java
package com.Nanbin.neoforge.client;

import com.Nanbin.InitClient;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.api.distmarker.OnlyIn;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.event.lifecycle.FMLClientSetupEvent;

@OnlyIn(Dist.CLIENT)
public class entrypointNeoForgeClient {
    public static void initClient(IEventBus bus) {
        bus.addListener(entrypointNeoForgeClient::onClientSetup);
    }

    private static void onClientSetup(FMLClientSetupEvent event) {
        InitClient.init();
    }
}

```
搞定！
等一下，`Blocks`和`Items`不是没写吗？
剧透了～  