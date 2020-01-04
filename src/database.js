const { execute } = require("./util");

exports.drop = async (pool, name) => {
	var sql = `DROP DATABASE ${name}`;
	return await execute(pool, sql);
};

exports.backup = async (pool, name) => {
	var sql = `BACKUP DATABASE ${name} TO DISK = '/tmp/dump.bak' WITH COPY_ONLY`;
	return await execute(pool, sql);
};

const restore = (name, mdf, ldf) => `
RESTORE DATABASE ${name}
FROM DISK = '/tmp/dump.bak'
WITH MOVE '${mdf}' TO '/var/opt/mssql/data/${name}.mdf',
MOVE '${ldf}' TO '/var/opt/mssql/data/${name}_log.ldf',
REPLACE`;

exports.restore = async (pool, suffix) => {
	var restoreParamSql = `RESTORE FILELISTONLY FROM DISK = '/tmp/dump.bak'`;
	var [p0, p1] = await execute(pool, restoreParamSql);

	var newDbName = p0.LogicalName + suffix;
	await execute(pool, restore(newDbName, p0.LogicalName, p1.LogicalName));
	return newDbName;
};
