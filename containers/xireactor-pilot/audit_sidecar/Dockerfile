# audit_sidecar — BYPASSRLS read-only auditor (§3.5)
#
# Sidecar in the xireactor-pilot stack. Connects to db as `audit_role` on an
# hourly cron, runs tenant-boundary queries, emits markdown reports to
# /reports (a docker volume shared out to the operator).
#
# Trust surface: cross-tenant-privileged credential (§3.5.1). Logs are
# cross-tenant-sensitive too.

FROM postgres:16-alpine

RUN apk add --no-cache bash

COPY audit-run.sh /usr/local/bin/audit-run.sh
RUN chmod +x /usr/local/bin/audit-run.sh

# Cron-driven: sleep+run loop (simpler than crond for a single job on a fixed
# cadence). AUDIT_INTERVAL_SEC defaults to 3600 (hourly).
ENV AUDIT_INTERVAL_SEC=3600

CMD ["/bin/bash", "-c", "while true; do /usr/local/bin/audit-run.sh; sleep ${AUDIT_INTERVAL_SEC}; done"]
