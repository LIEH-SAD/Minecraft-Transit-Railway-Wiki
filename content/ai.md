# AI工具在资源包创建的应用
首先，购买一个AI的Token，这比较的贵，推荐使用最新版Deepseek-v4-pro模型或Minimax-M3模型
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
## MCP插件和MCP服务器
AI时代，AI也可以用来建模。
## 纹理生成    
纹理也可以用生图AI制作，去掉水印可以用PhotoShop
