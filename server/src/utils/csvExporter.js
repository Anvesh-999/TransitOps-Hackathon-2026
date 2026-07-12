const { Parser } = require('json2csv');

/**
 * Converts an array of objects to CSV and streams it as a download.
 * @param {Object} res - Express response object
 * @param {Array} data - Array of flat objects
 * @param {Array} fields - Column definitions for json2csv
 * @param {string} filename - Download filename
 */
const exportCSV = (res, data, fields, filename = 'export.csv') => {
  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};

module.exports = { exportCSV };
