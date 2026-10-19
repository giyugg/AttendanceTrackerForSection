/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Run the real TypeScript modules with isolated external services. No credentials
// or live Supabase project are needed for authorization and validation checks.
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
    Buffer,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    ...globals,
  }, { filename });
  return loadedModule.exports;
}

const validation = loadTypeScript("lib/account-validation.ts");
const accountProfile = loadTypeScript("lib/account-profile.ts");
const temporaryPassword = "Private-temp-password-42!";
const fullName = "María C. Dela Cruz";

function accountForm(fields = {}) {
  const form = new FormData();
  const values = {
    first_name: "María",
    middle_initial: "C",
    last_name: "Dela Cruz",
    email: "student@ms.bulsu.edu.ph",
    password: temporaryPassword,
    verified_request: "on",
    ...fields,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) form.set(key, value);
  }
  return form;
}

function actionHarness(options = {}) {
  const calls = [];
  const user = Object.hasOwn(options, "user") ? options.user : { id: "admin-id" };
  const action = loadTypeScript("app/admin/accounts/actions.ts", {
    "@/lib/account-validation": validation,
    "@/lib/account-profile": accountProfile,
    "next/cache": {
      revalidatePath(route) {
        calls.push({ type: "revalidate", route });
      },
    },
    "@/lib/supabase/server": {
      async createClient() {
        calls.push({ type: "session" });
        if (options.throwAt === "session") throw new Error(temporaryPassword);
        return {
          auth: {
            async getUser() {
              calls.push({ type: "getUser" });
              return { data: { user }, error: options.authError ?? null };
            },
          },
          from(table) {
            calls.push({ type: "membership", table });
            assert.equal(table, "app_admins");
            return {
              select(columns) {
                assert.equal(columns, "user_id");
                return this;
              },
              eq(column, value) {
                assert.equal(column, "user_id");
                assert.equal(value, user.id);
                return this;
              },
              async maybeSingle() {
                if (options.throwAt === "membership") throw new Error(temporaryPassword);
                return {
                  data: options.isAdmin === false ? null : { user_id: user.id },
                  error: options.membershipError ?? null,
                };
              },
            };
          },
        };
      },
    },
    "@/lib/supabase/admin": {
      createAdminClient() {
        calls.push({ type: "adminFactory" });
        if (options.throwAt === "adminFactory") throw new Error(temporaryPassword);
        if (options.missingConfig) return null;
        return {
          auth: {
            admin: {
              async createUser(input) {
                calls.push({ type: "createUser", input: JSON.parse(JSON.stringify(input)) });
                if (options.throwAt === "createUser") throw new Error(temporaryPassword);
                return {
                  data: { user: options.missingCreatedUser ? null : { id: "new-user-id" } },
                  error: options.apiError ?? null,
                };
              },
            },
          },
          from(table) {
            assert.equal(table, "profiles");
            return {
              async upsert(input, config) {
                calls.push({ type: "saveProfile", table, input: JSON.parse(JSON.stringify(input)), config: JSON.parse(JSON.stringify(config)) });
                if (options.throwAt === "saveProfile") throw new Error(temporaryPassword);
                return { data: null, error: options.profileError ?? null };
              },
            };
          },
        };
      },
    },
  });

  return {
    calls,
    async run(fields) {
      const result = await action.createAccount(
        { success: false, message: "" },
        accountForm(fields),
      );
      assert.deepEqual(Object.keys(result).sort(), ["message", "success"]);
      assert.equal(JSON.stringify(result).includes(temporaryPassword), false);
      if (!result.success) {
        assert.equal(calls.some(({ type }) => type === "revalidate"), false);
      }
      return result;
    },
  };
}

function assertNoPrivilegedClient(harness) {
  assert.equal(harness.calls.some(({ type }) => type === "adminFactory"), false);
  assert.equal(harness.calls.some(({ type }) => type === "createUser"), false);
  assert.equal(harness.calls.some(({ type }) => type === "saveProfile"), false);
}

test("only authenticated administrators reach the privileged client", async (t) => {
  for (const [name, options, expectedMessage] of [
    ["anonymous", { user: null }, /sign in/i],
    ["authentication error", { authError: { message: "JWT rejected" } }, /sign in/i],
    ["ordinary user", { isAdmin: false }, /administrator access/i],
    ["class officer without admin membership", { user: { id: "officer-id" }, isAdmin: false }, /administrator access/i],
    ["membership query error", { membershipError: { message: "permission denied" } }, /administrator access/i],
  ]) {
    await t.test(name, async () => {
      const harness = actionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, expectedMessage);
      assertNoPrivilegedClient(harness);
      if (options.user === null || options.authError) {
        assert.equal(harness.calls.some(({ type }) => type === "membership"), false);
      }
    });
  }
});

