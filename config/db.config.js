const mongoose = require("mongoose");

// Kết nối với mongoDB
const dbConnect = () => {
    mongoose.set('strictQuery', true);
    mongoose.connect(process.env.MONGO_URL)
        .then(() => console.log("MongoDB is connected"))
        .catch(() => console.log("MongoDB is disconnected"))
}

module.exports = dbConnect;

