const mongoose = require("mongoose");

const connectDB = async () => {

    try {

        if (!process.env.MONGO_URI) {
            console.log("MONGO_URI missing in .env file");
            return;
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 8000
        });

        console.log("MongoDB Connected Successfully");

    } catch (error) {

        console.log("MongoDB Connection Failed");
        console.log(error.message);

        console.log("Server will continue without database for now.");

    }

};

module.exports = connectDB;