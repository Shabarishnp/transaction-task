const express = require("express");
const router = express.Router();
const axios = require("axios");
const {
  fetchTransactions,
  fetchBarChartData,
  fetchPieChartData,
  fetchCombinedData,
  fetchStatistics,
} = require("../handlers/transactionHandlers");
const Transaction = require("../models/transactionModel");

// Route to initialize the database with seed data
router.get("/initialize", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = response.data;
    await Transaction.deleteMany({}); // Clear existing data
    await Transaction.insertMany(data); // Seed new data
    res.status(200).send("Database initialized with seed data.");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to list all transactions with pagination and search
router.get("/", async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  console.log(search, page, perPage);
  try {
    const result = await fetchTransactions({ page, perPage, search });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to get statistics
router.get("/statistics", async (req, res) => {
  const { month } = req.query;
  if (!month) {
    //returning error when the user not entered the month
    return res.status(400).json({ error: "Month parameter is required" });
  }
  try {
    const stats = await fetchStatistics(month);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to get bar chart data
router.get("/bar-chart", async (req, res) => {
  const { month } = req.query;
  if (!month) {
    //returning error when the user not entered the month
    return res.status(400).json({ error: "Month parameter is required" });
  }
  try {
    const barChartData = await fetchBarChartData(month);
    res.status(200).json(barChartData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to get pie chart data
router.get("/pie-chart", async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: "Month parameter is required" });
  }
  try {
    const pieChartData = await fetchPieChartData(month);
    res.status(200).json(pieChartData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to get combined data from all APIs
router.get("/combined-data", async (req, res) => {
  const { month, page = 1, perPage = 10, search = "" } = req.query;
  try {
    const combinedData = await fetchCombinedData({
      month,
      page,
      perPage,
      search,
    });
    res.status(200).json(combinedData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
