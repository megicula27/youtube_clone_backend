import { connection } from "./src/db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

connection()
  .then(
    app.listen(port, () => {
      console.log("app is running on the port ", port);
    })
  )
  .catch((err) => {
    console.log("app failed at listening with error: ", err);
  });
