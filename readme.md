
# cocos-mcp

基于mcp协议，实现通过AI去操作CocosCreator编辑器。

## 使用教程
1. 安装nodejs，并全局安装`cocos-mcp`
    > npm i cocos-mcp -g

2. 在mcp客户端(vscode/windsurf等)中配置mcp-server


    ```json
    {
        "cocos-mcp": {
            "command": "cocos-mcp",
        }
    }
    ```

3. 下载支持mcp协议的cocos creator插件，并安装到creator项目中
4. 在mcp客户端中刷新mcp-server，如果一切正常，就会看到creator插件提供的mcp tools。