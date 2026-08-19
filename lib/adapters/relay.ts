// Relay base URL — where the /api/exchange-relay forwarding happens.
// Defaults to the same-origin Vercel function. Set NEXT_PUBLIC_RELAY_URL to
// relocate the relay (e.g. a self-hosted instance whose outbound IP passes the
// exchange's geo-eligibility checks).

export function relayBase(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_RELAY_URL) {
      return process.env.NEXT_PUBLIC_RELAY_URL.replace(/\/$/, "");
    }
    return window.location.origin;
  }
  return process.env.BALANX_APP_URL ?? "";
}
