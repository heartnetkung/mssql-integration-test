const { execute, getConfig } = require("./util");

exports.drop = async (pool, name) => {
	var sql = `DROP DATABASE ${name}`;
	return await execute(pool, sql);
};

const dumpPath = () => {
	var config = getConfig();
	if (config.sqlDumpPath) return config.sqlDumpPath;
	if (config.useDocker) return "/tmp/dump.bak";
	return "C:\\\\Users\\\\Public\\\\dump.bak";
};

const dataPath = () => {
	var config = getConfig();
	if (config.sqlDataPath) return config.sqlDataPath;
	if (config.useDocker) return "/var/opt/mssql/data/";
	return "C:\\\\Program Files\\\\Microsoft SQL Server\\\\MSSQL14.SQLEXPRESS\\\\MSSQL\\\\DATA\\\\";
};

exports.backup = async (pool, name) => {
	var sql = `BACKUP DATABASE ${name} TO DISK = '${dumpPath()}' WITH COPY_ONLY`;
	return await execute(pool, sql);
};

const restore = (name, mdf, ldf) => `
RESTORE DATABASE ${name}
FROM DISK = '${dumpPath()}'
WITH MOVE '${mdf}' TO '${dataPath()}${name}.mdf',
MOVE '${ldf}' TO '${dataPath()}${name}_log.ldf',
REPLACE`;

exports.restore = async (pool, suffix) => {
	var restoreParamSql = `RESTORE FILELISTONLY FROM DISK = '${dumpPath()}'`;
	var [p0, p1] = await execute(pool, restoreParamSql);

	var newDbName = p0.LogicalName + suffix;
	var restoreSql = restore(newDbName, p0.LogicalName, p1.LogicalName);
	await execute(pool, restoreSql);
	return newDbName;
};

exports.resetTable = async (pool, backup, table) => {
	var sql = `
DELETE FROM ${table};
INSERT INTO ${table} SELECT * FROM ${backup}.dbo.${table}`;
	return await execute(pool, sql);
};

exports.dumpPath = dumpPath;
