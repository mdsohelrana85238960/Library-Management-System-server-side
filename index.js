const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware 
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nliodki.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
   

    const bookCollection = client.db('library').collection('books')
    const borrowBooksCollection = client.db('library').collection('borrowBooks')
    //borrow 
    app.post('/borrowBooks', async(req,res) =>{
      const user = req.body;
      const result = await borrowBooksCollection.insertOne(user);
      res.send(result)
    })
    app.get('/borrowBooks', async(req,res) =>{
      const cursor = borrowBooksCollection.find();
      const result = await cursor.toArray();
      res.send(result)
  })

  app.delete("/borrowBooks/:id", async (req, res) => {
    const id = req.params.id;
    console.log("delete", id);
    const query = {
      _id: new ObjectId(id),
    };
    const result = await borrowBooksCollection.deleteOne(query)
    //findbooks from bookcollectrion findone 
    //create set obj quantity
    // update data using update one 
    console.log(result);
    res.send(result);
  });

  
app.put("/books/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log("id", id, data);
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedUSer = {
    $set: {
      quantity: data.quantity,
      photo: data.photo,
      bookName: data.bookName,
      category: data.category,
      author: data.author,
      rating: data.rating,
      
    },
  };
  const result = await bookCollection.updateOne(
    filter,
    updatedUSer,
    options
  );
  res.send(result);
});

      //books
    app.post('/books', async(req,res) =>{
      const user = req.body;
      const result = await bookCollection.insertOne(user);
      res.send(result)
    })

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        "_id" : new ObjectId(id)
      };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });


    app.get('/books', async(req,res) =>{
        const cursor = bookCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res) =>{
    res.send('this is running')
})

app.listen(port, () => {
    console.log(`this server is running on the post ${port}`)
})



