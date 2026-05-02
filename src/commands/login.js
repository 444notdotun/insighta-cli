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

  const credentials = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/favicon.ico") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url, "http://localhost:8080");
      const accessToken = url.searchParams.get("accessToken");
      const refreshToken = url.searchParams.get("refreshToken");
      const username = url.searchParams.get("username");
      const userId = url.searchParams.get("userId");

      if (!accessToken || !refreshToken) {
        res.writeHead(400);
        res.end("No tokens received");
        server.close();
        reject(new Error("No tokens received"));
        return;
      }

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
      resolve({ accessToken, refreshToken, username, userId });
    });

    server.listen(8080, async () => {
      try {
        const res = await axios.post(
            `${BASE_URL}/auth/github`,
            {
              codeChallenge,
              codeVerifier,
              redirectUrl: "http://localhost:8080",
              isWeb: false
            },
            {
              maxRedirects: 0,
              validateStatus: s => s >= 200 && s < 400
            }
        );

        const githubUrl = res.data.data.githubUrl;

        if (!githubUrl) {
          server.close();
          reject(new Error("No GitHub URL returned from backend"));
          return;
        }

        spinner.text = "Waiting for GitHub authorization...";
        await open(githubUrl);
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Login timed out"));
    }, 120000);
  });

  saveCredentials(credentials);
  spinner.succeed(chalk.green("Login successful!"));
  console.log(chalk.dim(`\n  Logged in as: ${chalk.white(credentials.username)}`));
  console.log(chalk.dim(`  Credentials saved to ~/.insighta/credentials.json\n`));
}