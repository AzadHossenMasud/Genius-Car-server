const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
// console.log(process.env.DB_USER)
// console.log(process.env.SECRET_KEY)

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.2kitjkk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// console.log(uri);

const verifyJWT = (req, res, next) => {
  // next()
  // console.log(req.headers.authorization)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const run = async () => {
  try {
    const seviceCollection = client.db("geniusCar").collection("sevices");
    const orderCollection = client.db("geniusCar").collection("orders");
    // const doc = {
    //     title: "Record of a Shriveled Datum",
    //     content: "No bytes, no problem. Just insert a document, in MongoDB",
    //   }
    //   const result = await seviceCollection.insertOne(doc);
    //   console.log(result)

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const ase = req.query.sort === 'ase'? 1 : -1
      console.log(ase);
      const query = {};
      const cursor = seviceCollection.find(query).sort({price: ase});

      const services = await cursor.toArray();
      // console.log(services);
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await seviceCollection.findOne(query);

      res.send(result);
      // console.log(result)
    });

    app.get("/orders",verifyJWT,  async (req, res) => {
      const decoded = req.decoded;
      console.log(decoded);

      if(decoded.email !== req.query.email){
        res.status(403).send({message: 'Unauthorized Access'})
      }
      // console.log(req.headers.authorization)
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;

      const result = await orderCollection.insertOne(order);
      // console.log(result);
      res.send(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = {
        _id: ObjectId(id),
      };
      const result = orderCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
