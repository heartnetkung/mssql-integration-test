const mssql = require("mssql");
const database = require("./database");
const util = require("./util");

var pool = null;
var dbName = null;
var adminPool = null;

const createPool = config => new mssql.ConnectionPool(config).connect();

exports.getPool = async () => {
	if (pool) return pool;

	var config = util.getConfig();
	adminPool = await createPool(config);
	dbName = await database.restore(adminPool, "_" + process.pid);

	var newConfig = Object.assign({}, DB_CONFIG, { database: dbName });
	return (pool = await createPool(newConfig));
};

afterAll(async () => {
	if (pool) pool.close();
	if (!adminPool) return;
	if (dbName) await database.drop(adminPool, dbName);
	adminPool.close();
});
