const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wipcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log('database connected successfully');
        const database = client.db('camsta_action_camera');
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');
        const productsCollection = database.collection('products');
        const reviewsCollection = database.collection('reviews');

        //storing reviews to the database
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });

        //show all reviews to client side from database by server
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        });

        //DELETE products from database
        app.delete("/reviews/:id", async (req, res) => {
            const reviewId = req.params.id;
            const query = { _id: ObjectId(reviewId) };
            const result = await reviewsCollection.deleteOne(query);
            console.log("Delete review", result);
            res.json(result);
        });

        //storing orders to database
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });

        //show all orders to client side from database by server
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.json(orders);
        });

        //show specific users orders to client side from database by server
        app.get('/specificUsersOrders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        });

        //UPDATE status code for orders
        app.put('/orders/:id', async (req, res) => {
            const orderId = req.params.id;
            console.log(req.body);
            console.log('updating order', orderId);

            const query = { _id: ObjectId(orderId) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: req.body.status,
                },
            };
            const result = await ordersCollection.updateOne(
                query,
                updateDoc,
                options
            );
            res.json(result);
        });

        //DELETE orders from database
        app.delete("/orders/:id", async (req, res) => {
            const orderId = req.params.id;
            const query = { _id: ObjectId(orderId) };
            const result = await ordersCollection.deleteOne(query);
            console.log("Delete order", result);
            res.json(result);
        });

        //storing products to the database
        app.post("/products", async (req, res) => {
            const product = await productsCollection.insertOne(req.body);
            console.log(product);
            res.json(product);
        });

        //show Products to client side from database by server
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        //show single products to client side from database by server
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singleProduct = await productsCollection.findOne(query);
            res.json(singleProduct);
        });

        //DELETE products from database
        app.delete("/products/:id", async (req, res) => {
            const productId = req.params.id;
            const query = { _id: ObjectId(productId) };
            const result = await productsCollection.deleteOne(query);
            console.log("Delete product", result);
            res.json(result);
        });

        //storing the users to database [brand new users]
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        //update and store the users [check if the user exists] for google login
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //set the admin role 
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //checking the admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Camsta Action Camera server side');
});

app.listen(port, () => {
    console.log(`listening at ${port}`)
});