import fs from "fs";
import path from "path";
import os from "os";

const CREDENTIALS_DIR = path.join(os.homedir(), ".insighta");
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, "credentials.json");

export function saveCredentials(data) {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2));
}

export function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function clearCredentials() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

export function isLoggedIn() {
  const creds = loadCredentials();
  return creds && creds.accessToken;
}
