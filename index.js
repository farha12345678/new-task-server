const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rnkwiqi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const productCollection = client.db("productDB").collection('product');
        
        // get product

        app.get('/product', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 0;
                const size = parseInt(req.query.size) || 10;
                const { category, brand, search, sort } = req.query;

                // Build the query object
                const query = {};
                if (category) query.category = category;
                if (brand) query.brandName = brand;
                if (search) query.productName = { $regex: search, $options: 'i' };

                // Build the sort object
                let sortQuery = {};
                if (sort === 'price-asc') {
                    sortQuery.price = 1;
                } else if (sort === 'price-desc') {
                    sortQuery.price = -1;
                } else if (sort === 'date-new') {
                    sortQuery.creationDate = -1;
                }

                // Get the total number of matching products
                const totalProducts = await productCollection.countDocuments(query);

                // Fetch the products based on the query, sorting, and pagination
                const products = await productCollection.find(query)
                    .sort(sortQuery)
                    .skip(page * size)
                    .limit(size)
                    .toArray();

                // Send the results
                if (products.length > 0) {
                    res.send({ totalProducts, products });
                } else {
                    res.status(404).send({ totalProducts: 0, products: [] });
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send({ error: 'Failed to fetch products' });
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB!");
    } finally {
        // Close client if necessary
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});