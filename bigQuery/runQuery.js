// Import the Google Cloud client library using default credentials
const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery();

async function query() {
  const query = `SELECT Gender, COUNT(*) AS NumberOfPurchases
   FROM analyzy.testing69.sampleTable1
   WHERE Purchased = 1
   GROUP BY Gender;
`;

  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: "US",
  };

  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  console.log("Rows:");
  rows.forEach((row) => console.log(row));
}
query();
