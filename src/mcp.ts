import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { cocosMcpServer } from "./cocos";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
class Mcp {
  constructor() {}
  public async run() {
    const server = this.createServer();
    await cocosMcpServer.run();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Cocos MCP Server running on stdio");
  }
  private createServer() {
    const server = new Server({ name: "cocos-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
    server.onclose = () => {
      //
    };
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      // 去插件里面查询能力
      const tools = cocosMcpServer.getListTools();
      return { tools: tools };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const plugin = cocosMcpServer.findPlugin(name);
        if (plugin) {
          // 校验参数，可以考虑放在Creator插件里面做
          // const params = ForecastArgumentsSchema.parse(args);
          // 执行能力
          const ret = await plugin.runCmd(name, args);
          // TODO: 错误处理：https://modelcontextprotocol.io/docs/concepts/tools#error-handling-2
          return { content: [{ type: "text", text: ret || "Failed" }] };
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid arguments: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`);
        }
        throw error;
      }
    });
    return server;
  }
}
export const mcp = new Mcp();
