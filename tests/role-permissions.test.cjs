/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScript(relativePath, imports = {}) {
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
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
  }, { filename });
  return loadedModule.exports;
}

const roles = loadTypeScript("lib/roles.ts");
const accountProfile = loadTypeScript("lib/account-profile.ts");
const actorId = "a1111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";
const classId = "33333333-3333-4333-8333-333333333333";
const otherClassId = "44444444-4444-4444-8444-444444444444";
const privateError = "private database connection details";

// Query fixtures return only rows matching the real query filters. A missing
// class_id/user_id filter therefore changes behavior instead of passing silently.
function sessionHarness(options = {}) {
  const calls = [];
  const user = Object.hasOwn(options, "user") ? options.user : { id: actorId };
  const classRows = options.missingClass ? [] : [{
    id: classId,
    code: "BSIS 2B-G2",
    academic_year: "2026-2027",
    term: "1st Semester",
  }];
  const rows = {
    app_admins: options.admin ? [{ user_id: user?.id }] : [],
    classes: [
      ...classRows,
      { id: otherClassId, code: "Other class", academic_year: "2026-2027", term: "1st Semester" },
    ],
    class_officers: options.officers ?? [],
    profiles: options.profiles ?? [],
  };
  const supabase = {
    auth: {
      async getUser() {
        calls.push({ type: "getUser" });
        if (options.throwAt === "auth") throw new Error(privateError);
        return { data: { user }, error: options.authError ?? null };
      },
    },
    from(table) {
      assert.ok(Object.hasOwn(rows, table), `Unexpected table: ${table}`);
      const filters = [];
      const call = { type: "query", table, filters };
      calls.push(call);
      return {
        select(columns) { call.columns = columns; return this; },
        eq(column, value) { filters.push([column, value]); return this; },
        async maybeSingle() {
          if (options.beforeQuery) await options.beforeQuery(table);
          if (options.throwAt === table) throw new Error(privateError);
          const matches = rows[table].filter((row) => filters.every(([column, value]) => row[column] === value));
          return {
            data: matches.length === 1 ? matches[0] : null,
            error: options.queryError === table ? { message: privateError }
              : table === "profiles" && options.profileColumnMissing && call.columns !== "full_name" ? { code: options.profileColumnMissing, message: privateError } : null,
          };
        },
      };
    },
    async rpc(name, parameters) {
      calls.push({ type: "rpc", name, parameters: JSON.parse(JSON.stringify(parameters)) });
      if (options.throwAt === "rpc") throw new Error(privateError);
      return { data: null, error: options.rpcError ?? null };
    },
  };
  const imports = {
    "server-only": {},
    // Outside an RSC render React.cache calls through without memoizing. These
    // cases exercise real authorization; the renderer test below covers cache.
    "react": require("react"),
    "@/lib/roles": roles,
    "@/lib/account-profile": accountProfile,
    "next/server": {
      async connection() { calls.push({ type: "connection" }); },
    },
    "next/navigation": {
      redirect(destination) {
        const error = new Error(`redirect:${destination}`);
        error.destination = destination;
        throw error;
      },
    },
    "@/lib/supabase/server": {
      async createClient() {
        calls.push({ type: "session" });
        if (options.throwAt === "session") throw new Error(privateError);
        return supabase;
      },
    },
    "next/cache": {
      revalidatePath(route, scope) { calls.push({ type: "revalidate", route, scope }); },
    },
  };
  return { calls, imports, supabase, user };
}

test("role parsing accepts only application roles and routes each role to its dashboard", () => {
  for (const [role, home] of [
    ["admin", "/dashboard"],
    ["president", "/officer"],
    ["secretary", "/officer"],
    ["student", "/student"],
  ]) {
    assert.equal(roles.isAppRole(role), true);
    assert.equal(roles.roleHome(role), home);
  }
  for (const value of ["Admin", "administrator", "owner", "__proto__", "", null, undefined, {}, 1]) {
    assert.equal(roles.isAppRole(value), false);
  }
});

