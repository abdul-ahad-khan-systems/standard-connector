const { readdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const testDirs = [
  join(__dirname, 'integrity'),
  join(__dirname, 'integration')
];

const testFiles = testDirs
  .flatMap((dir) =>
    readdirSync(dir)
      .filter((file) => file.endsWith('.test.js'))
      .map((file) => join(dir, file))
  )
  .sort();

if (testFiles.length === 0) {
  console.error('FAIL: no test files found');
  process.exit(1);
}

let failed = false;

for (const testFile of testFiles) {
  console.log(`\nRUN: ${testFile}`);

  const result = spawnSync(process.execPath, [testFile], {
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`FAIL: ${testFile}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`\nPASS: all ${testFiles.length} tests`);
