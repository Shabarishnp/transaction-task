const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const transactionsRouter = require("./routes/transactions");
const dotenv = require("dotenv");
// const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(cors()); // Enable cross-origin requests
// app.use(express.json());

mongoose.connect(`${process.env.MONGO_URI}${process.env.DATABASE_NAME}`);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB successfully");
});

mongoose.connection.on("error", (err) => {
  console.error(`Error connecting to MongoDB: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("Disconnected from MongoDB");
});

app.use(bodyParser.json());
app.use("/api/transactions", transactionsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
