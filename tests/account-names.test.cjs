/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScript(relativePath, imports = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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

const profile = loadTypeScript("lib/account-profile.ts");
const actorId = "a1111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";
const privateError = "private database access details";

test("separate names retain Unicode and punctuation and normalize spaces and middle initials", () => {
  for (const [input, expected, formatted] of [
    [{ firstName: "  María   Clara  ", middleInitial: " c. ", lastName: "  Dela   Cruz " }, { firstName: "María Clara", middleInitial: "C", lastName: "Dela Cruz" }, "María Clara C. Dela Cruz"],
    [{ firstName: "李\u00a0\u00a0明", middleInitial: "", lastName: "王" }, { firstName: "李 明", middleInitial: "", lastName: "王" }, "李 明 王"],
    [{ firstName: "Anne-Marie", middleInitial: undefined, lastName: "D'Angelo-Santos, Jr." }, { firstName: "Anne-Marie", middleInitial: "", lastName: "D'Angelo-Santos, Jr." }, "Anne-Marie D'Angelo-Santos, Jr."],
    [{ firstName: "A", middleInitial: null, lastName: "B" }, { firstName: "A", middleInitial: "", lastName: "B" }, "A B"],
    [{ firstName: "  " + "A".repeat(80) + "  ", middleInitial: "b", lastName: "C" }, { firstName: "A".repeat(80), middleInitial: "B", lastName: "C" }, "A".repeat(80) + " B. C"],
  ]) {
    const result = profile.normalizeNameParts(input);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), expected);
    assert.equal(profile.formatAccountName(result), formatted);
  }
});

test("first and last names reject absent, nontext, blank, oversized, and control-character input", () => {
  const valid = { firstName: "María", middleInitial: "C", lastName: "Dela Cruz" };
  for (const value of [
    undefined, null, 42, {}, [], "", " \u00a0 ", "A".repeat(81),
    "Name\u0000Injected", "Name\nInjected", "Name\rInjected", "Name\tInjected", "Name\u007fInjected", "Name\u0085Injected",
  ]) {
    for (const field of ["firstName", "lastName"]) {
      assert.equal(profile.normalizeNameParts({ ...valid, [field]: value }), null, `${field}: ${JSON.stringify(value)}`);
    }
  }
  assert.equal(profile.normalizeNameParts({ ...valid, firstName: "A".repeat(80), lastName: "B".repeat(80) }), null);
});

test("the optional middle initial accepts only one ASCII letter with an optional period", () => {
  const valid = { firstName: "María", lastName: "Dela Cruz" };
  for (const middleInitial of [undefined, null, "", "  "]) {
    assert.equal(profile.normalizeNameParts({ ...valid, middleInitial }).middleInitial, "");
  }
  for (const middleInitial of ["c", " C ", "c.", " C. "]) {
    assert.equal(profile.normalizeNameParts({ ...valid, middleInitial }).middleInitial, "C");
  }
  for (const middleInitial of ["CC", "C..", ".C", "7", "Ç", "C\n", {}, 7]) {
    assert.equal(profile.normalizeNameParts({ ...valid, middleInitial }), null, JSON.stringify(middleInitial));
  }
});

test("display labels prefer separate name fields, then a legacy name, then the email or Account", () => {
  assert.equal(profile.accountDisplayName({ first_name: "  María  ", middle_initial: "c", last_name: "  Dela   Cruz ", full_name: "Old Name" }, "student@school.edu"), "María C. Dela Cruz");
  assert.equal(profile.accountDisplayName({ first_name: "María", last_name: "Dela Cruz" }, "student@school.edu"), "María Dela Cruz");
  assert.equal(profile.accountDisplayName({ first_name: "", last_name: "", full_name: "  María   Clara " }, "student@school.edu"), "María Clara");
  for (const fullName of [undefined, null, " ", "Name\nInjected", "A".repeat(121), {}]) {
    assert.equal(profile.accountDisplayName({ full_name: fullName }, "  student@school.edu  "), "student@school.edu");
  }
  for (const email of [undefined, null, "", " "]) {
    assert.equal(profile.accountDisplayName(null, email), "Account");
  }
});

function nameForm(fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ user_id: targetId, first_name: "  María  ", middle_initial: " c. ", last_name: " Dela   Cruz ", ...fields })) {
    if (value !== undefined) form.set(key, value);
  }
  return form;
}