test("access uses live authentication and initializes Supabase only after entering request time", async () => {
  const harness = sessionHarness({
    user: { id: actorId, user_metadata: { role: "admin" } },
  });
  const accessModule = loadTypeScript("lib/access.ts", harness.imports);
  const access = await accessModule.getUserAccess();
  assert.equal(access.role, "student", "user metadata must never grant permissions");
  assert.equal(access.classId, classId);
  assert.equal(access.classData.code, "BSIS 2B-G2");
  assert.equal(access.classData.academic_year, "2026-2027");
  assert.equal(access.classData.term, "1st Semester");
  assert.equal(access.supabase, harness.supabase);
  assert.deepEqual(harness.calls.slice(0, 3).map(({ type }) => type), ["connection", "session", "getUser"]);
});

test("administrator membership takes precedence over class office", async () => {
  const harness = sessionHarness({ admin: true, officers: [{ class_id: classId, user_id: actorId, role: "secretary" }] });
  const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
  assert.equal((await getUserAccess()).role, "admin");
  assert.equal(harness.calls.some(({ table }) => table === "class_officers"), false);
});

test("officer access is isolated to the current user and fixed workspace class", async (t) => {
  for (const role of ["president", "secretary"]) {
    await t.test(role, async () => {
      const harness = sessionHarness({ officers: [{ class_id: classId, user_id: actorId, role }] });
      const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
      const access = await getUserAccess();
      assert.equal(access.role, role);
      assert.equal(access.classId, classId);
      assert.deepEqual(harness.calls.find(({ table }) => table === "classes").filters, [
        ["code", "BSIS 2B-G2"], ["academic_year", "2026-2027"], ["term", "1st Semester"],
      ]);
      assert.deepEqual(harness.calls.find(({ table }) => table === "class_officers").filters, [
        ["class_id", classId], ["user_id", actorId],
      ]);
    });
  }
  for (const [name, officers] of [
    ["other class", [{ class_id: otherClassId, user_id: actorId, role: "president" }]],
    ["other user", [{ class_id: classId, user_id: targetId, role: "secretary" }]],
    ["unknown officer role", [{ class_id: classId, user_id: actorId, role: "admin" }]],
    ["no assignment", []],
  ]) {
    await t.test(name, async () => {
      const { getUserAccess } = loadTypeScript("lib/access.ts", sessionHarness({ officers }).imports);
      assert.equal((await getUserAccess()).role, "student");
    });
  }
});

test("a missing workspace class leaves an ordinary account as a student", async () => {
  const harness = sessionHarness({ missingClass: true, officers: [{ class_id: otherClassId, user_id: actorId, role: "president" }] });
  const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
  const access = await getUserAccess();
  assert.equal(access.role, "student");
  assert.equal(access.classId, null);
  assert.equal(harness.calls.some(({ table }) => table === "class_officers"), false);
});

test("authentication failures stop authorization queries", async (t) => {
  for (const [name, options] of [
    ["anonymous", { user: null }],
    ["rejected session", { authError: { message: privateError } }],
  ]) {
    await t.test(name, async () => {
      const harness = sessionHarness(options);
      const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
      assert.equal(await getUserAccess(), null);
      assert.equal(harness.calls.some(({ type }) => type === "query"), false);
    });
  }
});

test("temporary Auth outages fail closed without redirecting a valid session to login", async (t) => {
  for (const authError of [
    { name: "AuthRetryableFetchError", message: privateError },
    { status: 0, message: privateError },
    { status: 500, message: privateError },
    { status: 503, message: privateError },
  ]) {
    await t.test(authError.name ?? `status ${authError.status}`, async () => {
      const harness = sessionHarness({ authError });
      const { requireRole } = loadTypeScript("lib/access.ts", harness.imports);
      await assert.rejects(() => requireRole(["admin"]), (error) => {
        assert.match(error.message, /unable to verify your session/i);
        assert.equal(error.message.includes(privateError), false);
        assert.equal(error.destination, undefined);
        return true;
      });
      assert.equal(harness.calls.some(({ type }) => type === "query"), false);
    });
  }
});

test("administrator membership, workspace, and profile queries start together", async () => {
  const started = [];
  let release;
  const pendingQuery = new Promise((resolve) => { release = resolve; });
  const harness = sessionHarness({
    admin: true,
    async beforeQuery(table) {
      started.push(table);
      await pendingQuery;
    },
  });
  const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
  const pendingAccess = getUserAccess();
  try {
    await new Promise(setImmediate);
    assert.deepEqual(started.sort(), ["app_admins", "classes", "profiles"]);
  } finally {
    release();
    await pendingAccess;
  }
});

