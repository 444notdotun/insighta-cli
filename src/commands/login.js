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

const successPage = `
<html>
<head>
<meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: sans-serif;
      background: #050810;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      text-align: center;
      padding: 48px;
      border: 1px solid #1e293b;
      border-radius: 16px;
      background: #0f172a;
    }
    h1 { color: #00e5ff; font-size: 2rem; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 1rem; }
    .check { font-size: 3rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">✅</div>
    <h1>⚡ Authenticated!</h1>
    <p>You can close this tab and return to your terminal.</p>
  </div>
</body>
</html>`;

const errorPage = (message) => `
<html>
<head>
<meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: sans-serif;
      background: #050810;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      text-align: center;
      padding: 48px;
      border: 1px solid #1e293b;
      border-radius: 16px;
      background: #0f172a;
    }
    h1 { color: #ff4444; font-size: 2rem; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 1rem; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Authentication Failed</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;

const loadingPage = `
<html>
<head>
<meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: sans-serif;
      background: #050810;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card { text-align: center; }
    p { color: #94a3b8; font-size: 1rem; margin-top: 16px; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #1e293b;
      border-top: 3px solid #00e5ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>Completing authentication...</p>
  </div>
</body>
</html>`;

export async function loginCommand() {
  console.log(chalk.cyan("\n⚡ Insighta Labs+ Login\n"));

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const spinner = ora("Opening GitHub authorization...").start();

  const credentials = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (req.url === "/favicon.ico") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url, "http://localhost:8080");
      const exchangeToken = url.searchParams.get("exchangeToken");
      const accessToken = url.searchParams.get("accessToken");

      if (accessToken) {
        const refreshToken = url.searchParams.get("refreshToken");
        const username = url.searchParams.get("username");
        const userId = url.searchParams.get("userId");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(successPage);
        server.close();
        resolve({ accessToken, refreshToken, username, userId });
        return;
      }

      if (exchangeToken) {
        try {
          spinner.text = "Exchanging authorization code...";
          const exchangeRes = await axios.post(
              `${BASE_URL}/auth/github/exchange`,
              { exchangeToken, codeVerifier }
          );
          const { accessToken, refreshToken, username, userId } = exchangeRes.data.data;
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(successPage);
          server.close();
          resolve({ accessToken, refreshToken, username, userId });
        } catch (err) {
          const message = err.response?.data?.message || err.message;
          const isExpired = message.toLowerCase().includes("expired");
          const userMessage = isExpired
              ? "Session expired — please run insighta login again"
              : message;
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(errorPage(userMessage));
          server.close();
          reject(new Error(userMessage));
        }
        return;
      }

      res.writeHead(400);
      res.end("Unexpected request");
      server.close();
      reject(new Error("Unexpected request"));
    });

    server.listen(8080, async () => {
      try {
        const res = await axios.get(
            `${BASE_URL}/auth/github?codeChallenge=${codeChallenge}&redirectUrl=http://localhost:8080&isWeb=false`,
            {
              maxRedirects: 0,
              validateStatus: s => s === 302
            }
        );
        const githubUrl = res.headers["location"];
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