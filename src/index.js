const mssql = require("mssql");
const database = require("./database");
const util = require("./util");
const docker = require("./docker");

var pool = null;
var dbName = null;
var adminPool = null;

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
	adminPool = await createPool(config);
	dbName = await database.restore(adminPool, "_" + process.pid);

	var newConfig = Object.assign({}, config, { database: dbName });
	return (pool = await createPool(newConfig));
};

if (global.afterAll)
	afterAll(async () => {
		if (pool) pool.close();
		if (!adminPool) return;
		if (dbName) await database.drop(adminPool, dbName);
		adminPool.close();
	});
