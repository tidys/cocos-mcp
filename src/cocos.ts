import * as WS from "ws";
enum CMD {
  Test = "test",
  ListTools = "list-tools",
  CmdRun = "cmd-run",
}
class PluginClient {
  private socket: WS.WebSocket;
  public tools: any[] = [];
  public hasTool(tool: string) {
    return !!this.tools.find((el) => el.name === tool);
  }
  constructor(socket: WS.WebSocket) {
    this.socket = socket;

    const cmdCallback: Record<string, Function> = {};
    cmdCallback[CMD.ListTools] = (data: any) => {
      this.tools = data;
    };
    cmdCallback[CMD.CmdRun] = (data: any) => {
      if (this.resolve) {
        this.resolve(data);
        this.resolve = null;
      }
    };
    socket.on("open", () => {
      this.send(CMD.Test, "open");
    });
    socket.on("message", (message: string) => {
      const ret = JSON.parse(message);
      const { cmd, data } = ret;
      const cb = cmdCallback[cmd];
      if (cb) {
        cb(data);
      }
    });
    this.send(CMD.Test, "hello");
  }
  private resolve: any;
  public async runCmd(tool: string, args: any) {
    this.send(CMD.CmdRun, { tool, args });
    // 等cmd执行完毕后回来
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
    });
  }
  private send(cmd: CMD, data: any) {
    if (this.socket.readyState === WS.OPEN) {
      this.socket.send(JSON.stringify({ cmd, data }));
    }
  }
  addCloseListener(listener: () => void) {
    this.socket.on("close", listener);
  }
}
class CocosMcpServer {
  server: WS.Server;
  /**
   * 连接的端口号
   */
  port: number = 5395;
  /**
   * 所有连接的插件客户端
   */
  pluins: PluginClient[] = [];
  constructor() {
    this.server = new WS.Server({ port: this.port });
    this.server.on("connection", (socket) => {
      const plugin = new PluginClient(socket);
      plugin.addCloseListener(() => {
        this.pluins = this.pluins.filter((item) => item !== plugin);
      });
      this.pluins.push(plugin);
    });
    this.server.on("close", () => {
      this.pluins = [];
    });
    this.server.on("listening", () => {});
  }
  getListTools(): any[] {
    const tools: any[] = [];
    this.pluins.forEach((el) => {
      el.tools.forEach((tool) => {
        tools.push(tool);
      });
    });
    return tools;
  }
  findPlugin(tool: string): null | PluginClient {
    const plugin = this.pluins.find((el) => el.hasTool(tool));
    if (plugin) {
      return plugin;
    }
    return null;
  }
}
export const cocosMcpServer = new CocosMcpServer();
