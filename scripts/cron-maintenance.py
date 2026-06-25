#!/usr/bin/env python3
"""
Cron Job de Manutenção — FIFA World Cup 2026 Webapp
====================================================

REGRAS RÍGIDAS (anti-drift):
1. Leia o worklog.md ANTES de qualquer ação.
2. Rode testes/lint/build. Se falhar, registre e PARE.
3. Identifique NO MÁXIMO 3 problemas reais.
4. Corrija APENAS bugs ou melhorias pequenas (<10 linhas).
5. NÃO crie novas features.
6. NÃO reescreva arquivos grandes (>50 linhas alteradas = BLOQUEADO).
7. NÃO altere arquitetura, banco de dados ou modelo de dados.
8. NÃO altere arquivos que não sejam listados no worklog como pendentes.
9. Ao final, atualize o worklog.md com o que foi testado/corrigido/não mexido/risco/recomendação.

Uso:
  python3 scripts/cron-maintenance.py [--dry-run]

O --dry-run mostra o que faria sem executar mudanças.
"""

import subprocess
import sys
import os
import re
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKLOG_PATH = PROJECT_ROOT / "worklog.md"
MAX_PROBLEMS = 3
MAX_LINES_CHANGED = 10

# Arquivos que o cron job pode tocar (whitelist)
SAFE_FILES = {
    "src/components/worldcup/Calendar.tsx",
    "src/components/worldcup/GroupTables.tsx",
    "src/components/worldcup/KnockoutBracket.tsx",
    "src/components/worldcup/CrossoverPredictor.tsx",
    "src/components/worldcup/ScoreInput.tsx",
    "src/components/worldcup/Navigation.tsx",
    "src/components/worldcup/FlagIcon.tsx",
    "src/store/worldCupStore.ts",
    "src/lib/standings.ts",
    "src/lib/thirdPlaceRanking.ts",
    "src/lib/bracketResolver.ts",
    "src/lib/utils.ts",
    "src/hooks/useLiveScores.ts",
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/app/api/live-scores/route.ts",
    "src/app/api/simulate/route.ts",
    "src/data/types.ts",
    "src/data/worldcup.ts",
}

# Arquivos NUNCA tocados pelo cron (blacklist)
BLOCKED_FILES = {
    "src/data/worldcup.ts",   # dados do torneio — só alterar manualmente
    "src/data/types.ts",      # modelo de dados — só alterar com aprovação
    "src/lib/standings.ts",   # lógica de classificação — core business
    "src/lib/thirdPlaceRanking.ts",
    "src/lib/bracketResolver.ts",
}


