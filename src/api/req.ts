import fetch from "cross-fetch";
import createHttpsProxyAgent, { HttpsProxyAgent } from "https-proxy-agent";

export function req(
  path: string,
  options: { method?: string; body?: Record<string, unknown>; host?: string; token?: string; } = {}
) {
  const {
    method, body, host = process.env.MESS_HOST, token = process.env.MESS_TOKEN,
  } = options;
  if (!host) throw new Error("Missing host");
  if (!token) throw new Error("Missing token");
  const url = new URL(`${host}${path}`);
  const opts: {
    method: string | undefined;
    body?: string;
    headers: {
      "content-type": string;
      token: string;
    };
    agent?: HttpsProxyAgent;
  } = {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
      token: token,
    },
  };
  const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
  const no_proxy = process.env.NO_PROXY || process.env.no_proxy;
  if (proxy && no_proxy !== url.hostname) {
    opts["agent"] = createHttpsProxyAgent(proxy);
  }
  return fetch(url, opts);
}
