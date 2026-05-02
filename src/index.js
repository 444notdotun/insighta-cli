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
    .version("1.0.3");

program
    .command("login")
    .description("Authenticate with GitHub OAuth")
    .action(loginCommand);

program
    .command("logout")
    .description("Clear stored credentials")
    .action(logoutCommand);

program
    .command("whoami")
    .description("Show current logged in user")
    .action(whoamiCommand);

const profiles = program.command("profiles").description("Manage intelligence profiles");

profiles
    .command("list")
    .description("List intelligence profiles")
    .option("-g, --gender <gender>", "Filter by gender (male/female)")
    .option("-a, --age-group <group>", "Filter by age group (child/teenager/adult/senior)")
    .option("-c, --country <code>", "Filter by 2-letter country code")
    .option("--min-age <age>", "Minimum age")
    .option("--max-age <age>", "Maximum age")
    .option("--sort-by <field>", "Sort by (age/created_at/gender_probability)")
    .option("--order <order>", "Sort order (asc/desc)", "asc")
    .option("-p, --page <page>", "Page number", "1")
    .option("-l, --limit <limit>", "Results per page", "10")
    .action((options) => {
        if (!isLoggedIn()) {
            console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
            process.exit(1);
        }
        queryCommand(options);
    });

profiles
    .command("get <id>")
    .description("Get profile by ID")
    .action((id) => {
        if (!isLoggedIn()) {
            console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
            process.exit(1);
        }
        queryCommand({ id });
    });

profiles
    .command("search <query>")
    .description("Search profiles with natural language")
    .action((query) => {
        if (!isLoggedIn()) {
            console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
            process.exit(1);
        }
        queryCommand({ search: query });
    });

profiles
    .command("create")
    .description("Create a new profile (Admin only)")
    .requiredOption("--name <name>", "Profile name")
    .action((options) => {
        if (!isLoggedIn()) {
            console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
            process.exit(1);
        }
        queryCommand({ create: options.name });
    });

profiles
    .command("export")
    .description("Export profiles to CSV")
    .option("-g, --gender <gender>", "Filter by gender")
    .option("-a, --age-group <group>", "Filter by age group")
    .option("-c, --country <code>", "Filter by country code")
    .option("--min-age <age>", "Minimum age")
    .option("--max-age <age>", "Maximum age")
    .option("--format <format>", "Export format", "csv")
    .option("-o, --output <filename>", "Output filename", "profiles.csv")
    .action((options) => {
        if (!isLoggedIn()) {
            console.log(chalk.red("\n  Not logged in. Run: insighta login\n"));
            process.exit(1);
        }
        exportCommand(options);
    });

program.parse(process.argv);