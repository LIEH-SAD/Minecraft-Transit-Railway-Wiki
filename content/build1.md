# 搭建开发环境
我们正式开启了模组制作的教程，准备好你的16GB内存电脑带上稳定的磁盘（不少于20GB剩余空间），加入模组编写的大队吧！
# 下载 Intellij IDEA
访问：https://www.jetbrains.com/zh-cn/idea/download/
下载并安装IDEA
# 连接Clash
Clash的安装和代理的检索请上网搜寻，由于部分原因在此不赘述。
打开Clash，在首页我们可以看到 **系统代理地址** ，它通常是 `172.0.0.1:7897`
打开IDEA，在左下角的设置图标里面，选中设置
然后，在 `外观与行为 \ 系统设置 \ HTTP代理` 里面找到 **手动配置代理**
我的是默认状态，按这样填写。
![屏幕截图 2026-07-26 171337.png](https://free.picui.cn/free/2026/07/26/6a65cfcf0863e.png)
## 安装插件
我们要安装两个插件，是 **Minecraft Development** 和 **Github Copilot**
我来解释一下
| 名称 | 作用 |
| ---- | ----|
| Minecraft Development | MC模组一键配置工具及支持 |
| Github Copilot | AI Agent工具，辅助编写代码 |

安装结束后，重启IDEA以适应
## 加载 Minecraft 开发环境
新建项目，选择Minecraft生成器，然后模板用MultiLoader，安装规范填写其他信息，包名不要写com.example！
创建后等待Gradle自动配置，出现问题请善用AI工具，大部分原因是代理或者Gradle服务器的问题。
坐和放宽，好东西就要来了！
构造成功，上面工具栏有一个 **Minecraft Client** 的运行项，我们直接运行，不出意外会进入mc的主页面。
## 别急着编代码，还没有配置模组呢
MultiLoader生成了多平台的开发环境，我们来先认识一下这些文件夹和作用。
| 文件夹/文件路径 | 核心作用 | 代码存放规范 |
| ---- | ---- | ---- |
| 项目根目录 | 工程总入口，存放Gradle脚本、全局配置、启动脚本gradlew | 无业务代码，仅配置文件 |
| common | 跨平台通用核心模块，Fabric/NeoForge共用代码载体 | 95%业务逻辑写此处；MTR API调用、列车/方块/物品注册、通用资源全部放这里，禁止平台独有代码 |
| common/src/main/java | 通用Java源码目录 | MTR附属核心逻辑、自定义车辆注册、公共工具类 |
| common/src/main/resources | 通用资源目录 | 贴图、模型、mtr_custom_resources.json列车配置、语言文件 |
| fabric | Fabric加载器专属模块 | 仅存放Fabric独有逻辑，不写通用业务 |
| fabric/src/main/java | Fabric平台源码 | Fabric Mod入口、Fabric专属事件、Fabric Mixin |
| fabric/src/main/resources | Fabric专属资源 | fabric.mod.json模组元数据、Fabric独有贴图配置 |
| neoforge | NeoForge加载器专属模块 | 仅存放NeoForge独有逻辑，不写通用业务 |
| neoforge/src/main/java | NeoForge平台源码 | NeoForge Mod入口、Forge专属事件、NeoForge Mixin |
| neoforge/src/main/resources | NeoForge专属资源 | mods.toml模组元数据、NeoForge独有配置 |
| gradle.properties | 全局版本统一配置文件 | 统一MC、加载器、Architectury、MTR版本、模组基础信息 |
| settings.gradle | Gradle工程模块注册配置 | 声明common、fabric、neoforge三个子模块 |
| build.gradle(根目录) | 全局仓库、插件依赖配置 | 配置MTR官方Maven、Architectury、Fabric/NeoForge仓库源 |
| common/build.gradle | 通用模块依赖脚本 | 引入MTR主模组依赖、Architectury API、MC核心依赖 |
| fabric/build.gradle | Fabric子模块构建脚本 | 继承common代码，引入Fabric API、Fabric Loader依赖 |
| neoforge/build.gradle | NeoForge子模块构建脚本 | 继承common代码，引入NeoForge加载器依赖 |

首先，在build.gradle文件里面，这么改：
在添加 Maven 仓库（根目录 build.gradle），所有第三方 Mod 都需要先配置对应 maven 源，复制到根`build.gradle`的`repositories{}`内
```groovy
repositories {
   //CurseMaven仓库
   maven {
        url "https://cursemaven.com"
    }
    //Modrinth仓库
    maven {
        name = "Modrinth"
        url = "https://api.modrinth.com/maven"
    }
    //Modmenu仓库
    maven {
        name = "Terraformers"
        url = "https://maven.terraformersmc.com/"
    }
    //子悦解说的仓库
    maven {
        url = "https://maven.ziyuesinicization.site/releases/"
    }
}
```
然后根据作用在不同的端加入不同的依赖
首先是全局依赖，我们需要 javax 的语法，把它加到根目录下的`build.gradle`。
```groovy
dependencies {
    implementation 'com.google.code.findbugs:jsr305:3.0.2'
}
```
我们加了一个谷歌的仓库的文件，有了它可以使用javax的语法，因为mtr模组大量使用了它。
然后是模组以及附属模组，在对应的文件夹加对应的加载器的模组，比如在fabric文件夹的`build.gradle`里面加入
```groovy
dependencies {
    modImplementation "maven.modrinth:minecraft-transit-railway:FABRIC-4.1.0-beta.2+1.21.1"
    modApi "maven.modrinth:architectury-api:13.0.11+fabric"
    modImplementation "com.terraformersmc:modmenu:11.0.4"
    modApi("ziyue.filters:filters-fabric:1.1.0+1.21.1") {exclude(group: "net.fabricmc")}
}
```
同理，在neoforge文件夹的`build.gradle`里面加入
```groovy
dependencies {
    implementation("maven.modrinth:minecraft-transit-railway:NEOFORGE-4.1.0-beta.2+1.21.1")
    implementation("maven.modrinth:architectury-api:13.0.11+neoforge")
    implementation("ziyue.filters:filters-neoforge:1.1.0+1.21.1")
}
```
然后，在右边的工具栏找到大象图标，找到`同步所有Gradle项目`，静待佳音。
运行看看，应该mtr模组正常加载了。
## 编写的那些事
注意了，我们一般在`fabric/src/main/java/com.xxxx`里面编写，这里以`com.nanbin`为例
在fabric的java文件夹创造这些：
| 文件(文件夹)名 | 作用 |
| --- | --- |
| Init.java | 引导加载主类 |
| InitClient.java | 引导加载客户端 |
| client | 客户端储存文件夹 |
| Blocks.java | 方块注册文件 |
| Items | 物品注册文件 |
| ItemsGroup.java | 物品组注册文件 |
| SoundEvent.java | 声音注册文件 |
| Block | 方块类定义文件夹 |
| Item | 物品类定义储存文件夹 |
| BlockEntity.java | 方块渲染存储文件 |



