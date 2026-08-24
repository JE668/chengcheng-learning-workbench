
import fs from 'fs';
import path from 'path';

const targets = [
  'src/app/(child)',
  'src/components',
];

function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (/.tsx$/.test(f.name)) yield p;
  }
}

const issues = [];

for (const root of targets) {
  const fullRoot = path.join('/Users/je/chengcheng-learning-workbench', root);
  for (const file of walk(fullRoot)) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes("'use client'") && !src.includes('"use client"')) continue;
    
    // Find component functions: function XYZ(...) { ... }
    // Simple parser: split by lines, find hooks and early returns
    const lines = src.split('\n');
    const hooks = [];  // {line, type, depth}
    const returns = []; // {line, depth}
    
    let depth = 0;
    let inString = false, stringCh = '';
    let inFunc = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track braces (rough)
      for (const c of line) {
        if (inString) {
          if (c === stringCh) inString = false;
          continue;
        }
        if (c === "'" || c === '"' || c === '`') {
          inString = true; stringCh = c;
          continue;
        }
        if (c === '{') depth++;
        if (c === '}') depth--;
      }
      
      // Match hook call
      const hookMatch = line.match(/\b(useState|useEffect|useCallback|useMemo|useRef|useReducer|useContext)\s*\(/);
      if (hookMatch && !line.includes('import')) {
        hooks.push({ line: i + 1, type: hookMatch[1], depth, content: line.trim() });
      }
      
      // Match early return
      const returnMatch = line.match(/^\s*return\s*[<(]/);
      if (returnMatch && depth > 1) {
        returns.push({ line: i + 1, depth, content: line.trim() });
      }
    }
    
    // Find hooks that come AFTER an early return at the same depth
    if (hooks.length === 0 || returns.length === 0) continue;
    
    const firstReturn = returns[0];
    const hooksAfterReturn = hooks.filter(h => h.line > firstReturn.line);
    
    if (hooksAfterReturn.length > 0) {
      issues.push({
        file: file.replace('/Users/je/chengcheng-learning-workbench/', ''),
        firstReturnLine: firstReturn.line,
        firstReturnContent: firstReturn.content.slice(0, 60),
        hooksAfter: hooksAfterReturn.map(h => ({ line: h.line, type: h.type })),
      });
    }
  }
}

fs.writeFileSync('/Users/je/chengcheng-learning-workbench/scan-hooks.json', JSON.stringify(issues, null, 2));
console.log('Files with hooks-after-return:', issues.length);
for (const i of issues) console.log(i.file, 'line', i.firstReturnLine, '->', i.hooksAfter.map(h => h.line + ':' + h.type).join(', '));
