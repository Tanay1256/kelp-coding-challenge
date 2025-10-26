import fs from 'fs';
import readline from 'readline';

/**
 * Sets a nested value on an object based on a dot-notation path.
 * This directly addresses the infinite depth requirement[cite: 63].
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  const finalKey = keys[keys.length - 1];
  
  // Try to convert to number if it looks like one
  const numValue = parseFloat(value);
  current[finalKey] = !isNaN(numValue) && numValue.toString() === value ? numValue : value;
}

/**
 * Transforms the parsed JSON object into the flat array for DB insertion.
 */
function transformDataForDb(csvJson) {
  // 1. Handle mandatory fields [cite: 15]
  const name = `${csvJson.name?.firstName || ''} ${csvJson.name?.lastName || ''}`.trim();
  const age = parseInt(csvJson.age, 10);

  // 2. Handle address field (as JSONB)
  const address = csvJson.address ? JSON.stringify(csvJson.address) : null;

  // 3. Create 'additional_info' from all remaining properties [cite: 57]
  const additionalInfo = { ...csvJson };
  delete additionalInfo.name;
  delete additionalInfo.age;
  delete additionalInfo.address;

  const additionalInfoJson = Object.keys(additionalInfo).length > 0 
    ? JSON.stringify(additionalInfo) 
    : null;

  return [name, age, address, additionalInfoJson];
}

/**
 * Inserts a batch of records using Postgres UNNEST for high performance.
 */
async function insertBatch(pool, batch) {
  const colCount = batch[0].length; // 4 columns
  const colsAsRows = Array.from({ length: colCount }, () => []);

  // Transpose the batch from rows to columns
  for (const row of batch) {
    for (let i = 0; i < colCount; i++) {
      colsAsRows[i].push(row[i]);
    }
  }

  const query = `
    INSERT INTO public.users (name, age, address, additional_info)
    SELECT * FROM UNNEST(
      $1::varchar[], 
      $2::int[], 
      $3::jsonb[], 
      $4::jsonb[]
    )
  `;
  
  try {
    await pool.query(query, colsAsRows);
  } catch (err) {
    console.error('Error inserting batch:', err.message);
  }
}

/**
 * Reads the CSV file line-by-line, parses, and uploads to DB.
 */
export async function processCsvToDb(filePath, pool) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  let isFirstLine = true;
  let batch = [];
  const batchSize = 1000; // Good for performance [cite: 62]
  let totalProcessed = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      headers = line.split(','); // First line is always labels [cite: 61]
      isFirstLine = false;
      continue;
    }

    const values = line.split(',');
    if (values.length !== headers.length) {
      console.warn('Skipping malformed line:', line);
      continue;
    }

    const csvRowObject = {};
    headers.forEach((header, index) => {
      setNestedValue(csvRowObject, header, values[index]);
    });

    const dbRow = transformDataForDb(csvRowObject);
    batch.push(dbRow);
    totalProcessed++;

    if (batch.length >= batchSize) {
      await insertBatch(pool, batch);
      batch = []; // Clear the batch
    }
  }

  // Insert any remaining records
  if (batch.length > 0) {
    await insertBatch(pool, batch);
  }

  return totalProcessed;
}