import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { cocosMcpServer } from "./cocos";

const server = new Server({ name: "cocos-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // 去插件里面查询能力
  const tools = cocosMcpServer.getListTools();
  return { tools: tools };
});

const ForecastArgumentsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const plugin = cocosMcpServer.findPlugin(name);
    if (plugin) {
      const params = ForecastArgumentsSchema.parse(args);
      // 执行能力
      const ret = await plugin.runCmd(name, params);
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cocos MCP Server running on stdio");
}
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
