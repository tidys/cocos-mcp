import { mcp } from "./mcp";
async function main() {
  await mcp.run();
}
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
