export async function getAgeDistributionReport(pool) {
  // 1. Get the total count of users
  const totalResult = await pool.query('SELECT COUNT(*) AS total FROM users');
  const total = parseInt(totalResult.rows[0].total, 10);

  if (total === 0) {
    return {
      header: '"Age-Group","% Distribution"',
      rows: [
        '"< 20","0"',
        '"20 to 40","0"',
        '"40 to 60","0"',
        '"> 60","0"',
      ]
    };
  }

  // 2. Use a CASE statement to group ages
  const query = `
    SELECT
      CASE
        WHEN age < 20 THEN '< 20'
        WHEN age >= 20 AND age <= 40 THEN '20 to 40'
        WHEN age > 40 AND age <= 60 THEN '40 to 60'
        WHEN age > 60 THEN '> 60'
      END AS "Age-Group",
      COUNT(*) AS count
    FROM
      users
    WHERE age IS NOT NULL
    GROUP BY
      "Age-Group";
  `;

  const results = await pool.query(query);

  // 3. Format the report
  const reportMap = {
    '< 20': 0,
    '20 to 40': 0,
    '40 to 60': 0,
    '> 60': 0,
  };

  for (const row of results.rows) {
    const group = row['Age-Group'];
    const percentage = (parseInt(row.count, 10) / total) * 100;
    if (group) { 
      reportMap[group] = percentage;
    }
  }

  // 4. Return formatted strings exactly as requested [cite: 59]
  const header = '"Age-Group","% Distribution"';
  const rows = Object.entries(reportMap).map(([group, percentage]) => {
    return `"${group}","${percentage.toFixed(0)}"`; 
  });
  
  return { header, rows };
}