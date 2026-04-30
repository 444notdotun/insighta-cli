import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import api from "../api.js";
import { clearCredentials, loadCredentials } from "../credentials.js";

export async function exportCommand(options) {
  const spinner = ora("Exporting profiles to CSV...").start();

  try {
    const params = {};
    if (options.gender) params.gender = options.gender;
    if (options.ageGroup) params.age_group = options.ageGroup;
    if (options.country) params.country_id = options.country;
    if (options.minAge) params.min_age = options.minAge;
    if (options.maxAge) params.max_age = options.maxAge;

    const res = await api.get("/api/profiles/export", {
      params,
      responseType: "arraybuffer",
    });

    const filename = options.output || `profiles-${Date.now()}.csv`;
    const filepath = path.resolve(filename);
    fs.writeFileSync(filepath, res.data);

    spinner.succeed(chalk.green(`Exported successfully!`));
    console.log(chalk.dim(`\n  Saved to: ${chalk.white(filepath)}\n`));
  } catch (err) {
    spinner.fail(chalk.red("Export failed"));
    console.error(chalk.red(err.response?.data?.message || err.message));
  }
}

export function logoutCommand() {
  const creds = loadCredentials();
  if (!creds) {
    console.log(chalk.yellow("\n  You are not logged in.\n"));
    return;
  }
  clearCredentials();
  console.log(chalk.green("\n  ✓ Logged out successfully.\n"));
  console.log(chalk.dim("  Credentials removed from ~/.insighta/credentials.json\n"));
}

export function whoamiCommand() {
  const creds = loadCredentials();
  if (!creds) {
    console.log(chalk.yellow("\n  Not logged in. Run: insighta login\n"));
    return;
  }
  console.log(chalk.cyan("\n⚡ Insighta Labs+\n"));
  console.log(chalk.dim(`  Username : `) + chalk.white(creds.username));
  console.log(chalk.dim(`  User ID  : `) + chalk.white(creds.userId));
  console.log(chalk.dim(`  Status   : `) + chalk.green("Authenticated"));
  console.log();
}
