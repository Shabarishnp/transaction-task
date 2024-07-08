const Transaction = require("../models/transactionModel");

// Fetching transactions with filtering, searching, and pagination
const fetchTransactions = async ({ page, perPage, search }) => {
  const query = {};

  if (search) {
    const searchConditions = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];

    // Check if the search term is a valid number
    const searchNumber = parseFloat(search);
    if (!isNaN(searchNumber)) {
      searchConditions.push({ price: searchNumber });
    }

    query.$or = searchConditions;
  }

  const transactions = await Transaction.find(query)
    .skip((page - 1) * perPage)
    .limit(perPage);

  const totalTransactions = await Transaction.countDocuments(query);

  return {
    total: totalTransactions,
    page: page,
    perPage: perPage,
    transactions: transactions,
  };
};

//Fecthing the statistics
const fetchStatistics = async (monthName) => {
  const monthIndex =
    new Date(Date.parse(monthName + " 1, 2022")).getMonth() + 1; // Get the month index (1-based)
  console.log(`Fetching statistics for month: ${monthName}`);
  console.log(`Month index: ${monthIndex}`);

  const statistics = await Transaction.aggregate([
    {
      $project: {
        price: 1,
        sold: 1,
        month: { $month: "$dateOfSale" },
      },
    },
    {
      $match: {
        month: monthIndex,
      },
    },
    {
      $group: {
        _id: null,
        totalSaleAmount: { $sum: "$price" },
        totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
        totalNotSoldItems: {
          $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
        },
      },
    },
  ]);

  if (statistics.length === 0) {
    console.log("No data found for the specified month.");
    return {
      totalSaleAmount: 0,
      totalSoldItems: 0,
      totalNotSoldItems: 0,
    };
  } else {
    console.log("Statistics data:", statistics[0]);
    return statistics[0];
  }
};

// Fetching bar chart data
const fetchBarChartData = async (monthName) => {
  const monthIndex =
    new Date(Date.parse(monthName + " 1, 2022")).getMonth() + 1; // Get the month index (1-based)

  const boundaries = [0, 101, 201, 301, 401, 501, 601, 701, 801, 901];

  const barChartData = await Transaction.aggregate([
    {
      $project: {
        price: 1,
        month: { $month: "$dateOfSale" },
      },
    },
    {
      $match: {
        month: monthIndex,
      },
    },
    {
      $bucket: {
        groupBy: "$price",
        boundaries: boundaries,
        default: "901-above",
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  if (barChartData.length === 0) {
    console.log("No data found for the specified month.");
  } else {
    console.log("Bar chart data:", barChartData);
  }

  return barChartData.map((item) => ({
    range:
      item._id === "901-above"
        ? "901 and above"
        : `${item._id} - ${item._id + 99}`,
    count: item.count,
  }));
};

// Fetching pie chart data
const fetchPieChartData = async (month) => {
  const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth() + 1; // Get the month index (1-based)
  console.log(`Fetching pie chart data for month: ${month}`);
  console.log(`Month index: ${monthIndex}`);

  const pieChartData = await Transaction.aggregate([
    {
      $project: {
        category: 1,
        month: { $month: "$dateOfSale" },
      },
    },
    {
      $match: {
        month: monthIndex,
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  if (pieChartData.length === 0) {
    console.log("No data found for the specified month.");
  } else {
    console.log("Pie chart data:", pieChartData);
  }

  return pieChartData.map((cat) => ({
    category: cat._id,
    count: cat.count,
  }));
};

// Fetch combined data from all APIs
const fetchCombinedData = async ({ month, page, perPage, search }) => {
  const [transactionsData, barChartData, pieChartData] = await Promise.all([
    fetchTransactions({ month, page, perPage, search }),
    fetchBarChartData(month),
    fetchPieChartData(month),
  ]);

  return {
    transactionsData,
    barChartData,
    pieChartData,
  };
};

module.exports = {
  fetchTransactions,
  fetchBarChartData,
  fetchPieChartData,
  fetchCombinedData,
  fetchStatistics,
};
