const express = require("express");
const app = express();
const dbConnect = require("./config/db.config");
const dotenv = require("dotenv").config();
const { errorHandler, notFound } = require("./middleware/errorHandler");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const userRouter = require("./route/user.route");
const productRouter = require("./route/product.route");

const PORT = process.env.PORT;

dbConnect();
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})