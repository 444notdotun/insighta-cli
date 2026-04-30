#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { loginCommand } from "./commands/login.js";
import { queryCommand } from "./commands/query.js";
import { exportCommand, logoutCommand, whoamiCommand } from "./commands/misc.js";
import { isLoggedIn } from "./credentials.js";

const program = new Command();

console.log(chalk.cyan("⚡ Insighta Labs+") + chalk.dim(" CLI"));

program
  .name("insighta")
  .description("Intelligence Query Platform CLI")
  .version("1.0.0");

// LOGIN
program
  .command("login")
  .description("Authenticate with GitHub OAuth")
  .action(loginCommand);

// LOGOUT
program
  .command("logout")
  .description("Clear stored credentials")
  .action(logoutCommand);

// WHOAMI
program
  .command("whoami")
  .description("Show current logged in user")
  .action(whoamiCommand);

// QUERY
program
  .command("query")
  .description("Query intelligence profiles")
  .option("-g, --gender <gender>", "Filter by gender (male/female)")
  .option("-a, --age-group <group>", "Filter by age group (child/teenager/adult/senior)")
  .option("-c, --country <code>", "Filter by 2-letter country code")
  .option("--min-age <age>", "Minimum age")
  .option("--max-age <age>", "Maximum age")
  .option("-p, --page <page>", "Page number", "1")
  .option("-l, --limit <limit>", "Results per page", "10")
  .action((options) => {
    if (!isLoggedIn()) {
      console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
      process.exit(1);
    }
    queryCommand(options);
  });

// EXPORT
program
  .command("export")
  .description("Export profiles to CSV file")
  .option("-g, --gender <gender>", "Filter by gender")
  .option("-a, --age-group <group>", "Filter by age group")
  .option("-c, --country <code>", "Filter by country code")
  .option("--min-age <age>", "Minimum age")
  .option("--max-age <age>", "Maximum age")
  .option("-o, --output <filename>", "Output filename", "profiles.csv")
  .action((options) => {
    if (!isLoggedIn()) {
      console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
      process.exit(1);
    }
    exportCommand(options);
  });

program.parse(process.argv);
