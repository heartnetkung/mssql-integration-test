const mssql = require("mssql");
const database = require("./database");
const util = require("./util");
const docker = require("./docker");
const wrapper = require("./object_wrapper");

var pool = null;
var dbName = null;
var adminPool = null;
var dbNameRaw = null;

const createPool = config => new mssql.ConnectionPool(config).connect();

const getConfig = () => {
	var config = util.getConfig();
	if (!config.server)
		config.server = config.useDocker ? docker.findDockerIp() : "127.0.0.1";
	if (!config.port) config.port = config.useDocker ? 1433 : 1444;
	return config;
};

exports.rawGetPool = async () => {
	return await createPool(getConfig());
};

exports.getPool = async () => {
	if (pool) return pool;

	var config = getConfig();
	var suffix = "_" + process.pid;
	adminPool = await createPool(config);
	dbName = await database.restore(adminPool, suffix);
	dbNameRaw = dbName.substr(0, dbName.length - suffix.length);

	var newConfig = Object.assign({}, config, { database: dbName });
	var temp = await createPool(newConfig);

	return (pool = wrapper(temp));
};

//warning foreign keys and indexes are not copied
exports.resetTables = async (pool, ...tables) => {
	for (var table of tables)
		await database.resetTable(pool, dbNameRaw + "_for_reset", table);
};

exports.resetDb = async pool => {
	if (!pool || !adminPool) throw new Error("Pool not yet initialized.");

	//close the previous connection so we can drop the database
	pool.close();

	//reset db data
	await database.drop(adminPool, dbName);
	await database.restore(adminPool, "_" + process.pid);

	//reconnect after restore
	var newConfig = Object.assign({}, getConfig(), { database: dbName });
	pool._realObj = await createPool(newConfig);
};

if (global.afterAll)
	afterAll(async () => {
		if (pool) pool.close();
		if (!adminPool) return;
		if (dbName) await database.drop(adminPool, dbName);
		adminPool.close();
	});
