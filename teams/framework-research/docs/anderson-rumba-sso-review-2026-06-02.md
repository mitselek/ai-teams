# Security Architecture Review -- `rumba_sso_login`

**Reviewer:** Ross Anderson (Security Architecture & Compliance)
**Subject:** Cloudflare Access → Oracle APEX SSO bridge, PR #9, `vjs_db_vjs_guard`
**Date:** 2026-06-02

---

### Regulatory Context

EVR is a [NIS2][nis2] Annex I essential entity (rail transport) under Estonian [KüTS][küts]. This procedure is an authentication boundary -- the point where an external identity assertion (Cloudflare) becomes an internal session (APEX). [NIS2 Art. 21(2)(d)][nis2-21] requires access-control measures, [Art. 21(2)(j)][nis2-21] requires appropriate cryptography, and [Art. 23][nis2-23] / [KüTS §8][küts-8] impose incident-reporting obligations if an authentication bypass is exploited. The regulatory question is not whether the bridge works, but whether its trust model is defensible under audit. A pilot that issues real sessions in a live realm is in scope -- migration status does not lower the bar.

### Findings

**1. [SEVERITY: HIGH] Identity assertion without cryptographic verification** `[THREAT-MODEL]`

`Cf-Access-Authenticated-User-Email` is consumed as a plain CGI header. JWT validation of `Cf-Access-Jwt-Assertion` is an explicit TODO. Origin-lock is a network-perimeter control, not cryptographic proof of identity.

**Risk:** Anyone who can reach the Oracle origin by any path that bypasses Cloudflare -- SSRF, internal network route, misconfigured firewall, leaked origin hostname, compromised upstream proxy -- can assert any email address and obtain a valid APEX session. Full authentication bypass. Cloudflare's own documentation explicitly warns against trusting the email header without JWT validation.

**Recommendation: CHANGE** -- validate `Cf-Access-Jwt-Assertion` against the CF Access public keys (team-domain JWKS at `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`), verify `aud`/`iss`/`exp`, and derive the email from the verified token payload -- never from the plain header. PL/SQL JWT validation is non-trivial (requires APEX_JWT or a custom UTL_HTTP + DBMS_CRYPTO chain); an alternative is validating at the reverse proxy layer (ORDS / Apache) and passing a verified flag. **This is the single blocking item before production deployment.**

**Ref:** [NIS2 Art. 21(2)(d)][nis2-21] access control, [Art. 21(2)(j)][nis2-21] cryptography. A header-trust model without cryptographic verification is not defensible as an "appropriate" measure under [Art. 21(1)][nis2-21].

**2. [SEVERITY: HIGH] No defense-in-depth on origin reachability** `[THREAT-MODEL]`

The entire trust model assumes the Oracle origin is reachable only via Cloudflare. This assumption is undocumented outside the procedure's comments and unenforced in code.

**Risk:** If the origin becomes reachable off-tunnel -- through infrastructure change, network misconfiguration, or internal routing -- Finding 1 becomes trivially exploitable with no second layer of defense.

**Recommendation: EXTEND** -- add mTLS or CF-signed-request validation (CF service-token verification or `cf-connecting-ip` allowlist) so the JWT is not the sole gate. Document the network assumption as an explicit, tested control with a verification procedure.

**Ref:** [NIS2 Art. 21(2)(d)][nis2-21] access control -- defense-in-depth is the standard, not single-layer trust.

**3. [SEVERITY: MEDIUM] Authenticated-but-broken half-state not terminated**

When `init_user_data` sets `CURRENT_USER_ID = -1` (no OSALEJA mapping), the procedure logs the error but leaves the user authenticated. The code's own comment identifies the resulting "portal bounce loop."

**Risk:** The user holds a valid APEX session with no resolved identity context. Downstream code that assumes all authenticated users have a valid identity may fail open -- the behavior depends entirely on whether downstream pages check for `-1`.

**Recommendation: CHANGE** -- treat `-1` as a hard failure. Call `apex_authentication.logout` (or equivalent session invalidation) rather than only logging. Fail the authentication entirely rather than leaving a half-authenticated session.

**Ref:** [NIS2 Art. 21(2)(i)][nis2-21] access control policies.

**4. [SEVERITY: MEDIUM] Blanket exception handler masks security events**

Phase 1's `WHEN OTHERS THEN ... RETURN` catches every possible exception -- SQL injection attempts, privilege errors, schema changes, and JWT validation failures (once implemented) all produce the same debug log entry and silent fallthrough.

**Risk:** Security-relevant failures are indistinguishable from normal non-matches. An active probing attempt looks identical to a user with no email mapping. This undermines detection and monitoring duties under NIS2 Art. 21(2)(b) and the Art. 23 incident-reporting chain.

