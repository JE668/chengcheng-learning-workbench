import fs from 'fs';
import path from 'path';

const targets = ['src/app/(child)', 'src/components'];

function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (/\.tsx$/.test(f.name)) yield p;
  }
}

const issues = [];

for (const root of targets) {
  const fullRoot = path.join('/Users/je/chengcheng-learning-workbench', root);
  for (const file of walk(fullRoot)) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes("'use client'") && !src.includes('"use client"')) continue;

    const lines = src.split('\n');

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const m = line.match(/^(?:export\s+)?function\s+([A-Z]\w*)/);
      if (!m) { i++; continue; }

      const fnName = m[1];
      let depth = 0;
      let started = false;
      let j = i;
      for (; j < lines.length; j++) {
        for (const c of lines[j]) {
          if (c === '{') { depth++; started = true; }
          else if (c === '}') {
            depth--;
            if (started && depth === 0) break;
          }
        }
        if (started && depth === 0) break;
      }

      let firstJsxReturn = null;
      const hooks = [];

      for (let k = i; k <= j; k++) {
        const t = lines[k];
        if (!firstJsxReturn) {
          const r = t.match(/^\s*return\s+[<(]/);
          if (r) firstJsxReturn = k + 1;
        }

        const h = t.match(/\b(useState|useEffect|useCallback|useMemo|useRef|useReducer|useContext)\s*\(/);
        if (h && !t.includes('import') && firstJsxReturn && k + 1 > firstJsxReturn) {
          hooks.push({ line: k + 1, type: h[1] });
        }
      }

      if (hooks.length > 0 && firstJsxReturn) {
        issues.push({
          file: file.replace('/Users/je/chengcheng-learning-workbench/', ''),
          fnName,
          jsxReturnLine: firstJsxReturn,
          hooks,
        });
      }

      i = j + 1;
    }
  }
}

fs.writeFileSync('/Users/je/chengcheng-learning-workbench/scan-hooks-v2.json', JSON.stringify(issues, null, 2));
console.log('Real hooks-after-JSX-return:', issues.length);
for (const i of issues) console.log(i.file, ':', i.fnName, 'return@' + i.jsxReturnLine, '->', i.hooks.map(h => h.line + ':' + h.type).join(', '));
