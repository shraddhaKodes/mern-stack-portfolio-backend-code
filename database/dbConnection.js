import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({path: "./config/config.env"}) ;
const dbConnection = ()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName:"PORTFOLIO"
    }).then(()=>{
        console.log("Connected to MongoDB");
    }).catch((err)=>{
        console.log(`Error connecting to MongoDB ${err}`);
    })
}

export default dbConnection;
