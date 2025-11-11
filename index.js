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
      const cursor = serviceCollections.find();
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

    // adding service

    // app.post("/addServices", async (req, res) => {
    //   const newService = req.body;
    //   const result = await addServiceCollections.insertOne(newService);
    //   res.send(result);
    // });

    // // -------get add services apis here
    // app.get("/addServices", async (req, res) => {
    //   const cursor = addServiceCollections.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // // delte my services

    app.delete("/addServices/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addServiceCollections.deleteOne(query);
      res.send(result);
    });

    // // ----update service apis here

    // app.patch("/addServices/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const updatetedService = req.body;
    //   const update = {
    //     $set: {
    //       service_Name: updatetedService.service_Name,
    //       service_price: updatetedService.service_price,
    //       provider_description: updatetedService.provider_description,
    //       service_category: updatetedService.service_category,
    //       service_image: updatetedService.service_image,
    //       provider_image: updatetedService.provider_image,
    //       provider_Name: updatetedService.provider_Name,
    //       provider_email: updatetedService.provider_email,
    //       provider_phone: updatetedService.provider_phone,
    //     },
    //   };

    //   const options = {};
    //   const result = await addServiceCollections.updateOne(
    //     query,
    //     update,
    //     options
    //   );
    //   res.send(result);
    // });

    const { ObjectId } = require("mongodb");

    // 1. ADD SERVICE (already good, just keep it)
    app.post("/addServices", async (req, res) => {
      const newService = req.body;
      newService.createdAt = new Date();
      const result = await addServiceCollections.insertOne(newService);
      res.send(result);
    });

    // 2. GET ONLY MY SERVICES (THIS WAS BROKEN!)
    app.get("/addServices", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      const query = { provider_email: email }; // ONLY THIS USER'S SERVICES
      const cursor = addServiceCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // 3. DELETE ONLY MY SERVICE (add email check)
    // app.delete("/addServices/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const email = req.query.email; // Get from query: ?email=user@gmail.com

    //   if (!email) {
    //     return res.status(400).send({ error: "Email required" });
    //   }

    //   const query = {
    //     _id: new ObjectId(id),
    //     provider_email: email, // Security: only delete own
    //   };

    //   const result = await addServiceCollections.deleteOne(query);
    //   res.send(result);
    // });

    // 4. UPDATE ONLY MY SERVICE (add email check)
    app.patch("/addServices/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.body.provider_email; // or req.query.email

      if (!email) {
        return res.status(400).send({ error: "Email required" });
      }

      const updatetedService = req.body;
      const query = {
        _id: new ObjectId(id),
        provider_email: email, // Only update own service
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
