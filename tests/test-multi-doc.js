/**
 * End-to-end integration test for multi-doc (docsDir array) support.
 *
 * Verifies that when docsDir is an array of DocsSection objects the plugin:
 *  - Scans every configured section directory
 *  - Groups documents by section in llms.txt
 *  - Includes content from all sections in llms-full.txt
 *  - Constructs URLs scoped to each section's routeBasePath
 *  - Falls back to the physical path as section name when label is omitted
 *  - Remains backward-compatible when docsDir is a plain string
 *
 * Relies on:
 *  - test-docs/docs/  (existing single-section test fixture)
 *  - test-docs/api/   (minimal second-section fixture added for multi-doc tests)
 *
 * Run with: node tests/test-multi-doc.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const pluginModule = require('../lib/index');
const plugin       = pluginModule.default;

const TEST_DIR   = path.join(__dirname, '..', 'test-docs');
const OUTPUT_DIR = path.join(__dirname, '..', 'test-output');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function createMockContext() {
  return {
    siteDir: TEST_DIR,
    siteConfig: {
      title:   'Multi-Doc Test Site',
      tagline: 'Testing multi-section documentation support',
      url:     'https://example.com',
      baseUrl: '/',
    },
    outDir: OUTPUT_DIR,
  };
}

function readOutput(filename) {
  return fs.readFileSync(path.join(OUTPUT_DIR, filename), 'utf8');
}

function runChecks(checks) {
  let allPassed = true;
  for (const { desc, ok } of checks) {
    if (!ok) {
      console.log(`  ❌ FAIL – ${desc}`);
      allPassed = false;
    }
  }
  return allPassed;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  console.log('========================================');
  console.log('Running Multi-Doc Integration Tests');
  console.log('========================================\n');

  ensureOutputDir();

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------------------
  // Test 1: Two labelled sections → grouped headings in llms.txt
  // -------------------------------------------------------------------------
  console.log('Test 1: Two labelled sections produce grouped section headings in llms.txt');
  try {
    await plugin(createMockContext(), {
      docsDir: [
        { path: 'docs', routeBasePath: 'docs', label: 'Documentation' },
        { path: 'api',  routeBasePath: 'api',  label: 'API Reference' },
      ],
      llmsTxtFilename:     'llms-multi-labelled.txt',
      llmsFullTxtFilename: 'llms-full-multi-labelled.txt',
    }).postBuild();

    const content = readOutput('llms-multi-labelled.txt');

    const docsHeadingPos = content.indexOf('## Documentation');
    const apiHeadingPos  = content.indexOf('## API Reference');

    const allPassed = runChecks([
      {
        desc: 'has "## Documentation" section heading',
        ok:   docsHeadingPos !== -1,
      },
      {
        desc: 'has "## API Reference" section heading',
        ok:   apiHeadingPos !== -1,
      },
      {
        desc: '"## Documentation" appears before "## API Reference"',
        ok:   docsHeadingPos !== -1 && apiHeadingPos !== -1 && docsHeadingPos < apiHeadingPos,
      },
      {
        desc: '"Getting Started" link is present (from docs section)',
        ok:   content.includes('Getting Started'),
      },
      {
        desc: '"Authentication" link is present (from api section)',
        ok:   content.includes('Authentication'),
      },
      {
        desc: '"Endpoints" link is present (from api section)',
        ok:   content.includes('Endpoints'),
      },
      {
        desc: 'docs section URLs use /docs/ prefix',
        ok:   content.includes('https://example.com/docs/'),
      },
      {
        desc: 'api section URLs use /api/ prefix',
        ok:   content.includes('https://example.com/api/'),
      },
    ]);

    if (allPassed) { console.log('  ✅ PASS'); passed++; } else { failed++; }
  } catch (err) {
    console.log(`  ❌ ERROR – ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 2: Sections without labels fall back to the physical path name
  // -------------------------------------------------------------------------
  console.log('\nTest 2: Sections without labels fall back to path as section heading');
  try {
    await plugin(createMockContext(), {
      docsDir: [
        { path: 'docs', routeBasePath: 'docs' },
        { path: 'api',  routeBasePath: 'api' },
      ],
      llmsTxtFilename:     'llms-multi-nolabel.txt',
      llmsFullTxtFilename: 'llms-full-multi-nolabel.txt',
    }).postBuild();

    const content = readOutput('llms-multi-nolabel.txt');

    const allPassed = runChecks([
      {
        desc: 'has "## docs" section heading (path fallback)',
        ok:   content.includes('## docs'),
      },
      {
        desc: 'has "## api" section heading (path fallback)',
        ok:   content.includes('## api'),
      },
    ]);

    if (allPassed) { console.log('  ✅ PASS'); passed++; } else { failed++; }
  } catch (err) {
    console.log(`  ❌ ERROR – ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 3: llms-full.txt contains content from both sections
  // -------------------------------------------------------------------------
  console.log('\nTest 3: llms-full.txt contains content from both sections');
  try {
    // Reuses the file generated in Test 1
    const content = readOutput('llms-full-multi-labelled.txt');

    const allPassed = runChecks([
      {
        desc: 'contains docs-section content ("Getting Started")',
        ok:   content.includes('Getting Started'),
      },
      {
        desc: 'contains api-section content ("Authentication")',
        ok:   content.includes('Authentication'),
      },
      {
        desc: 'contains api-section content ("Endpoints")',
        ok:   content.includes('Endpoints'),
      },
      {
        desc: 'contains api endpoint detail from endpoints.md ("GET /items")',
        ok:   content.includes('GET /items'),
      },
      {
        desc: 'contains api auth detail from authentication.md ("Authorization")',
        ok:   content.includes('Authorization'),
      },
    ]);

    if (allPassed) { console.log('  ✅ PASS'); passed++; } else { failed++; }
  } catch (err) {
    console.log(`  ❌ ERROR – ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 4: Each section's files get URLs scoped to their routeBasePath
  // -------------------------------------------------------------------------
  console.log('\nTest 4: Each section\'s files get URLs scoped to their routeBasePath');
  try {
    // Reuses the file generated in Test 1
    const content = readOutput('llms-multi-labelled.txt');

    const allPassed = runChecks([
      {
        desc: 'api/authentication.md URL is under /api/',
        ok:   content.includes('https://example.com/api/authentication'),
      },
      {
        desc: 'api/endpoints.md URL is under /api/',
        ok:   content.includes('https://example.com/api/endpoints'),
      },
      {
        desc: 'docs/getting-started.md URL is under /docs/',
        ok:   content.includes('https://example.com/docs/getting-started'),
      },
    ]);

    if (allPassed) { console.log('  ✅ PASS'); passed++; } else { failed++; }
  } catch (err) {
    console.log(`  ❌ ERROR – ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 5: String docsDir remains backward-compatible (only scans that dir)
  // -------------------------------------------------------------------------
  console.log('\nTest 5: String docsDir still works (backward compatibility)');
  try {
    await plugin(createMockContext(), {
      docsDir:             'docs',
      llmsTxtFilename:     'llms-single-compat.txt',
      llmsFullTxtFilename: 'llms-full-single-compat.txt',
    }).postBuild();

    const content = readOutput('llms-single-compat.txt');

    const allPassed = runChecks([
      {
        desc: 'contains docs content ("Getting Started")',
        ok:   content.includes('Getting Started'),
      },
      {
        desc: 'does NOT contain api-section URLs (/api/authentication)',
        ok:   !content.includes('https://example.com/api/authentication'),
      },
      {
        desc: 'does NOT contain api-section URLs (/api/endpoints)',
        ok:   !content.includes('https://example.com/api/endpoints'),
      },
    ]);

    if (allPassed) { console.log('  ✅ PASS'); passed++; } else { failed++; }
  } catch (err) {
    console.log(`  ❌ ERROR – ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 6: Single-element DocsSection array only scans that one directory
  // -------------------------------------------------------------------------
  console.log('\nTest 6: Single-element DocsSection array scans only that directory');
  try {
    await plugin(createMockContext(), {
      docsDir: [
        { path: 'api', routeBasePath: 'api', label: 'API Reference' },
      ],
      llmsTxtFilename:     'llms-single-array.txt',
      llmsFullTxtFilename: 'llms-full-single-array.txt',
    }).postBuild();

    const content = readOutput('llms-single-array.txt');

    const allPassed = runChecks([
      {
        desc: 'contains "## API Reference" section heading',
        ok:   content.includes('## API Reference'),
      },
      {
        desc: 'contains "Authentication" link from api/',
        ok:   content.includes('Authentication'),
      },
      {
        desc: 'contains "Endpoints" link from api/',
        ok:   content.includes('Endpoints'),
      },
      {
        desc: 'does NOT contain docs-only content (getting-started URL)',
        ok:   !content.includes('https://example.com/docs/getting-started'),
      },
    ]);

    if (allPassed) { console.log('  ✅ PASS'); passed++; } else { failed++; }
  } catch (err) {
    console.log(`  ❌ ERROR – ${err.message}`);
    console.error(err.stack);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = passed + failed;
  console.log('\n========================================');
  console.log(`Summary: ${passed}/${total} passed, ${failed} failed`);
  console.log('========================================\n');

  return failed === 0;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  try {
    const success = await runTests();
    if (success) {
      console.log('✅ All multi-doc integration tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some multi-doc integration tests failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test runner error:', err);
    process.exit(1);
  }
}

main();
