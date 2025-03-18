import * as WS from "ws";
enum CMD {
  Test = "test",
  ListTools = "list-tools",
  RunCmd = "run-cmd",
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
    socket.on("open", () => {
      console.log("socket open");
      this.send(CMD.Test, "open");
    });
    socket.on("message", (message: string) => {
      console.log(`received: ${message}`);
      const ret = JSON.parse(message);
      const { cmd, data } = ret;
      const cb = cmdCallback[cmd];
      if (cb) {
        cb(data);
      }
    });
    this.send(CMD.Test, "hello");
  }
  public async runCmd(tool: string, args: any) {
    this.send(CMD.RunCmd, JSON.stringify({ tool, args }));
    return 1;
  }
  private send(cmd: CMD, data: string) {
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
        console.log(`plugin length: ${this.pluins.length}`);
      });
      this.pluins.push(plugin);
    });
    this.server.on("close", () => {
      this.pluins = [];
    });
    this.server.on("listening", () => {
      console.log("running");
    });
  }
  getListTools(): any[] {
    return [];
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
