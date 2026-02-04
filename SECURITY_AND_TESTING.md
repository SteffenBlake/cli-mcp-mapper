# Security and Testing Improvements

## Summary

This update addresses a critical command injection vulnerability and adds comprehensive testing infrastructure to the CLI MCP Mapper project.

## Security Fix

### Vulnerability
The original implementation used `spawn(command, args, { shell: true })` which allowed shell interpretation of arguments. This created a command injection vulnerability where malicious input could execute arbitrary commands.

**Example attack vectors that were possible:**
- `$(whoami)` - Command substitution
- `` `ls -la` `` - Backtick command substitution  
- `test | cat /etc/passwd` - Pipe to other commands
- `hello; rm -rf /` - Command chaining with semicolon
- `test && cat /etc/passwd` - AND command chaining
- `test || whoami` - OR command chaining
- `test > /tmp/hacked` - Output redirection

### Fix
Removed `shell: true` option from `spawn()` call. Now commands are executed directly without shell interpretation, treating all arguments as literal strings.

**Code change in `lib.js`:**
```javascript
// Before (VULNERABLE):
const proc = spawn(command, args, { shell: true });

// After (SECURE):
const proc = spawn(command, args);
```

## Testing Infrastructure

### Test Framework
- Added Jest as the testing framework
- Configured to work with ES modules (`--experimental-vm-modules`)
- Test command: `npm test`

### Test Coverage

#### Core Functionality Tests (15 tests)
- `buildInputSchema()` - Parameter schema generation
  - String, boolean, number parameters
  - Enum support
  - Required fields
  - Default values
  - Empty/undefined parameter handling

- `buildCommand()` - Command building logic
  - Positional arguments (single and multiple, ordered)
  - Named arguments (string, number, boolean)
  - Mixed positional and named arguments
  - Boolean flags with and without values
  - Type conversion (number to string)

#### Security Tests (11 tests)
Tests that verify injection attacks are prevented:

**String parameter injections:**
- Command substitution with `$(...)`
- Backtick command substitution
- Pipe operators
- Semicolon command chaining
- AND (`&&`) command chaining
- OR (`||`) command chaining
- Output redirection (`>`)
- Newline injection

**Other parameter types:**
- Named argument injection attempts
- Number parameter injection attempts
- Boolean parameter injection attempts
- Multiple simultaneous injection attempts

#### Error Handling Tests (3 tests)
- Command execution failures
- Non-existent commands
- stderr capture on errors

#### Normal Operation Tests (4 tests)
- Simple command execution
- Multiple arguments
- Arguments with spaces
- Special characters (non-shell)

**Total: 34 tests, all passing**

## CI/CD Improvements

### New CI Workflow (`.github/workflows/ci.yml`)
Runs on every push and pull request to main/develop branches:
- Tests on multiple Node.js versions (18.x, 20.x, 22.x)
- Installs dependencies with `npm ci`
- Runs test suite
- Runs build if build script exists

### Updated Publish Workflow (`.github/workflows/publish.yml`)
Modified to ensure quality before publishing:
1. Check if tag exists
2. Install dependencies (`npm ci`)
3. **Run tests (`npm test`)** - NEW
4. Create and push tag - MOVED AFTER TESTS
5. Build if needed
6. Publish to NPM

**Key improvement:** Tag is now created AFTER tests pass, preventing orphaned tags when tests fail.

## File Structure Changes

### New Files
- `lib.js` - Core logic extracted for testability
  - `buildInputSchema()` - Exported function
  - `buildCommand()` - Exported function
  - `executeCommand()` - Exported function (with security fix)
  
- `lib.test.js` - Comprehensive test suite

- `.github/workflows/ci.yml` - New CI workflow

### Modified Files
- `index.js` - Refactored to use exported functions from `lib.js`
- `package.json` - Added Jest dev dependency and test script
- `.github/workflows/publish.yml` - Updated to run tests before tagging

## Verification

All tests pass:
```bash
npm test
```

CodeQL security scan: **0 alerts** (clean)

## Migration Notes

This is a **non-breaking change**. The public API remains identical:
- Entry point is still `index.js`
- Command-line interface unchanged
- Configuration format unchanged
- MCP protocol implementation unchanged

The refactoring only extracts internal logic for better testability while maintaining full backward compatibility.

## Recommendations

1. ✅ Tests now run automatically on all PRs via CI workflow
2. ✅ Publish workflow ensures tests pass before releasing
3. ✅ Command injection vulnerability is fixed
4. ✅ Comprehensive test coverage prevents regressions

## Future Considerations

1. Consider adding integration tests with actual MCP clients
2. Add test coverage reporting
3. Consider adding linting (ESLint) to the CI pipeline
4. Add semantic versioning automation based on commit messages
