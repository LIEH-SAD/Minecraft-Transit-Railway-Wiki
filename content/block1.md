# 创造方块
我们首先建立`Blocks.java`，这是方块的注册类
（本教程适合MTR4.0.0及以上的开发）
## 注册方块
像图这样添加代码：

```java
public class Blocks {
    public static final BlockRegistryObject TEST_BLOCK_1;
    public static final BlockRegistryObject TEST_BLOCK_2;

    static {
        TEST_BLOCK_1 = REGISTRY.registerBlockWithBlockItem(new Identifier(MOD_ID, "test_block_1"), () -> new Block(new BlockExtension(createDefaultBlockSettings(false))) , ItemsGroup.CITY_BUILDING_BLOCKS);
        TEST_BLOCK_2 = REGISTRY.registerBlockWithBlockItem(new Identifier(MOD_ID, "test_block_2"), () -> new Block(new Block(AbstractBlock.Settings.create())) , ItemsGroup.CITY_BUILDING_BLOCKS);
      }

    public static void init() {}
}
```
我们对进行分析：
### 定义方块类
`public static final BlockRegistryObject TEST_BLOCK_1;`，这行代码主要是这些：
| 部分 | 功能 |
| --- | --- |
| `public` | 表示这是公开类，允许所有项访问 |
| `final` | 让项不可重赋值 |
| `BlockRegistryObject` | MTR映射提供的方块定义类 |
| `TEST_BLOCK_1` | 内部命名 |

我们只推荐你修改内部命名。
### 注册方块和图标
`TEST_BLOCK_1 = REGISTRY.registerBlockWithBlockItem(new Identifier(MOD_ID, "test_block_1"), () -> new Block(new BlockExtension(createDefaultBlockSettings(false))) , ItemsGroup.CITY_BUILDING_BLOCKS);`
我们看看这个：
| 部分 | 功能 |
| --- | --- |
| `TEST_BLOCK_1` | 我们刚才写的内部命名 |
| `REGISTRY.registerBlockWithBlockItem` | MTR提供的方块/方块物品/物品组注册方法 |
| `MOD_ID` | 你的模组 |
| `TEST_BLOCK_1` | 内部命名 |
| `BlockExtension` | 方块类 |
| `ItemsGroup.CITY_BUILDING_BLOCKS` | 注册物品组 |

### 仅注册方块
`TEST_BLOCK_1 = REGISTRY.registerBlock(new Identifier(MOD_ID, "test_block_1"), () -> new Block(new BlockExtension(createDefaultBlockSettings(false))) );`
## 定义方块类
像`BlockExtension`这样的类还有很多，我们来讲点MTR模组和原版的部分类
| 类名 | 构造方法 | 功能 |
| -- | ------ | -------- |
| `BlockExtension` | createDefaultBlockSettings(false) | 注册一个普通的方块 |
| `SlabBlockExtension` | createDefaultBlockSettings(false) | 注册一个半砖的方块 |
| `BlockGlassFence` | - | 注册一个栏杆方块 |
| `BlockStationColor` | - | 注册一个车站颜色方块(这个不能直接构造出来) |

较多的类需要逆向原版文件和类比MTR模组和其他模组的注册文件，我们不一一赘述。
## 自定义方块类
在软件包`Block`里面，可以写一个类，它大概是这样的。
首先，创建一个类，类名自定义。
基于原版或其他模组的类编写。
### super函数
`super`作为一个构建函数，作用是定义构建方法
```java
public class BlockCeiling extends BlockExtension implements DirectionHelper {

    public BlockCeiling(BlockSettings blockSettings) {
        super(blockSettings);
    }
    //接下来的代码省略
}
```
像这个类，构造方法就是`createDefaultBlockSettings(false)`
### 创造有碰撞和方向的方块
我直接给你我已经完成的类：
```java
public class BlockCeiling extends BlockExtension implements DirectionHelper {

//第一段
    public BlockCeiling(BlockSettings blockSettings) {
        super(blockSettings);
    }

//第二段
    public BlockState getPlacementState2(ItemPlacementContext ctx) {
        return this.getDefaultState2().with(new Property<>(FACING.data), ctx.getPlayerFacing().data);
    }

//第三段
    @Nonnull
    public VoxelShape getOutlineShape2(BlockState state, BlockView world, BlockPos pos, ShapeContext context) {
        return IBlock.getVoxelShapeByDirection(0, 0, 0, 16, 5, 16, IBlock.getStatePropertySafe(state, FACING));
    }

//第四段
    public void addBlockProperties(List<HolderBase<?>> properties) {
        super.addBlockProperties(properties);
        properties.add(FACING);
    }
}
```

| 代码 | 作用 |
| --- | --- |
| BlockCeiling | 类名 |
| 第一段代码 | 加载构造方法 |
| 第二段代码 | 加载方块方向 |
| 第三段代码 | 加载方块碰撞箱 |
| 第四段代码 | 加载方块性质 |

你需要修改的一般是第三段代码，可以使用Blockbench的Mod Utils插件导出方块碰撞箱，但是，原版的MTR模组并不支持多个碰撞箱叠加，仅允许两个。对此，[南滨创意]重写了逻辑，允许加入任意个碰撞箱，参见
https://github.com/LIEH-SAD/Nanbin-Create-Mod/blob/main/1.20.1/mtr4/fabric/src/main/java/com/Nanbin/Registry/RegMean/VoxelShapes.java
你可以把它直接复制到你的模组的`mappings`文件夹，然后这么修改第三段代码：

```java
@Nonnull
    public VoxelShape getOutlineShape2(BlockState state, BlockView world, BlockPos pos, ShapeContext context) {
        VoxelShape shape1 = IBlock.getVoxelShapeByDirection(0, 12, 0, 16, 16, 7, IBlock.getStatePropertySafe(state, FACING));
        VoxelShape shape2 = IBlock.getVoxelShapeByDirection(0, 0, 4, 4, 12, 16, IBlock.getStatePropertySafe(state, FACING));
        VoxelShape shape3 = IBlock.getVoxelShapeByDirection(0, 12, 7, 7, 16, 16, IBlock.getStatePropertySafe(state, FACING));
        VoxelShape shape4 = IBlock.getVoxelShapeByDirection(0, 0, 0, 16, 12, 4, IBlock.getStatePropertySafe(state, FACING));
        return VoxelShapes.union(shape1, shape2, shape3, shape4);
    }
```
按照这个方法，你的方块碰撞箱理论来说可以无限复杂，但是复杂的代价是优化差。
## 创造资源
资源和纹理需要注意的是：
    1、Assets文件夹里面创造的文件夹名字一定是你的MOD_ID
    2、blockstates和models/item里面的文件名保持和你的 方块/物品 id一致
    3、学会拆包，类比他人的包学习

### 方块状态文件
#### 最基础的方块
```json
{
  "variants": {
    "": { "model": "nanbin:block/black_marble" }
  }
}
```
我们只需修改model即可，改成我们的模型真实位置。
#### 带有方向的方块

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
#### 带有方向的两格方块
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
### 方块模型文件
在新版的Blockbench中，建模需要先创造一个Java方块模型，然后记得选择1.9-1.21.5的格式版本，不然旋转模型后是神来了也力挽狂澜了
建模没什么好讲的，但是记得，Mod Utils插件读取不了旋转，而且只读VoxelShapes里面的方块。
建好以后可以在`显示调整`里面修改方块的显示，不然会比较奇怪。
#### MCP插件和MCP服务器
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

