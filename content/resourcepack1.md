## 创造资源包
本文将带你创建一个资源包，它可以是任何支持的模组的。
## 配置开发环境
你需要准备的软件有这些：
| 软件名称 | 官方下载地址 |
| -------- | ------------- |
| 7-zip | https://7-zip.org/download.html/ |
| BlockBench | https://www.blockbench.net/ |
| VS Code | https://code.visualstudio.com/ |
| PhotoShop | https://www.adobe.com/products/photoshop.html/ |

下载并安装这些软件，在你的电脑上。
## 创造项目
创造一个文件夹，名字任意，用VS Code打开。
在文件夹的根目录中创建这些文件：
```
pack.mcmeta             # 资源包配置核心文件（版本、描述）
pack.png                    # 资源包封面图片（可选）
assets/                        #资源包的资源文件夹（等会讲）
data/                          #数据包
```
首先我们来编写核心文件 **pack.mcmeta** :
```json
{
  "pack": {
    "pack_format": 15,
    "description": "自定义材质包"
  }
}
```
我们来讲解一下功能：
| 接口名称 | 作用 |
| -------- | ------------- |
| pack_format | 这是写支持的MC版本，不支持导入也没关系 |
| description | 这是你的资源包导入的简介，可以写任何东西 |

然后是 **pack.png** ：
这点比较简单，你需要用ps制作一个图片，以png形式导出，比例为 1：1
## Assets 文件夹讲解
Assets是资源的储存位置，你应该用 **7z** 将 模组/mc文件 拆包，然后根据模组里面的assets文件进行修改。
一大堆文件，看不懂没关系，我们要知道，他的基本格式。
拆包后你会直接看到 minecraft / mtr / jsblock 这样的文件夹，它们对于的是模组的id，你要修改什么就放进去。
打开后，你可能看到这些文件
| 文件夹 | 作用 |
| -------- | ------------- |
| blockstates | 这是方块状态文件，指定不同状态下面应该使用什么模型 |
| models/block | 这是方块的模型文件 |
| models/item | 这是物品的模型文件 |
| texture | 这是纹理文件 |
| lang | 这是语言文件 |
| sound | 这是声音文件 |

除此之外，你可能遇到这些文件：
| 文件夹 | 作用 |
| -------- | ------------- |
| sounds.json | 定义声音文件的id |
| mtr_custom_resources.json | 定义MTR模组的车辆和告示牌贴图 |
| joban_custom_resources.json | 定义JCM模组的显示屏 |

对于新版本的资源包，这里暂时不涉及。
## 修改它们
你可以用ps和blockbench及VS Code打开这些文件，按照你想要的修改
（我们不在这里讲述它们该怎么用，记得善用Bing）
## 打包
打开你的资源储存文件夹，把目录下所有文件选中，用压缩软件打包成仅储存的zip文件，然后，发布吧。
![6.png](https://free.picui.cn/free/2026/07/26/6a657fd54c0f6.png)



