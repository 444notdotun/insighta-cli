import http from "http";
import { createHash, randomBytes } from "crypto";
import open from "open";
import chalk from "chalk";
import ora from "ora";
import axios from "axios";
import { saveCredentials } from "../credentials.js";
import { BASE_URL } from "../api.js";

function generateCodeVerifier() {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCodeChallenge(verifier) {
  return createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function loginCommand() {
  console.log(chalk.cyan("\n⚡ Insighta Labs+ Login\n"));

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const spinner = ora("Opening GitHub authorization...").start();

  // Start local server to catch callback
  const authCode = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost:8080");
      const code = url.searchParams.get("code");

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html><body style="font-family:sans-serif;background:#050810;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <h1 style="color:#00e5ff">⚡ Authenticated!</h1>
              <p>You can close this tab and return to your terminal.</p>
            </div>
          </body></html>
        `);
        server.close();
        resolve(code);
      } else {
        res.writeHead(400);
        res.end("No code received");
        server.close();
        reject(new Error("No authorization code received"));
      }
    });

    server.listen(8080, async () => {
      try {
        // Get GitHub authorization URL from backend
        const res = await axios.get(
          `${BASE_URL}/auth/github?codeChallenge=${codeChallenge}`
        );
        const githubUrl =
          res.headers["location"] || res.request.responseURL;
        spinner.text = "Waiting for GitHub authorization...";
        await open(githubUrl);
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Login timed out"));
    }, 120000);
  });

  spinner.text = "Exchanging authorization code...";

  try {
    const res = await axios.get(
      `${BASE_URL}/auth/github/callback?code=${authCode}&codeVerifier=${codeVerifier}`
    );

    const { accessToken, refreshToken, username, userId } = res.data.data;

    saveCredentials({
      accessToken,
      refreshToken,
      username,
      userId,
    });

    spinner.succeed(chalk.green("Login successful!"));
    console.log(chalk.dim(`\n  Logged in as: ${chalk.white(username)}`));
    console.log(chalk.dim(`  Credentials saved to ~/.insighta/credentials.json\n`));
  } catch (err) {
    spinner.fail(chalk.red("Login failed"));
    console.error(chalk.red(err.response?.data?.message || err.message));
  }
}
