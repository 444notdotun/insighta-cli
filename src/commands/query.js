import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import api from "../api.js";

export async function queryCommand(options) {
  const spinner = ora("Fetching profiles...").start();

  try {
    const params = {};
    if (options.gender) params.gender = options.gender;
    if (options.ageGroup) params.age_group = options.ageGroup;
    if (options.country) params.country_id = options.country;
    if (options.minAge) params.min_age = options.minAge;
    if (options.maxAge) params.max_age = options.maxAge;
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    const res = await api.get("/api/profiles", { params });
    const { data, total_pages, total_elements } = res.data;

    spinner.succeed(
      chalk.green(`Found ${total_elements || data?.length || 0} profiles`)
    );

    if (!data || data.length === 0) {
      console.log(chalk.yellow("\n  No profiles found for the given filters.\n"));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan("Name"),
        chalk.cyan("Gender"),
        chalk.cyan("Age"),
        chalk.cyan("Age Group"),
        chalk.cyan("Country"),
      ],
      style: { head: [], border: ["dim"] },
      colWidths: [25, 10, 8, 14, 10],
    });

    data.forEach((p) => {
      table.push([
        p.name || "-",
        p.gender || "-",
        p.age || "-",
        p.ageGroup || "-",
        p.countryId || "-",
      ]);
    });

    console.log("\n" + table.toString());
    console.log(
      chalk.dim(`\n  Page ${params.page || 1} of ${total_pages || 1}\n`)
    );
  } catch (err) {
    spinner.fail(chalk.red("Query failed"));
    console.error(
      chalk.red(err.response?.data?.message || err.message)
    );
  }
}
