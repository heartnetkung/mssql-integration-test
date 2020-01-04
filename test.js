const { execute } = require("./src/util");
const { db } = require("./config");
const mssql = require("mssql");
const database = require("./src/database");

const sql =
	"SELECT table_name FROM information_schema.tables WHERE table_type = 'base table' AND table_schema='test'";
const sql2 = "SELECT 1+1";
const sql3 = "SELECT * FROM sys.databases";
const sql4 = `
CREATE TABLE tor.dbo.SQLTest (
   ID INT NOT NULL PRIMARY KEY,
   c1 VARCHAR(100) NOT NULL,
   dt1 DATETIME NOT NULL DEFAULT GETDATE()
)`;
const sql5 = `
USE tor;
INSERT INTO SQLTest (ID, c1) VALUES (1, 'test1')
INSERT INTO SQLTest (ID, c1) VALUES (2, 'test2')
INSERT INTO SQLTest (ID, c1) VALUES (3, 'test3')
INSERT INTO SQLTest (ID, c1) VALUES (4, 'test4')
INSERT INTO SQLTest (ID, c1) VALUES (5, 'test5')`;

const sql6 = `
USE tor;
SELECT * FROM information_schema.tables WHERE table_type = 'base table'`;

const sql7 = `
BACKUP DATABASE tor
TO DISK = '/tmp/dump.bak'
WITH COPY_ONLY`;

var dbname = "tor";
const sql8 = `
RESTORE DATABASE ${dbname}
FROM DISK = '/tmp/dump.bak'
WITH MOVE 'tor' TO '/var/opt/mssql/data/${dbname}.mdf',
MOVE 'tor_log' TO '/var/opt/mssql/data/${dbname}_log.ldf',
REPLACE
`;

const sql9 = "USE tor; SELECT * FROM SQLTest";

const sql10 = `
RESTORE FILELISTONLY
FROM DISK = '/tmp/dump.bak'
`;

(async () => {
	var pool;
	try {
		// var sql = database.list();
		var sql = database.drop('tor_18543');
		// var sql = database.create("tor");
		// var sql = sql7;

		var pool = await mssql.connect(db);
		var ans = await execute(pool, sql);
		console.log(ans);
	} catch (e) {
		console.error(e);
	}
	if (pool) pool.close();
})();
