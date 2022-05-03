import express, { json } from "express";
import chalk from "chalk";
import cors from 'cors';
import Joi from "joi";
import dayjs from "dayjs";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(json());
app.use(cors());
dotenv.config();

let database = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);
const promise = mongoClient.connect();
promise.then(() => {
    database = mongoClient.db("batepapo-uol");
    console.log(chalk.bold.green("Sua conexão com o banco de dados está de pé"));
});
promise.catch(e => console.log(chalk.bold.red("O banco de dados não aceitou sua conexão"), e));


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