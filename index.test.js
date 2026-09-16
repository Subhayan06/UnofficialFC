const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Security check for index.html form credentials', () => {
  const indexPath = path.join(__dirname, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  test('does not contain hardcoded Web3Forms API key', () => {
    const vulnerableKey = '451929a3-51cb-412f-ac63-14b086013277';
    assert.equal(
      indexContent.includes(vulnerableKey),
      false,
      'Hardcoded API key must not be present in index.html'
    );
  });

  test('uses placeholder for access_key in feedback form', () => {
    assert.equal(
      indexContent.includes('YOUR_WEB3FORMS_ACCESS_KEY'),
      true,
      'index.html should use YOUR_WEB3FORMS_ACCESS_KEY placeholder'
    );
  });
});

describe('Security check for script.js form submission validation', () => {
  const scriptPath = path.join(__dirname, 'script.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');

  test('validates access_key against placeholder before form submission', () => {
    assert.equal(
      scriptContent.includes('YOUR_WEB3FORMS_ACCESS_KEY'),
      true,
      'script.js should validate access_key against placeholder'
    );
  });
});