**Recommendation: CHANGE** -- narrow the handler to expected exceptions. Route auth-bridge failures to a structured, tamper-evident security log with distinct event codes for validation-failed / no-match / ambiguous / unexpected-error. Log `SQLCODE` alongside `SQLERRM` for faster triage.

**Ref:** [NIS2 Art. 21(2)(b)][nis2-21] incident handling, [Art. 23][nis2-23] reporting.

**5. [SEVERITY: MEDIUM] No audit trail for successful logins**

Successful SSO logins are not logged at all -- only error paths reach `debug.writeln`. There is no authoritative record of who logged in via the bridge and when.

**Recommendation: ADD** -- emit a tamper-resistant audit log entry on every successful `post_login`: subject email, resolved username, timestamp, source identifier. Use a retained audit table with appropriate access controls, not debug output.

**Ref:** [NIS2 Art. 21(2)(b)][nis2-21] -- detection and monitoring; [KüTS][küts] incident reconstruction.

**6. [SEVERITY: LOW] PII in debug logs**

`l_email` is written to debug output on ambiguous-mapping and fall-through error paths. Email addresses are personal data that accumulate in application logs with unclear retention and access controls.

**Recommendation: CHANGE** -- log a hash or anonymized identifier in debug output. If the full email is needed for triage, ensure the debug table has scoped access controls and a defined retention period.

**Ref:** [GDPR Art. 5(1)(c)][gdpr-5] data minimization, [Art. 5(1)(f)][gdpr-5] integrity and confidentiality.

**7. [SEVERITY: LOW] Email comparison lacks normalization** `[THREAT-MODEL]`

`lower(k.andmed) = lower(l_email)` handles case but not leading/trailing whitespace, Unicode normalization, or plus-addressing. Email addresses in `kontaktandmed` are human-entered data.

**Recommendation: EXTEND** -- add `TRIM()` to both sides. Consider a data-quality audit on email uniqueness in `kontaktandmed`. Defense-in-depth, not blocking.

### Positive Observations

- **The code's own comments are security-aware.** The trust model is explicitly stated, the Sec-Fetch-Dest guard is correctly labelled as channel governance not security, and the JWT TODO is present and specific. This is unusually good self-assessment.
- **Fail-closed by default.** Non-public user, missing mapping, and ambiguous mapping all `RETURN` without establishing a session. The default posture is deny.
- **The ambiguity guard is genuinely load-bearing.** With 2.3% of emails mapping to multiple usernames in DEV, `l_cnt <> 1` prevents identity confusion in a population that intentionally includes non-EVR workers. Refusing to guess is correct.
- **Phase 2's no-catch design is intentional and correct.** Authentication failures after `post_login` surface loudly rather than silently succeeding.
- **Durable logging via autonomous transaction.** SSO failures survive request rollback -- the right pattern for security-relevant events.
- **Deliberate scoping decision.** Omitting `raudtee_kood = '08'` is documented and correct for rumba's multi-tenant population.

### Summary Assessment

The procedure is well-designed on identity *resolution* (ambiguity guard, fail-closed posture, deliberate scoping) but unfinished on identity *authentication*. The trust model currently rests on a network assumption (origin-lock) rather than a verified cryptographic claim. **Finding 1 (JWT validation) and Finding 2 (defense-in-depth on origin reachability) are blocking** -- they must close before this bridge carries production traffic. Findings 3-5 (half-state termination, structured security logging, successful-login audit trail) should follow in the same hardening pass. The code's honest self-assessment and deny-by-default posture provide a strong foundation to build on.

(*Anderson*)

---

### Sources

[nis2]: https://eur-lex.europa.eu/eli/dir/2022/2555/oj "Directive (EU) 2022/2555 (NIS2)"
[nis2-21]: https://eur-lex.europa.eu/eli/dir/2022/2555/oj#d1e3563-80-1 "NIS2 Article 21 -- Cybersecurity risk-management measures"
[nis2-23]: https://eur-lex.europa.eu/eli/dir/2022/2555/oj#d1e3757-80-1 "NIS2 Article 23 -- Reporting obligations"
[küts]: https://www.riigiteataja.ee/akt/113032025005 "Küberturvalisuse seadus (Cybersecurity Act)"
[küts-8]: https://www.riigiteataja.ee/akt/113032025005#para8 "KüTS §8 -- Küberintsidendist teavitamine (Cyber incident reporting)"
[gdpr-5]: https://eur-lex.europa.eu/eli/reg/2016/679/oj#d1e1797-1-1 "GDPR Article 5 -- Principles relating to processing of personal data"
