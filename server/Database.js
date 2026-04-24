import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  multipleStatements: true
});

// ✅ Connect
connection.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// 🔥 LOG ALL SQL QUERIES (VERY IMPORTANT)
const originalQuery = connection.query;

connection.query = function (...args) {
  console.log("\n📡 SQL QUERY:");
  console.log(args[0]); // query
  if (args[1]) console.log("📦 VALUES:", args[1]); // values
  return originalQuery.apply(this, args);
};

export default connection;