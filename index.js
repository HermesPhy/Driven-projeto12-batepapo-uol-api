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

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);
const promise = mongoClient.connect();
promise.then(() => {
    db = mongoClient.db("batepapo-uol");
    console.log(chalk.green.bold("Sua conexão com o banco de dados está de pé"));
});
promise.catch(e => console.log(chalk.red.bold("O banco de dados não aceitou sua conexão"), e));


app.post("/participants", async (req, res) => {
    let { name } = req.body;
    const time = dayjs().format('hh:mm:ss');
    let stop;

    const scheme = Joi.object().keys({
        name: Joi.string().min(1).required()
    });
    const result = scheme.validate({name});
    const { error } = result;
    const valid = error == null;

    if(!valid) {
        res.status(422).send("Insira um nome válido");
        return;
    }

    const listUsers = await db.collection("registeredUsers").find({}).toArray();
    listUsers.map(user => {
        if(user.name === name) {
            stop = "stop";
            res.status(409).send("Nome de usuário já existente. Utilize outro nome.");
            return;
        }
    });

    if(stop) return;
    addUser(name, time, res);
});

function addUser(name, time, res) {
    const user = {
        name,
        lastStatus: Date.now()
    }
    const status = {
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time
    }
    const promise = db.collection("registeredUsers").insertOne(user);
    promise.then(async () => {
        await db.collection("messagesUsers").insertOne(status);
        res.sendStatus(201);
    });
    promise.catch(() => res.sendStatus(500));
};

app.get("/participants", (req, res) => {
    db.collection("registeredUsers").find({}).toArray().then(users => res.send(users));
});




app.post("/messages", (req, res) => {
    const body = req.body;

    const datasMessage = {
        to: body.to,
        text: body.text,
        type: body.type
    };
    const promise = db.collection("messages").insertOne(datasMessage);
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
    const promise = db.collection("status").insertOne(datasStatus);
    promise.then(() => {
        res.sendStatus(201);
    });
    promise.catch(e => {
        res.sendStatus(500);
    })
});

app.listen(5000);