import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connection from "./Database.js";

dotenv.config();

const app = express();
const port = 8001;

app.use(cors());
app.use(express.json());

app.listen(port, () => console.log(`🚀 Server running on ${port}`));

/* =========================
   🔍 FETCH USER
========================= */
app.get("/api/selectuser/:accno", (req, res) => {
  const accno = req.params.accno;

  console.log("\n🔎 FETCH USER:", accno);

  connection.query(
    "SELECT * FROM card WHERE accno = ?",
    [accno],
    (error, results) => {
      if (error) {
        console.error("❌ ERROR:", error);
        return res.status(500).json({ error: "DB error" });
      }

      console.log("✅ RESULT:", results);
      res.json(results);
    }
  );
});

/* =========================
   💸 WITHDRAW
========================= */
app.post("/api/withdraw/:accno", (req, res) => {
  const accno = req.params.accno;
  const amt = req.body.amt;

  console.log("\n💸 WITHDRAW REQUEST");
  console.log("Account:", accno, "Amount:", amt);

  connection.query(
    "SELECT balance, cardno FROM card WHERE accno = ?",
    [accno],
    (error, results) => {
      if (error) return res.status(500).json({ error });

      if (results.length === 0)
        return res.status(404).json({ error: "Account not found" });

      const balance = results[0].balance;
      const cardno = results[0].cardno;

      console.log("💰 Current Balance:", balance);

      if (balance < amt) {
        console.log("❌ Insufficient balance");
        return res.status(400).json({ error: "Insufficient balance" });
      }

      connection.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err });

        console.log("🔄 TRANSACTION STARTED");

        // UPDATE balance
        console.log("📝 SQL: UPDATE card SET balance = balance - ? WHERE accno = ?");
        connection.query(
          "UPDATE card SET balance = balance - ? WHERE accno = ?",
          [amt, accno],
          (error) => {
            if (error) {
              console.log("❌ UPDATE FAILED");
              return connection.rollback(() => res.status(500).json({ error }));
            }

            console.log("✅ Balance Updated");

            // INSERT transaction
            console.log("📝 SQL: INSERT INTO transaction (...) VALUES (...)");
            connection.query(
              "INSERT INTO transaction (cardno, transtype, amt, date, time) VALUES (?, ?, ?, CURDATE(), CURTIME())",
              [cardno, "withdraw", amt],
              (error) => {
                if (error) {
                  console.log("❌ INSERT FAILED");
                  return connection.rollback(() => res.status(500).json({ error }));
                }

                console.log("✅ Transaction Inserted");

                connection.commit((err) => {
                  if (err) {
                    console.log("❌ COMMIT FAILED");
                    return connection.rollback(() => res.status(500).json({ error }));
                  }

                  console.log("🎉 WITHDRAW SUCCESS");
                  res.json({ message: "Withdraw successful" });
                });
              }
            );
          }
        );
      });
    }
  );
});

/* =========================
   💰 DEPOSIT
========================= */
app.post("/api/deposit/:accno", (req, res) => {
  const accno = req.params.accno;
  const amount = req.body.amount;

  console.log("\n💰 DEPOSIT REQUEST");
  console.log("Account:", accno, "Amount:", amount);

  connection.query(
    "SELECT balance, cardno FROM card WHERE accno = ?",
    [accno],
    (error, results) => {
      if (error) return res.status(500).json({ error });

      if (results.length === 0)
        return res.status(404).json({ error: "Account not found" });

      const balance = results[0].balance;
      const cardno = results[0].cardno;

      console.log("💰 Current Balance:", balance);

      connection.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err });

        console.log("🔄 TRANSACTION STARTED");

        // UPDATE
        console.log("📝 SQL: UPDATE card SET balance = balance + ? WHERE accno = ?");
        connection.query(
          "UPDATE card SET balance = balance + ? WHERE accno = ?",
          [amount, accno],
          (error) => {
            if (error) {
              console.log("❌ UPDATE FAILED");
              return connection.rollback(() => res.status(500).json({ error }));
            }

            console.log("✅ Balance Updated");

            // INSERT
            console.log("📝 SQL: INSERT INTO transaction (...) VALUES (...)");
            connection.query(
              "INSERT INTO transaction (cardno, transtype, amt, date, time) VALUES (?, ?, ?, CURDATE(), CURTIME())",
              [cardno, "deposit", amount],
              (error) => {
                if (error) {
                  console.log("❌ INSERT FAILED");
                  return connection.rollback(() => res.status(500).json({ error }));
                }

                console.log("✅ Transaction Inserted");

                connection.commit((err) => {
                  if (err) {
                    console.log("❌ COMMIT FAILED");
                    return connection.rollback(() => res.status(500).json({ error }));
                  }

                  console.log("🎉 DEPOSIT SUCCESS");
                  res.json({ message: "Deposit successful" });
                });
              }
            );
          }
        );
      });
    }
  );
});