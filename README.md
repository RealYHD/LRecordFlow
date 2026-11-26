# LRecordFlow

A directory based approach to relational record keeping with a directory store per record where files in the directory are considered tied to the record. Supports multiple users interacting with one repository at a time. An Electron application with Svelte and TypeScript.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Per-Record Scripts

LRecordFlow can run an adaptable script per record, using the record's columns as input parameters and writing the script's output back as record columns.

### Script Storage

Scripts live in `.lrf/scripts/<name>.py` inside the repository directory and are version-controlled with the repo. Each script is a Python program that:

1. Accepts parameters as command line flags (e.g. `--sample=record1`)
2. Writes its output as a JSON dictionary to a cache path (or prints it to stdout)

### Script Registry

The repository configuration (`.lrf.config.json`) holds a `scripts` registry:

```json
{
  "defined": [...],
  "scripts": [
    {
      "name": "My Pipeline",
      "path": "my_pipeline.py",
      "parameters": [
        { "key": "--sample", "value": "{identifier}" }
      ],
      "outputColumns": ["coverage", "n_contigs"]
    }
  ],
  "connection": { "host": "...", "port": 22, "username": "...", "privateKeyPath": "...", "password": undefined }
}
```

- `path` — the script file relative to `.lrf/scripts/`
- `parameters` — input mapping, where `{column}` is substituted with the record's column value
- `outputColumns` — the columns this script claims it will fill
- `connection` — the SSH connection used to execute the script

### Output Columns

Script outputs are written to record columns namespaced by the script filename:

```
my_pipeline.py:coverage = 35
my_pipeline.py:n_contigs = 12
```

This namespaces outputs so multiple scripts on the same record never collide.

### Running Scripts

In the record table, columns claimed by a script render with a **Run** button when the value is empty. Clicking it:

1. Substitutes the record's column values into the script parameters
2. Executes the script remotely via SSH (`nohup python3 <script> --param=value &`)
3. Captures the job PID and persists the run state in `.lrf.script-state.json`

### Persistent Job Tracking

The run state survives application restarts:

- `.lrf.script-state.json` — the record's script run state (`pending`, `running`, `completed`, `failed`) with the job PID
- On startup (and every 30s while open), the app reconciles in-flight jobs: it checks if the backgrounded process is still running and fetches the cached JSON output once the job finishes, writing it to the record's columns

A script that fails to start is marked `failed` with a captured error message.
