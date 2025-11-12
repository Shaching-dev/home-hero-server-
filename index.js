const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
const app = express();
require("dotenv").config();
// middleware
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("home hero service is running");
});

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.25jmnoy.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db("heroHomeDB");
const serviceCollections = db.collection("services");
const bookedCollections = db.collection("bookings");
const addServiceCollections = db.collection("addServices");
const reviewCollections = db.collection("reviews");

async function run() {
  try {
    await client.connect();
    // ---------services related apis here
    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollections.insertOne(newService);
      res.send(result);
    });

    // -------services get apis

    app.get("/services", async (req, res) => {
      const cursor = serviceCollections.find().sort({ price: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------our services page api ----
    app.get("/our-services", async (req, res) => {
      const cursor = serviceCollections.find().limit(9);
      const result = await cursor.toArray();
      res.send(result);
    });

    // ------getting my bookings ----

    app.get("/booked", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.customer_email = email;
      }
      const cursor = bookedCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get a specific service details

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollections.findOne(query);
      res.send(result);
    });

    // customer service booked related apis here

    app.post("/booked", async (req, res) => {
      const newCustomer = req.body;
      const result = await bookedCollections.insertOne(newCustomer);
      res.send(result);
    });

    // ---------------vvi---------
    // ------------get a specific service booking history

    app.get("/services/booked/:serviceId", async (req, res) => {
      const serviceId = req.params.serviceId;
      const query = { service: serviceId };
      const cursor = bookedCollections.find(query).sort({
        customer_price: -1,
      });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/booked", async (req, res) => {
      const cursor = bookedCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // ---------my bookings delete apis here

    app.delete("/booked/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookedCollections.deleteOne(query);
      res.send(result);
    });

    // // delte my services

    app.delete("/addServices/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addServiceCollections.deleteOne(query);
      res.send(result);
    });

    // // ----update service apis here

    app.post("/addServices", async (req, res) => {
      const newService = req.body;
      newService.createdAt = new Date();
      const result = await addServiceCollections.insertOne(newService);
      res.send(result);
    });

    app.get("/addServices", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      const query = { provider_email: email };
      const cursor = addServiceCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch("/addServices/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.body.provider_email;

      if (!email) {
        return res.status(400).send({ error: "Email required" });
      }

      const updatetedService = req.body;
      const query = {
        _id: new ObjectId(id),
        provider_email: email,
      };

      const update = {
        $set: {
          service_Name: updatetedService.service_Name,
          service_price: updatetedService.service_price,
          provider_description: updatetedService.provider_description,
          service_category: updatetedService.service_category,
          service_image: updatetedService.service_image,
          provider_image: updatetedService.provider_image,
          provider_Name: updatetedService.provider_Name,
          provider_email: updatetedService.provider_email,
          provider_phone: updatetedService.provider_phone,
        },
      };

      const result = await addServiceCollections.updateOne(query, update);
      res.send(result);
    });

    app.post("/review", async (req, res) => {
      try {
        const newReview = req.body;
        newReview.createdAt = new Date();
        newReview.rating = parseInt(newReview.rating);

        const result = await reviewCollections.insertOne(newReview);

        console.log("Insert result:", result); // Debug log

        // Fetch the complete inserted document to get the MongoDB _id
        const savedReview = await reviewCollections.findOne({
          _id: result.insertedId,
        });

        console.log("Saved review from DB:", savedReview); // Debug log

        if (!savedReview) {
          return res
            .status(500)
            .send({ error: "Failed to retrieve saved review" });
        }

        // Send back the complete review object
        res.send(savedReview);
      } catch (error) {
        console.error("Review submission error:", error);
        res
          .status(500)
          .send({ error: "Failed to save review: " + error.message });
      }
    });
    // GET: All reviews (for testing)
    app.get("/review", async (req, res) => {
      const result = await reviewCollections.find().toArray();
      res.send(result);
    });

    // GET: Reviews for specific service — FIXED ROUTE NAME!
    app.get("/reviews/:serviceId", async (req, res) => {
      const { serviceId } = req.params;
      const reviews = await reviewCollections
        .find({ serviceId: serviceId })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(reviews);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // -client.close()
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`My server is running on the port of : ${port}`);
});
