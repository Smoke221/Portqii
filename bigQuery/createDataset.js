const { BigQuery } = require("@google-cloud/bigquery");

// Create a BigQuery client
const bigquery = new BigQuery();

async function createDataset(datasetId) {
  const options = {
    location: "US",
  };

  // Create a new dataset
  const [dataset] = await bigquery.createDataset(datasetId, options);
  console.log(`Dataset ${dataset.id} created.`);
  return datasetId;
}

module.exports = { createDataset };
