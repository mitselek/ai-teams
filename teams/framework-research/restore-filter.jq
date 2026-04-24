# (*FR:Volta*) — jq filter for restore-inboxes.sh
# Removes shutdown/idle protocol messages from inbox JSON arrays.
#
# Matches structural JSON pattern ("type":"shutdown_request") in .text field,
# NOT free-string. Free-string match has false positives on legitimate messages
# that discuss shutdown protocol in prose (empirically verified: Finn's T07
# safety report in montesquieu.json contains "shutdown_request" as prose).
#
# Note: \\s in this file = regex \s (whitespace). jq file parser requires
# double-backslash for regex escapes, unlike jq command-line string literals.

[.[] | select(
    (.text | test("\"type\"\\s*:\\s*\"shutdown_request\"") | not) and
    (.text | test("\"type\"\\s*:\\s*\"shutdown_approved\"") | not) and
    (.text | test("\"type\"\\s*:\\s*\"shutdown_response\"") | not) and
    (.text | test("\"type\"\\s*:\\s*\"idle_notification\"") | not)
)]
