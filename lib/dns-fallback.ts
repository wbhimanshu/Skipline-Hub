import dns from "node:dns";

let configured = false;

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address?: string | dns.LookupAddress[],
  family?: number,
) => void;

export function configureDns() {
  if (configured) return;
  const servers = process.env.PG_DNS_SERVERS;
  if (!servers) return;
  configured = true;

  dns.setServers(servers.split(",").map((server) => server.trim()).filter(Boolean));
  dns.setDefaultResultOrder("ipv4first");

  const original = dns.lookup.bind(dns) as (
    hostname: string,
    options: dns.LookupOptions | LookupCallback,
    callback?: LookupCallback,
  ) => void;

  dns.lookup = ((hostname: string, options: unknown, callback?: LookupCallback) => {
    let opts: dns.LookupOptions = {};
    let cb = callback;
    if (typeof options === "function") {
      cb = options as LookupCallback;
    } else if (options && typeof options === "object") {
      opts = options as dns.LookupOptions;
    }
    if (!cb) return;

    dns.resolve4(hostname, (error, addresses) => {
      if (error || !addresses.length) {
        original(hostname, options as dns.LookupOptions, cb);
        return;
      }
      if (opts.all) {
        cb(
          null,
          addresses.map((address) => ({ address, family: 4 })),
          4,
        );
        return;
      }
      cb(null, addresses[0], 4);
    });
  }) as typeof dns.lookup;
}