test("invalid educational email inputs fail before privileged client creation", async (t) => {
  for (const email of [
    undefined,
    "student@gmail.com",
    "student@school.edu.evil.com",
    "student@school.edu.ph.evil.com",
    "student@fakedu.ph",
    "student@edu.ph",
    "student@-school.edu",
    "student@school-.edu.ph",
    ".student@school.edu",
    "student..name@school.edu",
    "student@@school.edu",
    "a".repeat(65) + "@school.edu",
    new Blob(["student@school.edu"]),
  ]) {
    await t.test(String(email), async () => {
      const harness = actionHarness();
      const result = await harness.run({ email });
      assert.equal(result.success, false);
      assert.match(result.message, /educational email/i);
      assertNoPrivilegedClient(harness);
    });
  }
});

test("password and verified request checks run before privileged operations", async (t) => {
  for (const [name, fields, message] of [
    ["missing password", { password: undefined }, /at least 8/i],
    ["short password", { password: "1234567" }, /at least 8/i],
    ["non-text password", { password: new Blob([temporaryPassword]) }, /at least 8/i],
    ["over 72 ASCII bytes", { password: "a".repeat(73) }, /too long/i],
    ["over 72 UTF-8 bytes", { password: "é".repeat(37) }, /too long/i],
    ["missing verification", { verified_request: undefined }, /verify the account request/i],
    ["incorrect verification value", { verified_request: "true" }, /verify the account request/i],
  ]) {
    await t.test(name, async () => {
      const harness = actionHarness();
      const result = await harness.run(fields);
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assertNoPrivilegedClient(harness);
    });
  }
});

test("account creation validates separate name fields before constructing the privileged client", async (t) => {
  for (const fields of [
    { first_name: undefined }, { last_name: undefined },
    { first_name: "" }, { last_name: "   " },
    { first_name: "x".repeat(81) }, { last_name: "x".repeat(81) },
    { first_name: "Name\nInjected" }, { last_name: "Name\u0000Injected" },
    { first_name: new Blob([fullName]) }, { middle_initial: new Blob(["C"]) },
    { middle_initial: "CC" }, { middle_initial: "7" }, { middle_initial: "Ç" },
    { first_name: "a".repeat(80), last_name: "b".repeat(80) },
    { first_name: undefined, last_name: undefined, full_name: "Injected single name" },
  ]) {
    await t.test(JSON.stringify(fields), async () => {
      const harness = actionHarness();
      const result = await harness.run(fields);
      assert.equal(result.success, false);
      assert.match(result.message, /name/i);
      assertNoPrivilegedClient(harness);
      assert.equal(harness.calls.some(({ type }) => type === "saveProfile"), false);
    });
  }
});

test("account creation allows an absent middle initial and derives the compatibility name", async (t) => {
  for (const middle_initial of [undefined, "", " "]) {
    await t.test(JSON.stringify({ middle_initial }), async () => {
      const harness = actionHarness();
      const result = await harness.run({ middle_initial, full_name: "Ignored single field" });
      assert.equal(result.success, true);
      const metadata = harness.calls.find(({ type }) => type === "createUser").input.user_metadata;
      assert.deepEqual(metadata, { first_name: "María", middle_initial: "", last_name: "Dela Cruz", full_name: "María Dela Cruz" });
      assert.deepEqual(harness.calls.find(({ type }) => type === "saveProfile").input, {
        id: "new-user-id", ...metadata,
      });
    });
  }
});

test("creation uses the verified normalized email and grants no application roles", async (t) => {
  for (const password of [temporaryPassword, "a".repeat(8), "a".repeat(72), "é".repeat(36)]) {
    await t.test(`${Buffer.byteLength(password)} byte password`, async () => {
      const harness = actionHarness();
      const result = await harness.run({ email: "  Student@MS.BulSU.EDU.PH  ", password, first_name: "  María  ", middle_initial: " c. ", last_name: "  Dela   Cruz  ", full_name: "Ignored injected name", role: "admin" });
      assert.equal(result.success, true);
      assert.match(result.message, /student@ms\.bulsu\.edu\.ph/);
      assert.equal(result.message.includes(password), false);
      assert.deepEqual(harness.calls.map(({ type }) => type), [
        "session", "getUser", "membership", "adminFactory", "createUser", "saveProfile", "revalidate",
      ]);
      assert.deepEqual(harness.calls.find(({ type }) => type === "createUser").input, {
        email: "student@ms.bulsu.edu.ph",
        password,
        email_confirm: true,
        user_metadata: { first_name: "María", middle_initial: "C", last_name: "Dela Cruz", full_name: fullName },
      });
      assert.deepEqual(harness.calls.find(({ type }) => type === "saveProfile"), {
        type: "saveProfile", table: "profiles", input: { id: "new-user-id", first_name: "María", middle_initial: "C", last_name: "Dela Cruz", full_name: fullName }, config: { onConflict: "id" },
      });
      assert.deepEqual(harness.calls.at(-1), { type: "revalidate", route: "/admin/users" });
    });
  }
});

