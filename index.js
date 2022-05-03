import express, { json } from "express";
import chalk from "chalk";
import cors from 'cors';
import Joi from "joi";
import dayjs from "dayjs";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URL);
const app = express();
app.use(json());
app.use(cors());

app.post("/participants", (req, res) => {
    const body = req.body;

    const datasUser = {
        name: body.name,
        lastStatus: body.lastStatus
    };
    const promise = database.collection("participants").insertOne(datasUser);
    promise.then(() => {
        res.sendStatus(201);
    });
    promise.catch(e => {
        res.sendStatus(500);
    })
});

app.get("/participants", (req, res) => {
    const listaPartcipants = db.collection("participants").find({}).toArray();
    res.send(listaPartcipants);
});

app.post("/messages", (req, res) => {
    const body = req.body;

    const datasMessage = {
        to: body.to,
        text: body.text,
        type: body.type
    };
    const promise = database.collection("messages").insertOne(datasMessage);
    promise.then(() => {
        res.sendStatus(201);
    });
    promise.catch(e => {
        res.sendStatus(500);
    })
});

app.get("/messages", (req, res) => {
    const listaMessages = db.collection("messages").find({}).toArray();
    res.send(listaMessages);
});

app.post("/status", (req, res) => {
    const body = req.body;

    const datasStatus = {
        name: body.name
    };
    const promise = database.collection("status").insertOne(datasStatus);
    promise.then(() => {
        res.sendStatus(201);
    });
    promise.catch(e => {
        res.sendStatus(500);
    })
});

app.listen(5000);