import { MongoClient, ServerApiVersion } from "mongodb";

import mongoose from "mongoose";

const uri = "mongodb://mrartimas24:SaGor$$$sr52@ac-a1fsewa-shard-00-00.17ynk2p.mongodb.net:27017,ac-a1fsewa-shard-00-01.17ynk2p.mongodb.net:27017,ac-a1fsewa-shard-00-02.17ynk2p.mongodb.net:27017/?ssl=true&replicaSet=atlas-mqaeyw-shard-0&authSource=admin&appName=Cluster0";





let isConnected = false;

async function ConnectDB() {
    if (isConnected) return;

    try {
        await mongoose.connect(uri, {
            serverApi: {
                version: "1",
                strict: true,
                deprecationErrors: true,
            },
            connectTimeoutMS: 40000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log("MongoDB connected via Mongoose!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}

export default ConnectDB;