const mssql = require("mssql");
const database = require("./src/database");
const docker = require("./src/docker");
const rootPath = require("app-root-path").path;
const { join } = require("path");

const DB_CONFIG = {
	user: "SA",
	password: "yourStrong(!)Password",
	server: "172.17.0.1"
};

var pool = null;
var dbName = null;
var adminPool = null;

const createPool = config => new mssql.ConnectionPool(config).connect();

const assignConfig = () => {
	try {
		var packageJson = require(join(rootPath, "package.json"));
		var newConfig = (packageJson && packageJson.mssqlIntegrationTest) || {};
		Object.assign(DB_CONFIG, newConfig);
	} catch (e) {}
};

exports.getPool = async () => {
	if (pool) return pool;

	//check if the docker has started or throw
	docker.findDockerId();

	assignConfig();
	adminPool = await createPool(DB_CONFIG);
	dbName = await database.restore(adminPool, "_" + process.pid);

	var config = Object.assign({}, DB_CONFIG, { database: dbName });
	return (pool = await createPool(config));
};

afterAll(async () => {
	if (pool) pool.close();
	if (!adminPool) return;
	if (dbName) await database.drop(adminPool, dbName);
	adminPool.close();
});