test("failed profile saves preserve a confirmed created account and never create it twice", async (t) => {
  for (const options of [
    { profileError: { message: temporaryPassword } },
    { throwAt: "saveProfile" },
  ]) {
    await t.test(JSON.stringify(options), async () => {
      const harness = actionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, true);
      assert.match(result.message, /account created/i);
      assert.match(result.message, /name/i);
      assert.match(result.message, /save|update|edit/i);
      assert.equal(harness.calls.filter(({ type }) => type === "createUser").length, 1);
      assert.equal(harness.calls.filter(({ type }) => type === "saveProfile").length, 1);
      assert.equal(harness.calls.filter(({ type }) => type === "revalidate").length, 1);
    });
  }
});

test("missing service configuration prevents user creation", async () => {
  const harness = actionHarness({ missingConfig: true });
  const result = await harness.run();
  assert.equal(result.success, false);
  assert.match(result.message, /unavailable/i);
  assert.equal(harness.calls.at(-1).type, "adminFactory");
});

test("Supabase errors produce safe actionable messages", async (t) => {
  for (const [code, message] of [
    ["email_exists", /already exists/i],
    ["user_already_exists", /already exists/i],
    ["weak_password", /stronger password/i],
    ["unexpected_failure", /unable to create/i],
  ]) {
    await t.test(code, async () => {
      const harness = actionHarness({ apiError: { code, message: temporaryPassword } });
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assert.equal(harness.calls.at(-1).type, "createUser");
    });
  }
});

test("unconfirmed outcomes and service exceptions do not expose secrets", async (t) => {
  for (const options of [
    { missingCreatedUser: true },
    { throwAt: "session" },
    { throwAt: "membership" },
    { throwAt: "adminFactory" },
    { throwAt: "createUser" },
  ]) {
    await t.test(JSON.stringify(options), async () => {
      const harness = actionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, /could not be confirmed/i);
      if (["session", "membership"].includes(options.throwAt)) {
        assertNoPrivilegedClient(harness);
      }
    });
  }
});

test("educational email validation respects complete domain boundaries", () => {
  for (const email of ["student@university.edu", "student@ms.bulsu.edu.ph", "STUDENT@SCHOOL.EDU.AU"]) {
    assert.equal(validation.isEducationalEmail(email), true, email);
  }
  for (const email of ["a@school.education", "a@school.edu.phish", "a@school.edu.ph.com", "a@school.edu..ph", "a@school.edu.p", "a@school.edu.ph ", `${"a".repeat(64)}@${"school.".repeat(30)}edu`]) {
    assert.equal(validation.isEducationalEmail(email), false, email);
  }
});

test("admin client requires both configuration values and disables session persistence", () => {
  const serverFetch = () => assert.fail("Client factory must not issue a request");
  for (const env of [
    {},
    { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" },
    { SUPABASE_SERVICE_ROLE_KEY: "service-role-placeholder" },
  ]) {
    const { createAdminClient } = loadTypeScript("lib/supabase/admin.ts", {
      "server-only": {},
      "./fetch": { serverFetch },
      "@supabase/supabase-js": {
        createClient() { assert.fail("Incomplete configuration must not create a client"); },
      },
    }, { process: { env } });
    assert.equal(createAdminClient(), null);
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-placeholder",
  };
  const sentinel = {};
  let clientCalls = 0;
  const { createAdminClient } = loadTypeScript("lib/supabase/admin.ts", {
    "server-only": {},
    "./fetch": { serverFetch },
    "@supabase/supabase-js": {
      createClient(url, key, config) {
        clientCalls += 1;
        assert.equal(url, env.NEXT_PUBLIC_SUPABASE_URL);
        assert.equal(key, env.SUPABASE_SERVICE_ROLE_KEY);
        assert.equal(config.global.fetch, serverFetch);
        assert.deepEqual(JSON.parse(JSON.stringify(config)), {
          global: {},
          db: { retry: false },
          auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        });
        return sentinel;
      },
    },
  }, { process: { env } });
  assert.equal(createAdminClient(), sentinel);
  assert.equal(clientCalls, 1);
});
