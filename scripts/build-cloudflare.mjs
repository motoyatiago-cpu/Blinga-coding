import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const vinextCli = fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url));
const result = spawnSync(process.execPath, [vinextCli, "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, BLINGA_CLOUDFLARE_DEPLOY: "1" },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