function actionHarness(options = {}) {
  const calls = [];
  const user = Object.hasOwn(options, "user") ? options.user : { id: actorId };
  const supabase = {
    auth: {
      async getUser() {
        calls.push({ type: "getUser" });
        if (options.throwAt === "auth") throw new Error(privateError);
        return { data: { user }, error: options.authError ?? null };
      },
    },
    from(table) {
      assert.ok(["app_admins", "profiles"].includes(table), `Unexpected table: ${table}`);
      const call = { type: table === "app_admins" ? "membership" : "profile", table, filters: [] };
      calls.push(call);
      return {
        select(columns) { call.columns = columns; return this; },
        eq(column, value) { call.filters.push([column, value]); return this; },
        update(payload) {
          assert.equal(table, "profiles", "only the display profile may be changed");
          call.payload = JSON.parse(JSON.stringify(payload));
          return this;
        },
        async maybeSingle() {
          if (options.throwAt === table) throw new Error(privateError);
          if (table === "app_admins") {
            return {
              data: options.admin === false ? null : { user_id: user.id },
              error: options.membershipError ?? null,
            };
          }
          return {
            data: options.missingProfile ? null : { id: call.filters.find(([column]) => column === "id")?.[1] },
            error: options.profileError ?? null,
          };
        },
      };
    },
  };
  const { updateAccountName } = loadTypeScript("app/admin/users/name-actions.ts", {
    "@/lib/account-profile": profile,
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
  });
  return {
    calls,
    async run(fields) {
      const result = await updateAccountName({ success: false, message: "" }, nameForm(fields));
      assert.deepEqual(Object.keys(result).sort(), ["message", "success"]);
      assert.equal(JSON.stringify(result).includes(privateError), false);
      if (!result.success) assert.equal(calls.some(({ type }) => type === "revalidate"), false);
      return result;
    },
  };
}

function assertNoProfileWrite(harness) {
  assert.equal(harness.calls.some(({ table }) => table === "profiles"), false);
}

test("live administrator membership is required before an account name can be changed", async (t) => {
  for (const [name, options, message] of [
    ["anonymous", { user: null }, /sign in/i],
    ["Auth failure", { authError: { message: privateError } }, /sign in/i],
    ["student", { admin: false }, /administrator access/i],
    ["metadata claims administrator", { admin: false, user: { id: actorId, user_metadata: { role: "admin" } } }, /administrator access/i],
    ["membership query failure", { membershipError: { message: privateError } }, /administrator access/i],
  ]) {
    await t.test(name, async () => {
      const harness = actionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assertNoProfileWrite(harness);
      if (options.user === null || options.authError) {
        assert.equal(harness.calls.some(({ type }) => type === "membership"), false);
      }
    });
  }
});

test("invalid account identifiers and names never reach a profile write", async (t) => {
  const cases = [
    ...[undefined, "", "not-a-uuid", targetId + "' OR true", new Blob([targetId])].map((user_id) => [{ user_id }, /valid user account/i]),
    ...["first_name", "last_name"].flatMap((field) => [undefined, "", " ", "A".repeat(81), "Name\nInjected", new Blob(["Name"])].map((value) => [{ [field]: value }, /name/i])),
    ...["CC", "Ç", "1", new Blob(["C"])].map((middle_initial) => [{ middle_initial }, /initial|name/i]),
    [{ first_name: undefined, last_name: undefined, full_name: "Injected single field" }, /name/i],
    [{ first_name: "A".repeat(80), last_name: "B".repeat(80) }, /name/i],
  ];
  for (const [fields, message] of cases) {
    await t.test(JSON.stringify(fields), async () => {
      const harness = actionHarness();
      const result = await harness.run(fields);
      assert.equal(result.success, false);
      assert.match(result.message, message);
      assertNoProfileWrite(harness);
    });
  }
});

test("admins may edit their own name or another account name without updating roles or login identity", async (t) => {
  for (const userId of [actorId, targetId]) {
    await t.test(userId === actorId ? "own account" : "another account", async () => {
      const harness = actionHarness();
      const result = await harness.run({
        user_id: userId,
        first_name: "  李  ",
        middle_initial: "m.",
        last_name: "  María  ",
        full_name: "Ignored injected single name",
        role: "admin",
        email: "injected@school.edu",
        user_metadata: '{"role":"admin"}',
      });
      assert.equal(result.success, true);
      assert.match(result.message, /name saved/i);
      assert.deepEqual(harness.calls, [
        { type: "session" },
        { type: "getUser" },
        { type: "membership", table: "app_admins", filters: [["user_id", actorId]], columns: "user_id" },
        { type: "profile", table: "profiles", filters: [["id", userId]], columns: "id", payload: { first_name: "李", middle_initial: "M", last_name: "María", full_name: "李 M. María" } },
        { type: "revalidate", route: "/", scope: "layout" },
      ]);
    });
  }
});

test("missing profiles and failed writes return safe errors without claiming success", async (t) => {
  for (const [name, options, message] of [
    ["target disappeared", { missingProfile: true }, /profile could not be found/i],
    ["database rejected write", { profileError: { code: "42501", message: privateError } }, /unable to save/i],
    ["new columns not applied", { profileError: { code: "42703", message: privateError } }, /database update|database.*migration/i],
    ["schema cache missing new columns", { profileError: { code: "PGRST204", message: privateError } }, /database update|database.*migration/i],
    ...["session", "auth", "app_admins", "profiles"].map((throwAt) => [`exception in ${throwAt}`, { throwAt }, /could not be confirmed/i]),
  ]) {
    await t.test(name, async () => {
      const harness = actionHarness(options);
      const result = await harness.run();
      assert.equal(result.success, false);
      assert.match(result.message, message);
      if (["session", "auth", "app_admins"].includes(options.throwAt)) assertNoProfileWrite(harness);
    });
  }
});
