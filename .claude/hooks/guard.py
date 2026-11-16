#!/usr/bin/env python3
"""PreToolUse guard for EDUVERSE_3D.

- Edit/Write on .env            -> deny
- Edit/Write on lighthouse files -> ask (the teacher owns them; approve only when they asked)
- git add -A / --all / .         -> deny (stage files by name)
- git add of a file > 100 MB     -> deny (GitHub rejects it)
"""
import fnmatch
import json
import os
import shlex
import sys

LIMIT = 100 * 1024 * 1024
PROJECT = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

LIGHTHOUSE = [
    "client/src/world/lighthouse/*",
    "client/src/world/LighthouseModel.jsx",
    "client/scripts/lighthouse.test.mjs",
    "client/scripts/integrate-lighthouse.cjs",
    "client/src/assets/models/lighthouse_landscape.glb",
    "assets/landmarks/*lighthouse*",
]


def decide(decision, reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason,
    }}, ensure_ascii=False))
    sys.exit(0)


def rel(path):
    path = os.path.abspath(os.path.join(PROJECT, path))
    root = os.path.abspath(PROJECT)
    return os.path.relpath(path, root) if path.startswith(root + os.sep) else None


def check_file(path):
    name = os.path.basename(path)
    if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
        decide("deny", f"{name} chứa khóa bí mật; Claude không được sửa file này.")
    r = rel(path)
    if r and any(fnmatch.fnmatch(r, p) for p in LIGHTHOUSE):
        decide("ask", f"{r} thuộc cảnh hải đăng do thầy làm trong Codex. Chỉ đồng ý nếu thầy đã yêu cầu sửa file này.")


def big_files(target, cwd):
    full = os.path.join(cwd, target)
    if os.path.isfile(full):
        if os.path.getsize(full) > LIMIT:
            yield target
    elif os.path.isdir(full):
        for d, dirs, files in os.walk(full):
            dirs[:] = [x for x in dirs if x not in (".git", "node_modules")]
            for f in files:
                p = os.path.join(d, f)
                try:
                    if os.path.getsize(p) > LIMIT:
                        yield os.path.relpath(p, cwd)
                except OSError:
                    pass


def check_bash(command, cwd):
    try:
        tokens = shlex.split(command, posix=True)
    except ValueError:
        return
    # split on shell separators so each `git add` is checked on its own
    parts, cur = [], []
    for t in tokens:
        if t in ("&&", "||", ";", "|"):
            parts.append(cur); cur = []
        else:
            cur.append(t)
    parts.append(cur)
    for p in parts:
        if len(p) < 2 or p[0] != "git":
            continue
        i = 1
        while i < len(p) and p[i].startswith("-"):  # git -C dir add ...
            if p[i] == "-C" and i + 1 < len(p):
                cwd = os.path.join(cwd, p[i + 1]); i += 2
            else:
                i += 1
        if i >= len(p) or p[i] != "add":
            continue
        args = p[i + 1:]
        if any(a in ("-A", "--all", ".", "./", ":/", "*") or (a.startswith("-") and not a.startswith("--") and "A" in a) for a in args):
            decide("deny", "Không dùng git add -A / git add . trong dự án này: cây làm việc có thay đổi của thầy (Codex). Hãy stage từng file theo tên.")
        for a in args:
            if a.startswith("-"):
                continue
            big = list(big_files(a, cwd))
            if big:
                decide("deny", "File lớn hơn 100 MB, GitHub sẽ từ chối: " + ", ".join(big[:5]))


def main():
    data = json.load(sys.stdin)
    tool = data.get("tool_name", "")
    inp = data.get("tool_input", {}) or {}
    if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        path = inp.get("file_path") or inp.get("notebook_path")
        if path:
            check_file(path)
    elif tool == "Bash":
        check_bash(inp.get("command", ""), data.get("cwd") or PROJECT)


if __name__ == "__main__":
    main()