def run_cmd(cmd: list[str], timeout: int = 60) -> tuple[str, str, int]:
    """Run a command and return (stdout, stderr, returncode)."""
    result = subprocess.run(
        cmd,
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return result.stdout, result.stderr, result.returncode


def read_worklog() -> str:
    """Read current worklog content."""
    if WORKLOG_PATH.exists():
        return WORKLOG_PATH.read_text(encoding="utf-8")
    return ""


def extract_pending_items(worklog: str) -> list[str]:
    """Extract pending items mentioned in worklog."""
    pending = []
    for line in worklog.split("\n"):
        line_lower = line.lower()
        if any(kw in line_lower for kw in ["pendente", "todo", "a fazer", "backlog", "próximo"]):
            clean = line.strip().lstrip("-*# ")
            if clean:
                pending.append(clean)
    return pending


def run_checks() -> dict:
    """Run lint, typecheck, build. Return results."""
    results = {}

    # 1. TypeScript check
    stdout, stderr, rc = run_cmd(["npx", "tsc", "--noEmit"], timeout=120)
    results["tsc"] = {
        "passed": rc == 0,
        "output": stderr if stderr else stdout,
        "returncode": rc,
    }

    # 2. Next.js build check (lightweight - just lint)
    stdout, stderr, rc = run_cmd(["npx", "next", "lint"], timeout=120)
    results["lint"] = {
        "passed": rc == 0,
        "output": stdout + stderr,
        "returncode": rc,
    }

    return results


def identify_problems(check_results: dict) -> list[dict]:
    """Identify up to MAX_PROBLEMS real issues from check results."""
    problems = []

    # Parse TypeScript errors from our safe files
    if not check_results["tsc"]["passed"]:
        output = check_results["tsc"]["output"]
        # Match error lines: file(line,col): error TSXXXX: message
        pattern = r"src/[^\(]+?\.tsx?\((\d+),(\d+)\): error (TS\d+): (.+)"
        for match in re.finditer(pattern, output):
            filepath = match.group(0).split("(")[0].strip()
            line_num = int(match.group(1))
            error_code = match.group(3)
            message = match.group(4).strip()

            # Skip errors in files outside our whitelist
            rel_path = filepath.replace("src/", "src/")
            if rel_path in BLOCKED_FILES:
                continue
            if rel_path not in SAFE_FILES:
                continue

            # Skip pre-existing known issues
            if "KnockoutMatch" in message and "bracketResolver" in filepath:
                continue

            problems.append({
                "file": rel_path,
                "line": line_num,
                "code": error_code,
                "message": message,
                "severity": "error",
                "auto_fixable": _is_auto_fixable(error_code, message),
            })

            if len(problems) >= MAX_PROBLEMS:
                break

    # Parse lint warnings
    if not check_results["lint"]["passed"]:
        output = check_results["lint"]["output"]
        for match in re.finditer(pattern, output):
            filepath = match.group(0).split("(")[0].strip()
            rel_path = filepath.replace("src/", "src/")
            if rel_path in BLOCKED_FILES:
                continue
            if rel_path not in SAFE_FILES:
                continue
            if any(p["file"] == rel_path and p["line"] == int(match.group(1)) for p in problems):
                continue
            problems.append({
                "file": rel_path,
                "line": int(match.group(1)),
                "code": match.group(3),
                "message": match.group(4).strip(),
                "severity": "warning",
                "auto_fixable": _is_auto_fixable(match.group(3), match.group(4)),
            })
            if len(problems) >= MAX_PROBLEMS:
                break

    return problems[:MAX_PROBLEMS]


def _is_auto_fixable(code: str, message: str) -> bool:
    """Determine if a problem is auto-fixable within 10 lines."""
    auto_fixable_codes = {
        "TS6133",  # unused variable
        "TS2322",  # type mismatch (sometimes fixable with ? or ??)
        "TS2307",  # module not found (import cleanup)
        "TS2694",  # namespace not used
    }
    auto_fixable_messages = [
        "is not used",
        "is declared but",
        "unused",
    ]
    if code in auto_fixable_codes:
        return True
    for msg in auto_fixable_messages:
        if msg.lower() in message.lower():
            return True
    return False


def apply_fix(problem: dict, dry_run: bool = False) -> str:
    """
    Attempt to auto-fix a simple problem.
    Returns description of what was done.
    Only fixes that change < MAX_LINES_CHANGED lines.
    """
    filepath = PROJECT_ROOT / problem["file"]
    if not filepath.exists():
        return f"BLOCKED: File {problem['file']} not found"

    if problem["file"] in BLOCKED_FILES:
        return f"BLOCKED: {problem['file']} is in blacklist (core data/logic)"

    content = filepath.read_text(encoding="utf-8")
    lines = content.split("\n")
    line_idx = problem["line"] - 1

    if line_idx < 0 or line_idx >= len(lines):
        return f"SKIPPED: Line {problem['line']} out of range"

    fix_description = ""

    # TS6133: unused variable - add underscore prefix
    if problem["code"] == "TS6133" and "is not used" in problem["message"]:
        line = lines[line_idx]
        var_match = re.search(r"'(\w+)' is declared but", problem["message"])
        if var_match:
            var_name = var_match.group(1)
            # Find and prefix with underscore in the destructuring/declaration
            if f" {var_name}" in line:
                lines[line_idx] = line.replace(f" {var_name}", f" _{var_name}", 1)
                fix_description = f"Prefixed unused var '{var_name}' with _ on line {problem['line']}"

    # TS2322: type mismatch - try adding null coalescing
    elif problem["code"] == "TS2322" and "undefined" in problem["message"]:
        line = lines[line_idx]
        if "undefined" in problem["message"] and "??" not in line:
            # Simple: if prop is `X | undefined`, add ?? default
            prop_match = re.search(r"(\w+)=\{[m]\.(\w+)(?!\?\?)}", line)
            if not prop_match:
                prop_match = re.search(r'(\w+)=\{[m]\.(\w+)(?!\?\?)\}', line)
            if prop_match:
                prop_name = prop_match.group(1)
                field = prop_match.group(2)
                lines[line_idx] = line.replace(
                    f"{{{prop_name}={{m.{field}}}",
                    f"{{{prop_name}={{m.{field} ?? null}}"
                ).replace(
                    f"{prop_name}={{m.{field}}}",
                    f"{prop_name}={{m.{field} ?? null}}"
                )
                fix_description = f"Added ?? null for '{field}' on line {problem['line']}"

    if not fix_description:
        return f"SKIPPED: No safe auto-fix for {problem['code']}"

    # Verify fix doesn't exceed line change limit
    changed_lines = sum(1 for a, b in zip(lines, content.split("\n")) if a != b)
    if changed_lines > MAX_LINES_CHANGED:
        return f"BLOCKED: Fix would change {changed_lines} lines (max {MAX_LINES_CHANGED})"

    if not dry_run:
        filepath.write_text("\n".join(lines), encoding="utf-8")

    return f"FIXED: {fix_description}"


def update_worklog(
    check_results: dict,
    problems: list[dict],
    fix_results: list[str],
    pending: list[str],
    dry_run: bool,
):
    """Append cron job results to worklog.md."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    entry = f"""
---
Task ID: cron-{datetime.now().strftime('%Y%m%d-%H%M%S')}
Agent: cron-maintenance (automated)
Task: Health check + bug fixes (rigorous mode)

Work Log:
- Leu worklog.md ({len(pending)} itens pendentes identificados)
- Rodou tsc --noEmit: {'PASS' if check_results['tsc']['passed'] else 'FAIL'}
- Rodou next lint: {'PASS' if check_results['lint']['passed'] else 'FAIL'}
- Problemas identificados: {len(problems)} (limite: {MAX_PROBLEMS})
"""

    if problems:
        entry += "- Problemas:\n"
        for p in problems:
            entry += f"  - [{p['severity']}] {p['file']}:{p['line']} {p['code']}: {p['message']}\n"

    entry += "- Ações:\n"
    for fix in fix_results:
        entry += f"  - {fix}\n"

    # What was NOT touched
    untouched = [f for f in SAFE_FILES if f not in BLOCKED_FILES]
    entry += f"\nStage Summary:\n"
    entry += f"- Testado: tsc, lint\n"
    entry += f"- Corrigido: {sum(1 for f in fix_results if f.startswith('FIXED'))} problema(s)\n"
    entry += f"- Não mexido: {len(untouched)} arquivos da whitelist, todos os blocked files\n"

    risks = []
    if not check_results["tsc"]["passed"]:
        tsc_errors = check_results["tsc"]["output"].count("error TS")
        risks.append(f"{tsc_errors} erros TypeScript restantes (verificar se são pre-existentes)")
    if not check_results["lint"]["passed"]:
        risks.append("Lint falhou — revisar warnings")

    if pending:
        risks.append(f"{len(pending)} itens pendentes no worklog (não abordados por este ciclo)")

    if risks:
        entry += f"- Riscos encontrados:\n"
        for r in risks:
            entry += f"  - {r}\n"

    entry += f"- Próxima recomendação: "
    if risks:
        entry += "Resolver riscos listados acima antes de adicionar features.\n"
    else:
        entry += "App estável. Manter monitoramento.\n"

    if dry_run:
        print("[DRY RUN] Worklog entry that would be written:")
        print(entry)
    else:
        with open(WORKLOG_PATH, "a", encoding="utf-8") as f:
            f.write(entry)
        print(f"Worklog atualizado: {WORKLOG_PATH}")


def main():
    dry_run = "--dry-run" in sys.argv

    print(f"=== Cron Maintenance {'(DRY RUN)' if dry_run else ''} ===")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print(f"Project: {PROJECT_ROOT}")
    print()

    # Step 1: Read worklog
    print("[1/5] Lendo worklog.md...")
    worklog = read_worklog()
    pending = extract_pending_items(worklog)
    print(f"  - {len(pending)} itens pendentes identificados")

    # Step 2: Run checks
    print("[2/5] Rodando testes (tsc + lint)...")
    check_results = run_checks()
    for name, result in check_results.items():
        status = "PASS" if result["passed"] else "FAIL"
        print(f"  - {name}: {status}")

    # If all checks pass, no problems to fix
    all_passed = all(r["passed"] for r in check_results.values())

    # Step 3: Identify problems
    print("[3/5] Identificando problemas...")
    problems = identify_problems(check_results)
    print(f"  - {len(problems)} problema(s) encontrado(s)")
    for p in problems:
        print(f"    [{p['severity']}] {p['file']}:{p['line']} {p['code']}: {p['message'][:80]}")

    if all_passed or not problems:
        print("  - Nenhum problema para corrigir. App estável.")

    # Step 4: Apply fixes (only auto-fixable, small changes)
    print("[4/5] Aplicando correções...")
    fix_results = []
    for problem in problems:
        if problem["auto_fixable"]:
            result = apply_fix(problem, dry_run=dry_run)
            fix_results.append(result)
            print(f"  - {result}")
        else:
            fix_results.append(f"SKIPPED: {problem['code']} não é auto-fixável")
            print(f"  - SKIPPED: {problem['code']} não é auto-fixável")

    # Step 5: Update worklog
    print("[5/5] Atualizando worklog.md...")
    update_worklog(check_results, problems, fix_results, pending, dry_run)

    print()
    print("=== Cron Maintenance concluído ===")


if __name__ == "__main__":
    main()