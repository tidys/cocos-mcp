#! /usr/bin/env node
import { program } from "commander";
import { mcp } from "./mcp";
program.version("1.0.0").allowUnknownOption(true);
program
  .command("test")
  .description("test command")
  .action(() => {
    console.log("test");
  });
program.action(async () => {
  mcp.run();
});
program.parse(process.argv);
