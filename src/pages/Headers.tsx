import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const ensureMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const ensureCanonical = (href: string) => {
  let link = document.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const HeadersPage: React.FC = () => {
  const [headers, setHeaders] = useState<{ csp?: string; xfo?: string; cacheControl?: string; date?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const timerRef = useRef<number | null>(null);

  const fetchProbe = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${window.location.pathname}?probe=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      setHeaders({
        csp: res.headers.get("content-security-policy") || undefined,
        xfo: res.headers.get("x-frame-options") || undefined,
        cacheControl: res.headers.get("cache-control") || undefined,
        date: res.headers.get("date") || undefined,
      });
    } catch (e) {
      setHeaders({ csp: "<fetch error>", xfo: undefined, cacheControl: undefined, date: undefined });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Response Headers | DadderUp Debug";
    ensureMeta("description", "Live view of response headers (CSP, X-Frame-Options, Cache-Control)");
    ensureCanonical(window.location.href);
  }, []);

  useEffect(() => {
    // Initial load
    fetchProbe();
  }, [fetchProbe]);

  useEffect(() => {
    if (auto) {
      timerRef.current = window.setInterval(fetchProbe, 5000);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [auto, fetchProbe]);

  const rows = useMemo(() => [
    { label: "content-security-policy", value: headers?.csp || "" },
    { label: "x-frame-options", value: headers?.xfo || "" },
    { label: "cache-control", value: headers?.cacheControl || "" },
    { label: "date", value: headers?.date || "" },
  ], [headers]);

  return (
    <main role="main" aria-label="Response headers" className="mx-auto max-w-3xl p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Response Headers Debug</h1>
        <p className="text-sm opacity-70">Live headers from this route (no-store fetch). Use to validate CSP and embedding.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Current headers</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Auto refresh</span>
              <Switch checked={auto} onCheckedChange={setAuto} />
            </div>
            <Button size="sm" onClick={fetchProbe} disabled={loading}>
              {loading ? "Pinging..." : "Ping now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="text-sm break-words">
                <span className="font-medium">{r.label}: </span>
                <span className="opacity-80">{r.value || "<empty>"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="text-xs opacity-70">
        <p>
          frame-ancestors allowlist should include: 'self', lovable.dev, *.lovable.dev, *.lovableproject.com, *.lovable.app
        </p>
      </section>
    </main>
  );
};

export default HeadersPage;
