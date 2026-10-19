/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const sdk = require("@supabase/supabase-js");
const ssr = require("@supabase/ssr");

function loadTypeScript(relativePath, imports = {}, globals = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    AbortSignal,
    Request,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    ...globals,
  }, { filename });
  return loadedModule.exports;
}

function timeoutFetch(fetch, timeoutMs = 25) {
  const { createServerFetch } = loadTypeScript("lib/supabase/fetch.ts", {
    "server-only": {},
  }, { fetch });
  return createServerFetch(timeoutMs);
}

function stalledFetch() {
  const calls = [];
  return {
    calls,
    fetch(input, init) {
      const signal = init?.signal;
      assert.ok(signal instanceof AbortSignal, "server requests must have an abort signal");
      calls.push({ input, init });
      return new Promise((resolve, reject) => {
        // AbortSignal.timeout's timer is unref'd. This represents the network
        // socket that keeps a real in-flight request alive until cancellation.
        const connection = setInterval(() => {}, 1000);
        function abort() {
          clearInterval(connection);
          reject(signal.reason);
        }
        if (signal.aborted) abort();
        else signal.addEventListener("abort", abort, { once: true });
      });
    },
  };
}

const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-placeholder",
  SUPABASE_SERVICE_ROLE_KEY: "server-secret-placeholder",
};

async function productionClient(kind, serverFetch) {
  const globals = { process: { env } };
  const fetchImport = { serverFetch };
  if (kind === "administrator") {
    return loadTypeScript("lib/supabase/admin.ts", {
      "server-only": {},
      "@supabase/supabase-js": sdk,
      "./fetch": fetchImport,
    }, globals).createAdminClient();
  }
  if (kind === "cookie session") {
    return loadTypeScript("lib/supabase/server.ts", {
      "@supabase/ssr": ssr,
      "next/headers": { async cookies() { return { getAll() { return []; }, set() {} }; } },
      "./fetch": fetchImport,
    }, globals).createClient();
  }
  let client;
  const { updateSession } = loadTypeScript("lib/supabase/proxy.ts", {
    "@supabase/ssr": {
      createServerClient(...args) { client = ssr.createServerClient(...args); return client; },
    },
    "next/server": {
      NextResponse: {
        next() { return { cookies: { set() {} } }; },
        redirect() { assert.fail("The public home page should not redirect"); },
      },
    },
    "../utils": { hasEnvVars: true },
    "./fetch": fetchImport,
  }, globals);
  await updateSession({
    cookies: { getAll() { return []; }, set() {} },
    nextUrl: { pathname: "/" },
  });
  assert.ok(client);
  return client;
}

test("server fetch preserves successful responses and request options", async () => {
  const response = new Response("saved", { status: 201 });
  let captured;
  const fetch = timeoutFetch(async (input, init) => { captured = { input, init }; return response; });
  const result = await fetch("https://example.supabase.co/rest/v1/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"code":"IS101"}',
    cache: "no-store",
  });
  assert.equal(result, response);
  assert.equal(captured.init.method, "POST");
  assert.deepEqual(captured.init.headers, { "Content-Type": "application/json" });
  assert.equal(captured.init.body, '{"code":"IS101"}');
  assert.equal(captured.init.cache, "no-store");
  assert.equal(captured.init.signal.aborted, false);
});

test("a stalled server fetch is cancelled by its deadline", async () => {
  const network = stalledFetch();
  const fetch = timeoutFetch(network.fetch);
  await assert.rejects(fetch("https://example.supabase.co/rest/v1/classes"), { name: "TimeoutError" });
  assert.equal(network.calls.length, 1);
  assert.equal(network.calls[0].init.signal.aborted, true);
});

test("caller cancellation survives the timeout wrapper for fetch options and Request objects", async (t) => {
  for (const source of ["options", "Request"]) {
    await t.test(source, async () => {
      const network = stalledFetch();
      const fetch = timeoutFetch(network.fetch, 1000);
      const controller = new AbortController();
      const reason = new Error("navigation cancelled");
      const input = source === "Request"
        ? new Request("https://example.supabase.co/rest/v1/classes", { signal: controller.signal })
        : "https://example.supabase.co/rest/v1/classes";
      const pending = fetch(input, source === "options" ? { signal: controller.signal } : undefined);
      controller.abort(reason);
      await assert.rejects(pending, (error) => error === reason);
      assert.equal(network.calls.length, 1);
    });
  }
});

test("already cancelled callers do not wait for the server deadline", async () => {
  const network = stalledFetch();
  const fetch = timeoutFetch(network.fetch, 1000);
  const reason = new Error("request already cancelled");
  await assert.rejects(fetch("https://example.supabase.co/rest/v1/classes", {
    signal: AbortSignal.abort(reason),
  }), (error) => error === reason);
});

test("all production server clients cancel stalled SDK queries without repeating them", { timeout: 3000 }, async (t) => {
  for (const kind of ["cookie session", "administrator", "proxy"]) {
    await t.test(kind, async () => {
      const network = stalledFetch();
      const client = await productionClient(kind, timeoutFetch(network.fetch));
      const { data, error, status } = await client.from("classes").select("id");
      assert.equal(data, null);
      assert.ok(error, "real Supabase SDK must surface the aborted query as an error");
      assert.equal(status, 0);
      assert.equal(network.calls.length, 1, "GET retries must not multiply the configured deadline");
      assert.equal(network.calls[0].init.signal.aborted, true);
    });
  }
});

test("real Supabase Auth returns a retryable transport error when its server fetch times out", async () => {
  const network = stalledFetch();
  const client = await productionClient("cookie session", timeoutFetch(network.fetch));
  const { data, error } = await client.auth.getUser("test-access-token");
  assert.equal(data.user, null);
  assert.equal(error.name, "AuthRetryableFetchError");
  assert.equal(error.status, 0);
  assert.equal(network.calls.length, 1);
  assert.equal(network.calls[0].init.signal.aborted, true);
});

test("proxy preserves temporary Auth failures for page retry while rejecting absent or invalid sessions", async (t) => {
  for (const [name, claims, error, redirect] of [
    ["authenticated", { sub: "user-id" }, null, false],
    ["anonymous", null, null, true],
    ["invalid token", null, { status: 401 }, true],
    ["retryable transport error", null, { name: "AuthRetryableFetchError" }, false],
    ["network failure", null, { status: 0 }, false],
    ["Auth outage", null, { status: 503 }, false],
  ]) {
    await t.test(name, async () => {
      const response = { cookies: { set() {} } };
      const serverFetch = () => assert.fail("Mocked claims must not issue network requests");
      const { updateSession } = loadTypeScript("lib/supabase/proxy.ts", {
        "@supabase/ssr": {
          createServerClient(url, key, config) {
            assert.equal(url, env.NEXT_PUBLIC_SUPABASE_URL);
            assert.equal(key, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
            assert.equal(config.global.fetch, serverFetch);
            assert.equal(config.db.retry, false);
            return { auth: { async getClaims() { return { data: claims ? { claims } : null, error }; } } };
          },
        },
        "next/server": {
          NextResponse: {
            next() { return response; },
            redirect(url) { return { destination: url.pathname }; },
          },
        },
        "../utils": { hasEnvVars: true },
        "./fetch": { serverFetch },
      }, { process: { env } });
      const result = await updateSession({
        cookies: { getAll() { return []; }, set() {} },
        nextUrl: { pathname: "/dashboard", clone() { return { pathname: "/dashboard" }; } },
      });
      if (redirect) assert.equal(result.destination, "/auth/login");
      else assert.equal(result, response);
    });
  }
});
