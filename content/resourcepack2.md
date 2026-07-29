# 方块模型
## 方块状态文件
### 最基础的方块
```json
{
  "variants": {
    "": { "model": "nanbin:block/black_marble" }
  }
}
```
我们只需修改model即可，改成我们的模型真实位置。
### 带有方向的方块

```json
{
  "variants": {
    "facing=north": { "model": "nanbin:block/behavioral_block", "y": 0, "uvlock": true },
    "facing=east":  { "model": "nanbin:block/behavioral_block", "y": 90, "uvlock": true },
    "facing=south": { "model": "nanbin:block/behavioral_block", "y": 180, "uvlock": true },
    "facing=west":  { "model": "nanbin:block/behavioral_block", "y": 270, "uvlock": true }
  }
}
```
这里的`facing`定义方块朝向，利用y方向的偏移值旋转方块。
一般来说我们建模的适合以向北为正，然后建出来的可以直接用这个文件，不是的就修改y的值。
### 带有方向的两格方块
```json
{
	"variants": {
		"facing=north,half=lower": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_bottom",
			"y": 90
		},
		"facing=east,half=lower": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_bottom",
			"y": 180
		},
		"facing=south,half=lower": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_bottom",
			"y": 270
		},
		"facing=west,half=lower": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_bottom",
			"y": 0
		},
		"facing=north,half=upper": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_top",
			"y": 90
		},
		"facing=east,half=upper": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_top",
			"y": 180
		},
		"facing=south,half=upper": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_top",
			"y": 270
		},
		"facing=west,half=upper": {
			"model": "nanbin:block/crt_cab_door_apg_old/fence_apg_top",
			"y": 0
		}
	}
}
```
原版的mtr利用这个方法写，`lower`和`upper`反别代表顶部的方块和底部的方块。
方块的状态定义一般可以根据编写的适合的类看或者类比模组的状态文件进行修改。
## 方块模型文件
在新版的Blockbench中，建模需要先创造一个Java方块模型，然后记得选择1.9-1.21.5的格式版本，不然旋转模型后是神来了也力挽狂澜了
建模没什么好讲的，但是记得，Mod Utils插件读取不了旋转，而且只读VoxelShapes里面的方块。
建好以后可以在`显示调整`里面修改方块的显示，不然会比较奇怪。
### MCP插件和MCP服务器
AI时代，AI也可以用来建模。
首先，购买一个支持图像识别的AI的Token，这比较的贵，推荐使用最新版Deepseek-v4-pro模型或Minimax-M3模型
然后，打开一个Agent客户端，比如Code X和Claude Code，最简单的办法是使用VS Code，也是一个AI编程助手。

接下来以VS Code为例配置。
    1、下载并安装Blockbench的MCP Server插件：https://github.com/jasonjgardner/blockbench-mcp-plugin
    2、找到API Key，获取并妥善保管
    3、充值钱包，确保有足够的用于Token（图像识别烧钱）
    4、找到API帮助文档，寻找OpenAI格式的接口地址，比如云雾API的：https://yunwu.ai
    5、查看模型，找个图像识别的，找到模型ID，比如：claude-opus-4-7
    6、在设置里面找到语言模型，添加模型，选Custom Endpoint
    7、自定义名称，输入刚才的API Key，选responses接口
    8、把id和接口地址输入
    9、打开智能体模式，找到MCP服务器，选择远程模式
    10、打开BlockBench的插件，找到MCP服务器，找到服务器端口，复制。
    11、在VS Code里面输入地址 localhost://服务器端口
    12、选择刚加入的模型，进行对话，询问是否能看到BlockBench
   
纹理也可以用生图AI制作，去掉水印可以用PhotoShop
