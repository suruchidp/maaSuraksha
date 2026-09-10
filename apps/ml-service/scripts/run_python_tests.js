/* Helper so `npm test` in the ml-service workspace runs pytest.

   Resolution order:
     1. $ML_VENV_PYTHON  (absolute path to a python interpreter, e.g. a venv
                         created OUTSIDE the repo when Windows App Control
                         blocks unsigned native wheels inside the repo tree)
     2. ./.venv/<bin>/python(.exe)  (repo-local venv, the default setup)
     3. `python` on PATH
*/
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const candidates = [];
if (process.env.ML_VENV_PYTHON) {
  candidates.push(process.env.ML_VENV_PYTHON);
}
candidates.push(
  path.join(__dirname, "..", ".venv", process.platform === "win32" ? "Scripts" : "bin", "python.exe"),
  path.join(__dirname, "..", ".venv", process.platform === "win32" ? "Scripts" : "bin", "python"),
  path.join(__dirname, "..", ".venv", "bin", "python")
);

const python = candidates.find((p) => fs.existsSync(p)) || "python";

const check = spawnSync(python, ["-c", "import pytest, fastapi"], { encoding: "utf8" });
if (check.status !== 0) {
  console.error(
    "ML service tests could not start: python interpreter lacks the pure-python test deps (pytest, fastapi)."
  );
  console.error(
    "Create a virtualenv and install requirements.txt, e.g.:\n" +
    "  cd apps/ml-service\n" +
    "  python -m venv .venv\n" +
    "  .venv\\Scripts\\python -m pip install -r requirements.txt\n" +
    "Then run `npm test` again (or set ML_VENV_PYTHON=/path/to/venv/bin/python)."
  );
  process.exit(1);
}

const result = spawnSync(python, ["-m", "pytest", "tests", "-q"], { stdio: "inherit" });
process.exit(result.status ?? 1);