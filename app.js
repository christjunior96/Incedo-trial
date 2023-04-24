const express = require("express");
const artistRouter = require("./routes/artist");
const path = require("path");

const app = express();

app.use(express.json());
app.use("/artist", artistRouter);
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
