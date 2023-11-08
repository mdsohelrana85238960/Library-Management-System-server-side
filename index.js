const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware 
app.use(cors({
  origin:['https://cd-library-management-system.web.app' ,
   'https://cd-library-management-system.firebaseapp.com',
   'http://localhost:5173'
  ],
  credentials:true,
}
));
app.use(express.json());
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nliodki.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = async(req, res, next) =>{
  console.log('called', req.host, req.originalUrl)
  next();
}

const verifyToken = async(req,res,next) => {
  const token = req.cookies?.token;
  console.log('value of token in middleware', token)
  if(!token){
    return res.status(401).send({message : 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
    if (err) {
      console.log(err)
      return res.status(401).send({message : ' unauthorized'})
    }
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })
  
}


async function run() {
  try {
    
   

    const bookCollection = client.db('library').collection('books')
    const borrowBooksCollection = client.db('library').collection('borrowBooks')
    
    //auth api jwt
    app.post('/jwt',logger, async(req,res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    
    
    // borrow 

    // app.post('/borrowBooks', async(req,res) =>{
    //   const user = req.body;
    //   const result = await borrowBooksCollection.insertOne(user);
    //   res.send(result)
    // })

    app.post('/borrowBooks', async (req, res) => {
      const borrowedBook = req.body;
      console.log(borrowedBook._id)
      const filter = await borrowBooksCollection.findOne({originalId: borrowedBook.originalId, email:borrowedBook.email})
      if(filter){
          return res.status(400).send({message: 'product already exist'})
      }
      const result = await borrowBooksCollection.insertOne(borrowedBook);
      res.send(result)

  })


    app.get('/borrowBooks', async(req,res) =>{
      const cursor = borrowBooksCollection.find();
      const result = await cursor.toArray();
      res.send(result)
  })
   




  app.patch('/books/:id', async(req,res) =>{
    const update = req.body.quantity;
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    console.log(query)
    const updateDoc = {
      $set : {
        quantity: parseInt(update) + 1
      }
    }
    const result = await bookCollection.updateOne(query,updateDoc)
    res.send(result);
  })



  app.delete("/borrowBooks/:id", async (req, res) => {
    const id = req.params.id;
    console.log("delete", id);
    const query = {
      _id: new ObjectId(id),
    };
    
    const result = await borrowBooksCollection.deleteOne(query)
    
    console.log(result);
    res.send(result);
  }); 


  // app.delete("/borrowBooks/:id", async (req, res) => {
  //   const id = req.params.id;
  //   console.log("delete", id);
  //   const query = {
  //     _id: new ObjectId(id),
  //   };
  //   const update = { $inc: { quantity: 1 } };
  //   const result = await borrowBooksCollection.deleteOne(query);
  
  //   if (result.deletedCount > 0) {
  //     // If a record was deleted, update the quantity in the bookCollection
  //     const bookId = req.body.bookId; // You need to provide the bookId in the request body
  //     const bookFilter = { _id: new ObjectId(bookId) };
  
  //     const bookUpdateResult = await bookCollection.updateOne(bookFilter, update);
  
  //     if (bookUpdateResult.modifiedCount > 0) {
  //       console.log(`Quantity incremented for book with _id ${bookId}`);
  //     } else {
  //       console.log(`Book not found with _id ${bookId}`);
  //     }
  //   }
  
  //   console.log(result);
  //   res.send(result);
  // });
  


  
  
app.put("/books/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log("id", id, data);
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedUSer = {
    $set: {
      quantity: data.quantity,
    },
  };
  const result = await bookCollection.updateOne(
    filter,
    updatedUSer,
    options
  );
  res.send(result);
});
//updates
app.put("/updates/:id", async (req, res) => {
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
    app.post('/books', logger,verifyToken, async(req,res) =>{
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

    app.get('/allBook',logger,verifyToken, async(req,res) =>{
      // console.log('valid token', req.user.email)
      // console.log('e', req.query.email)
      // if (req.query.email !== req.user.email) {
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      // let query = {};
      // if (req.query?.email) {
      //   query = { email: req.query.email}
      // }
      
        const cursor = bookCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);




app.get('/',(req,res) =>{
    res.send('this is running')
})

app.listen(port, () => {
    console.log(`this server is running on the post ${port}`)
})



