const init = require("../src/index");
const { execute, setConfig } = require("../src/util");

exports.run = () => {
	it("access the correct database", async () => {
		try {
			var pool = await init.getPool();
			var data = await execute(pool, "SELECT DB_NAME() AS current_db");
			expect(data[0].current_db).toEqual("tor_" + process.pid);
		} catch (e) {
			console.log(e);
			fail();
		}
	});

	it("get/set data", async () => {
		var pool = await init.getPool();
		var get1 = await execute(pool, "SELECT * FROM SQLTest");

		await execute(pool, "INSERT INTO SQLTest (ID, c1) VALUES (8, 'test8')");
		var get2 = await execute(pool, "SELECT * FROM SQLTest");
		expect(get2.length).toBe(get1.length + 1);

		await init.resetTables(pool, "SQLTest");
		var get3 = await execute(pool, "SELECT * FROM SQLTest");
		expect(get3.length).toBe(get1.length);

		await execute(pool, "INSERT INTO SQLTest (ID, c1) VALUES (9, 'test9')");
		await init.resetDb(pool);
		var get4 = await execute(pool, "SELECT * FROM SQLTest");
		expect(get3.length).toBe(get4.length);
	});

	it("number of databases stay the same", async () => {
		var pool = await init.getPool();
		var get1 = await execute(pool, "SELECT name FROM sys.databases");
		expect(get1.length < 10).toBe(true);
	});
};
