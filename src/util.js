exports.execute = async (pool, sql) => {
	var ans = await pool.request().query(sql);
	return ans.recordset || ans;
};
