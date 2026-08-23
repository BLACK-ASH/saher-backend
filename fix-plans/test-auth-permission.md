# Test Plan — `auth` & `permission`

Source: core modules. 25+ tests required.

## Auth Scenarios (15 tests)
- [ ] POST `/login` - Valid credentials -> set cookies, 200
- [ ] POST `/login` - Invalid credentials -> 401
- [ ] POST `/login` - Empty body -> 400
- [ ] POST `/login` - Rate limiting (simulated)
- [ ] POST `/logout` - Clear cookies, invalidate session cache -> 200
- [ ] POST `/refresh` - Valid refresh -> new access token
- [ ] POST `/refresh` - Revoked/Invalid refresh -> 401
- [ ] POST `/register` (if enabled) - Success/Fail cases
- [ ] GET `/profile` - Unauthenticated -> 401
- [ ] GET `/profile` - Authenticated but invalid JWT session binding -> 401
- [ ] Password reset flow - Request token -> 200
- [ ] Password reset flow - Invalid token -> 400
- [ ] Password reset flow - Success -> 200
- [ ] Change email flow - New redesign validation
- [ ] CSRF - Check CORS/Origin enforcement

## Permission Scenarios (10 tests)
- [ ] `authorize()` - Admin read 'event' -> Pass
- [ ] `authorize()` - User write 'event' -> Fail 403
- [ ] `authorize()` - Read action bypass check (ensure removed) -> Fail if not matching role
- [ ] `authorize()` - Specific resource IDOR check
- [ ] RBAC - Exhaustive role `Record` check
- [ ] Permission utils - `createPermission` helper logic
- [ ] ... (additional edge cases to reach 25+)
