import express from 'express';
import 'dotenv/config';
import { Pool } from 'pg';
import { processCsvToDb } from './parser.js';
import { getAgeDistributionReport } from './report.js';

// Setup Database Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
const port = 3000;

app.post('/upload', async (req, res) => {
  const filePath = process.env.CSV_FILE_PATH;
  
  try {
    console.log('Starting CSV upload...');
    
    // Clear the table for a fresh report
    await pool.query('TRUNCATE TABLE public.users RESTART IDENTITY;');
    console.log('Table truncated.');

    // 1. Process CSV and Upload to DB
    const totalProcessed = await processCsvToDb(filePath, pool);
    console.log(`Successfully uploaded ${totalProcessed} records.`);

    // 2. Calculate and Print Report
    console.log('Calculating age distribution...');
    const report = await getAgeDistributionReport(pool);
    
    console.log('\n--- Age Distribution Report ---');
    console.log(report.header);
    report.rows.forEach(row => console.log(row));
    console.log('-------------------------------\n');

    res.status(200).json({ 
      message: `Upload complete. Processed ${totalProcessed} records.`, 
      report: report.rows 
    });

  } catch (error) {
    console.error('Error during processing:', error);
    res.status(500).send('Error processing file.');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Trigger the upload by sending a POST request to http://localhost:3000/upload');
});