import express, { json } from "express";
import chalk from "chalk";
import cors from 'cors';
import Joi from "joi";
import dayjs from "dayjs";
import { MongoClient, ObjectId } from "mongodb";
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

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body;
    const { user } = req.headers;
    const time = dayjs().format('hh:mm:ss');
    let participant;

    const listUsers = await db.collection("registeredUsers").find({}).toArray();
    listUsers.map(obj => {
        if(obj.name === user) participant = user;
    });

    const message = {
        from: participant,
        to,
        text,
        type,
        time
    }

    const scheme = Joi.object().keys({
        to: Joi.string().min(1).required(),
        text: Joi.string().min(1).required(),
        type: Joi.alternatives().try("message", "private_message"),
        from: Joi.string().required(),
        time: Joi.required()
    });

    const result = scheme.validate(message);
    const { error } = result;
    const valid = error == null;

    if(!valid) {
        res.status(422).send('Erro ao carregar mensagem');
        return;
    }

    const promise = db.collection("messagesUsers").insertOne(message);
    promise.then(() => res.sendStatus(201));
    promise.catch(() => res.sendStatus(500));
});

app.get("/messages", (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    const promise = db.collection("messagesUsers").find({}).toArray();
    promise.then((messages) => {
        const filterMessages = messages.filter(msg => msg.to === user || msg.to === "Todos" || msg.from === user);

        if(!limit) res.send(filterMessages);

        if (limit) {
            const lastMessages = filterMessages.slice(filterMessages.length - limit);
            res.send(lastMessages);
        }
    });
});

app.post("/status", async (req, res) => {
    const { user } = req.headers;

    try {
        const usersCollection = db.collection("registeredUsers");
        const participant = await usersCollection.findOne({name: user});
        
        if(!participant) {
            res.sendStatus(404);
            return;
        }
        await usersCollection.updateOne({
            _id: participant._id
        }, {$set: {lastStatus: Date.now()}
    });
    res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

setInterval(() => {
    const now = Date.now();

    const promise = db.collection("registeredUsers").find({}).toArray();
    promise.then(users => {
        users.map((user) => {
            if(now - user.lastStatus > 10000) {
                deleteUser(user)
            };
        });
    });
}, 15000);

app.delete("/messages/:id", async (req, res) => {
    const { id } = req.params;
    const { user } = req.headers;
    try {
        const message = await db.collection("messagesUsers").findOne({_id: new ObjectId(id)});
        if(message) {
            if (message.from === user) {
                await db.collection("messagesUsers").deleteOne({_id: new ObjectId(id)});
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.log(error);
    }
});

app.listen(5000);