test("real RSC renders share authorization work but verify permissions again on the next request", () => {
  // A React Server Components renderer supplies the real request cache. A
  // process condition selects React's server entry point without changing the
  // ordinary React module used by the other test cases.
  const script = `
    const assert = require('node:assert/strict');
    const { readFileSync } = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const ts = require('typescript');
    const React = require('react');
    const { renderToReadableStream } = require('next/dist/compiled/react-server-dom-webpack/server.node');
    const loadTypeScript = ${loadTypeScript.toString()};
    const roles = loadTypeScript('lib/roles.ts');
    const accountProfile = loadTypeScript('lib/account-profile.ts');
    const actorId = ${JSON.stringify(actorId)};
    const targetId = ${JSON.stringify(targetId)};
    const classId = ${JSON.stringify(classId)};
    const otherClassId = ${JSON.stringify(otherClassId)};
    const privateError = ${JSON.stringify(privateError)};
    const sessionHarness = ${sessionHarness.toString()};
    const adminSession = sessionHarness({ admin: true, profiles: [{ id: actorId, first_name: 'Admin', last_name: 'Name', full_name: 'Old Name' }] });
    const studentSession = sessionHarness({ profiles: [{ id: actorId, first_name: 'Student', last_name: 'Name', full_name: 'Old Name' }] });
    let current = adminSession;
    let clientCalls = 0;
    const access = loadTypeScript('lib/access.ts', {
      ...adminSession.imports,
      '@/lib/supabase/server': { async createClient() { clientCalls++; return current.supabase; } },
    });
    async function Authorization() {
      const result = await access.getUserAccess();
      return React.createElement('span', null, result.role + ':' + result.displayName);
    }
    async function Guard() {
      const result = await access.requireRole(['admin', 'president', 'secretary', 'student']);
      return React.createElement('span', null, result.role);
    }
    async function render() {
      const errors = [];
      const stream = await renderToReadableStream(
        React.createElement(React.Fragment, null, React.createElement(Authorization), React.createElement(Guard)),
        {},
        { onError(error) { errors.push(error); } },
      );
      const output = await new Response(stream).text();
      assert.deepEqual(errors, []);
      return output;
    }
    (async () => {
      assert.match(await render(), /admin:Admin Name/);
      assert.equal(clientCalls, 1);
      assert.equal(adminSession.calls.filter(({ type }) => type === 'getUser').length, 1);
      assert.equal(adminSession.calls.filter(({ table }) => table === 'app_admins').length, 1);
      assert.equal(adminSession.calls.filter(({ table }) => table === 'profiles').length, 1);
      current = studentSession;
      assert.match(await render(), /student:Student Name/);
      assert.equal(clientCalls, 2);
      assert.equal(studentSession.calls.filter(({ type }) => type === 'getUser').length, 1);
      assert.equal(studentSession.calls.filter(({ table }) => table === 'app_admins').length, 1);
      assert.equal(studentSession.calls.filter(({ table }) => table === 'profiles').length, 1);
    })().catch((error) => { console.error(error); process.exitCode = 1; });
  `;
  const result = spawnSync(process.execPath, ["--conditions=react-server", "-e", script], {
    cwd: __dirname,
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("display names come from the current user's profile without granting any role", async () => {
  const harness = sessionHarness({
    user: { id: actorId, email: "student@school.edu", user_metadata: { role: "admin", full_name: "Metadata Name" } },
    profiles: [
      { id: actorId, first_name: "  李  ", middle_initial: "m.", last_name: " María ", full_name: "Old Name", role: "admin" },
      { id: targetId, full_name: "Another User" },
    ],
  });
  const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
  const access = await getUserAccess();
  assert.equal(access.displayName, "李 M. María");
  assert.equal(access.role, "student");
  assert.deepEqual(harness.calls.find(({ table }) => table === "profiles").filters, [["id", actorId]]);
});

test("older profile schemas fall back to legacy name columns until the name migration is applied", async (t) => {
  for (const profileColumnMissing of ["42703", "PGRST204"]) {
    await t.test(profileColumnMissing, async () => {
      const harness = sessionHarness({
        admin: true,
        user: { id: actorId, email: "admin@school.edu" },
        profileColumnMissing,
        profiles: [{ id: actorId, full_name: "  Legacy   Name " }],
      });
      const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
      const access = await getUserAccess();
      assert.equal(access.role, "admin");
      assert.equal(access.displayName, "Legacy Name");
      const queries = harness.calls.filter(({ table }) => table === "profiles");
      assert.equal(queries.length, 2);
      assert.match(queries[0].columns, /first_name/);
      assert.equal(queries[1].columns, "full_name");
      assert.deepEqual(queries.map(({ filters }) => filters), [[["id", actorId]], [["id", actorId]]]);
    });
  }
});

test("missing, invalid, and unavailable profile names use the email without changing permissions", async (t) => {
  for (const [name, options] of [
    ["missing profile", {}],
    ["blank name", { profiles: [{ id: actorId, full_name: "   " }] }],
    ["control characters", { profiles: [{ id: actorId, full_name: "Name\nInjected" }] }],
    ["profile belongs to another user", { profiles: [{ id: targetId, full_name: "Other Name" }] }],
    ["profile query error", { queryError: "profiles", profiles: [{ id: actorId, full_name: "Ignored Name" }] }],
    ["profile query exception", { throwAt: "profiles" }],
  ]) {
    await t.test(name, async () => {
      const harness = sessionHarness({
        user: { id: actorId, email: "student@school.edu", user_metadata: { full_name: "Ignored Metadata", role: "admin" } },
        ...options,
      });
      const { getUserAccess } = loadTypeScript("lib/access.ts", harness.imports);
      const access = await getUserAccess();
      assert.equal(access.displayName, "student@school.edu");
      assert.equal(access.role, "student");
    });
  }
});

test("failed membership or class queries fail closed instead of granting fallback access", async (t) => {
  for (const queryError of ["app_admins", "classes", "class_officers"]) {
    await t.test(queryError, async () => {
      const { getUserAccess } = loadTypeScript("lib/access.ts", sessionHarness({ queryError }).imports);
      await assert.rejects(getUserAccess, /Unable to verify/);
    });
  }
});

test("route guards allow officers' attendance access and redirect forbidden roles", async (t) => {
  for (const role of ["admin", "president", "secretary"]) {
    await t.test(`${role} attendance`, async () => {
      const options = role === "admin"
        ? { admin: true }
        : { officers: [{ class_id: classId, user_id: actorId, role }] };
      const { requireRole } = loadTypeScript("lib/access.ts", sessionHarness(options).imports);
      assert.equal((await requireRole(["admin", "president", "secretary"])).role, role);
    });
  }
  for (const [name, options, allowed, destination] of [
    ["anonymous", { user: null }, ["admin"], "/auth/login"],
    ["student attendance", {}, ["admin", "president", "secretary"], "/student"],
    ["student administration", {}, ["admin"], "/student"],
    ["president administration", { officers: [{ class_id: classId, user_id: actorId, role: "president" }] }, ["admin"], "/officer"],
    ["admin student page", { admin: true }, ["student"], "/dashboard"],
  ]) {
    await t.test(name, async () => {
      const { requireRole } = loadTypeScript("lib/access.ts", sessionHarness(options).imports);
      await assert.rejects(() => requireRole(allowed), (error) => error.destination === destination);
    });
  }
});

function roleForm(fields = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({ user_id: targetId, role: "student", ...fields })) {
    if (value !== undefined) form.set(name, value);
  }
  return form;
}

function roleActionHarness(options = {}) {
  const harness = sessionHarness({ admin: true, ...options });
  const { changeUserRole } = loadTypeScript("app/admin/users/actions.ts", harness.imports);
  return {
    ...harness,
    async run(fields) {
      const result = await changeUserRole({ success: false, message: "" }, roleForm(fields));
      assert.deepEqual(Object.keys(result).sort(), ["message", "success"]);
      assert.equal(result.message.includes(privateError), false, "service errors must remain private");
      if (!result.success) {
        assert.equal(harness.calls.some(({ type }) => type === "revalidate"), false);
      }
      return result;
    },
  };
}

function assertNoRoleWrite(harness) {
  assert.equal(harness.calls.some(({ type }) => type === "rpc"), false);
}

test("only live authenticated administrator membership can reach role updates", async (t) => {
  for (const [name, options, message] of [
    ["anonymous", { user: null }, /sign in/i],
    ["authentication error", { authError: { message: privateError } }, /sign in/i],
    ["ordinary account", { admin: false }, /administrator access/i],
    ["officer", { admin: false, officers: [{ class_id: classId, user_id: actorId, role: "president" }] }, /administrator access/i],
    ["forged metadata", { admin: false, user: { id: actorId, user_metadata: { role: "admin" } } }, /administrator access/i],
    ["membership query failure", { queryError: "app_admins" }, /administrator access/i],
  ]) {
    await t.test(name, async () => {
      const harness = roleActionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assertNoRoleWrite(harness);
      assert.equal(harness.calls.some(({ table }) => table === "classes"), false);
    });
  }
});

test("invalid target or role inputs stop before class lookup and role mutation", async (t) => {
  for (const [name, fields, message] of [
    ["missing target", { user_id: undefined }, /valid user account/i],
    ["non-UUID target", { user_id: "user-id" }, /valid user account/i],
    ["UUID with whitespace", { user_id: ` ${targetId}` }, /valid user account/i],
    ["binary target", { user_id: new Blob([targetId]) }, /valid user account/i],
    ["missing role", { role: undefined }, /valid account role/i],
    ["unknown role", { role: "owner" }, /valid account role/i],
    ["prototype property role", { role: "__proto__" }, /valid account role/i],
    ["incorrect case role", { role: "Admin" }, /valid account role/i],
    ["binary role", { role: new Blob(["admin"]) }, /valid account role/i],
    ["own account", { user_id: actorId, role: "student" }, /own role/i],
    ["own account uppercase UUID", { user_id: actorId.toUpperCase(), role: "student" }, /own role/i],
  ]) {
    await t.test(name, async () => {
      const harness = roleActionHarness();
      const result = await harness.run(fields);
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assertNoRoleWrite(harness);
      assert.equal(harness.calls.some(({ table }) => table === "classes"), false);
    });
  }
});

test("unavailable workspace class prevents role writes", async (t) => {
  for (const [name, options] of [
    ["missing class", { missingClass: true }],
    ["class query error", { queryError: "classes" }],
  ]) {
    await t.test(name, async () => {
      const harness = roleActionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, /class could not be found/i);
      assertNoRoleWrite(harness);
    });
  }
});

test("role changes use the signed-in session RPC and fixed workspace, then refresh authorization", async (t) => {
  for (const role of ["admin", "president", "secretary", "student"]) {
    await t.test(role, async () => {
      const harness = roleActionHarness();
      const result = await harness.run({ role, class_id: otherClassId, actor_id: targetId });
      assert.equal(result.success, true);
      assert.match(result.message, new RegExp(roles.ROLE_LABELS[role]));
      assert.deepEqual(harness.calls.filter(({ type }) => type === "rpc"), [{
        type: "rpc",
        name: "set_class_user_role",
        parameters: { p_user_id: targetId, p_class_id: classId, p_role: role },
      }]);
      assert.deepEqual(harness.calls.find(({ table }) => table === "app_admins").filters, [["user_id", actorId]]);
      assert.deepEqual(harness.calls.filter(({ type }) => type === "revalidate"), [{
        type: "revalidate", route: "/", scope: "layout",
      }]);
      assert.equal(harness.calls.at(-1).type, "revalidate");
    });
  }
});

test("RPC failures give actionable errors without claiming a role was changed", async (t) => {
  for (const [code, message] of [
    ["PGRST202", /not configured|database update/i],
    ["42883", /not configured|database update/i],
    ["42501", /administrator access|sign in/i],
    ["P0002", /no longer exists/i],
    ["23503", /no longer exists/i],
    ["23505", /unable to change/i],
    ["unexpected_failure", /unable to change/i],
  ]) {
    await t.test(code, async () => {
      const harness = roleActionHarness({ rpcError: { code, message: privateError } });
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assert.equal(harness.calls.at(-1).type, "rpc");
    });
  }
});

test("unexpected authorization and database exceptions do not expose internal details", async (t) => {
  for (const throwAt of ["session", "auth", "app_admins", "classes", "rpc"]) {
    await t.test(throwAt, async () => {
      const harness = roleActionHarness({ throwAt });
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, /could not be confirmed/i);
      if (throwAt !== "rpc") assertNoRoleWrite(harness);
    });
  }
});
