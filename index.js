const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 2000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://eleveen-assignment-project.web.app",
    ],
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Own project");
});

const logger = async (req, res, next) => {
  console.log("called", req.hostname, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  // console.log("value of token in middleware", token);
  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // console.log(err);
      return res.status(401).send({ message: "unauthorized" });
    }
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ggrxkpr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    // 6type
    const database = client.db("BooksDB");
    const booksCollection = database.collection("Books");

    // 6 types babies
    const books = client.db("BookskidsDB");
    const booksKidsCollection = books.collection("Bookskids");

    // users email
    const users = client.db("usersInfoDB");
    const usersInfoCollection = users.collection("usersInfo");

    // borrow
    const borrowDatabase = client.db("borrowCategoryDb");
    const borrowCollection = borrowDatabase.collection("borrowCategory");

    // json web token

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
      // console.log(token);
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { maxAge: 0, sameSite: "none", secure: true })
        .send({ success: true });
    });

    // services api collection

    // borrow
    app.post("/borrowProduct", async (req, res) => {
      const bookProduct = req.body;
      delete bookProduct._id;
      console.log("borrowProduct", bookProduct);
      const result = await borrowCollection.insertOne(bookProduct);
      res.send(result);
    });

    // borrow
    app.get("/borrowProduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await borrowCollection.find(query).toArray();
      res.send(result);
    });

    // borrow
    app.delete("/borrowProduct/:name", async (req, res) => {
      const name = req.params.name;
      const query = { name: name };
      const result = await borrowCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/book", async (req, res) => {
      const bookCategory = booksCollection.find();
      const result = await bookCategory.toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/kids", verifyToken, async (req, res) => {
      const bookKids = booksCollection.find();
      const result = await bookKids.toArray();
      res.send(result);
    });

    app.get("/allbooks", async (req, res) => {
      const allbooks = booksKidsCollection.find();
      const result = await allbooks.toArray();
      res.send(result);
    });

    app.post("/kids", async (req, res) => {
      const cursor = req.body;
      const result = await booksKidsCollection.insertOne(cursor);
      res.send(result);
    });

    app.get("/kids/:category", async (req, res) => {
      const category = req.params.category;
      console.log(category);
      const query = { category: category };
      const result = await booksKidsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await booksKidsCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // borrow
    app.post("/borrow", async (req, res) => {
      const { name, email, date } = req.body;
      const result = await usersInfoCollection.insertOne({ name, email, date });
      res.send(result);
    });

    // update
    app.put("/bookupdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upset: true };
      const updateCategory = req.body;
      const category = {
        $set: {
          name: updateCategory.name,
          photo: updateCategory.photo,
          quantity: updateCategory.quantity,
          author: updateCategory.author,
          category: updateCategory.category,
          rating: updateCategory.rating,
        },
      };
      const result = await booksKidsCollection.updateOne(
        filter,
        category,
        options
      );
      console.log(result);
      res.send(result);
    });

    // update
    app.get("/bookupdate/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await booksKidsCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    // "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Own project,${port}`);
});
