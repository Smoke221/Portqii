"use strict";

const { BigQuery } = require("@google-cloud/bigquery");
const readline = require("readline");
const path = require("path");
const { createDataset } = require("./createDataset"); // Import the createDataset function

// Create a BigQuery client
const bigquery = new BigQuery();

// Hardcoded path to the CSV file
const filePath = path.join(__dirname, "./data/User_Data.csv");

// Define job configuration
const metadata = {
  sourceFormat: "CSV",
  skipLeadingRows: 1, // Skip header row if CSV has a header
  autodetect: true, // Automatically detect schema (optional)
};

// Setup readline for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function loadData(datasetId, tableId) {
  try {
    // Create a job
    const [job] = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .load(filePath, metadata);

    console.log(`Job ${job.id} is in status ${job.status.state}.`);
    console.log("Data has been loaded successfully.");
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function main() {
  rl.question("Enter the name of the dataset: ", async (datasetId) => {
    try {
      // Create the dataset
      await createDataset(datasetId);

      // Prompt for table name after dataset creation
      rl.question("Enter the name of the table: ", async (tableId) => {
        try {
          await loadData(datasetId, tableId);
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          rl.close();
        }
      });
    } catch (error) {
      console.error("Error creating dataset:", error);
      rl.close();
    }
  });
}

main();
