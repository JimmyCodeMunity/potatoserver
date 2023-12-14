// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const cors = require('cors');


// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://Collo:Collo77@cluster0.bo6bwv7.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));






const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your product name!"],
  },
  description: {
    type: String,
    required: [true, "Please enter your product description!"],
  },
  category: {
    type: String,
    required: [true, "Please enter your product category!"],
  },
  tags: {
    type: String,
  },
  originalPrice: {
    type: Number,
  },
  discountPrice: {
    type: Number,
    required: [true, "Please enter your product price!"],
  },
  stock: {
    type: Number,
    required: [true, "Please enter your product stock!"],
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  reviews: [
    {
      user: {
        type: Object,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
      productId: {
        type: String,
      },
      createdAt:{
        type: Date,
        default: Date.now(),
      }
    },
  ],
  ratings: {
    type: Number,
  },
  shopId: {
    type: String,
    required: true,
  },
  shop: {
    type: Object,
    required: true,
  },
  sold_out: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});




const Product = mongoose.model('Product', productSchema);


//ebd product schema

// Create User model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);


// Create Brand model
const brandSchema = new mongoose.Schema({
  brandname: String,
  brandimage:String,
  categories: String,
  subcategories:[String],


});

const Brand = mongoose.model('Brand', brandSchema);




//shop schema
const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your shop name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your shop email address"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password should be greater than 6 characters"],
    select: false,
  },
  exchangeRate: {
    type: Number,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: "Seller",
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  zipCode: {
    type: Number,
    required: true,
  },
  withdrawMethod: {
    type: Object,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  transections: [
    {
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        default: "Processing",
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});


const Shop = mongoose.model('Shop', shopSchema);



// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/',(req,res)=>{
  res.send('Vercel backend app creation')
})

app.post('/addbrand', async (req, res) => {
  try {
    const { brandname, brandimage, categories, subcategories } = req.body;
    const brand = new Brand({ brandname, brandimage, categories, subcategories });
    await brand.save();
    res.status(200).json({ message: 'brand added successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to add brand' });
  }
});




//fetch brands
app.get('/fetchbrands', async (req,res) => {
  try{
    const brand = await Brand.find({});
    res.status(200).json(brand);
  }
  catch(error){
    console.log(error);
    res.status(500).json({error:'Brand not available'});
  }

})


app.get('/fetchbrands/:brandname', async(req,res)=>{
  try{
    const {brandname} = req.params;

    const brand = await Brand.find({brandname});
    if(!brand){
      res.status(404).json({message:'you have not added any item to cart'});
    }
    res.status(200).json(brand);
  }
  catch(error){
    res.status(500).json({message:error.message});

  }
  
})



app.get('/fetchsubcategories', async (req, res) => {
  try {
    const brands = await Brand.find({}); // Fetch all brands
    const subcategories = brands.reduce((acc, brand) => {
      // Extract individual subcategories from each brand's subcategories array
      brand.subcategories.forEach(subcategory => {
        if (!acc.includes(subcategory)) {
          acc.push(subcategory);
        }
      });
      return acc;
    }, []);
    
    res.status(200).json(subcategories);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Subcategories not available' });
  }
});


//lets now try and update brand by brandname
app.put('/brandupdate/:brandname', async (req, res) => {
  try {
    const { brandname } = req.params;
    const updatedBrand = await Brand.findOneAndUpdate(
      { brandname: brandname }, // Find the brand by its name
      req.body, // Update the brand with the request body data
      { new: true } // Return the updated brand as the response
    );

    // If brand fetched cannot be found
    if (!updatedBrand) {
      return res.status(404).json({ message: `Cannot find brand with name ${brandname}` });
    }

    res.status(200).json(updatedBrand);
    console.log("Data updated successfully");

  } catch (error) {
    res.status(500).json({ message: error.message });

  }
});


// Register user route
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

//get userdata using email
app.get('/usersdata/:email', async(req,res)=>{
  try{
    const {email} = req.params;

    const user = await User.find({email});
    if(!user){
      res.status(404).json({message:'you have not added any item to cart'});
    }
    res.status(200).json(user);
  }
  catch(error){
    res.status(500).json({message:error.message});

  }
  
})


//products section

//add new product
app.post('/addproduct', async(req,res) =>{
  try{
    const {productname,quantity,price,image,sellername,phone,location,category,brand} = req.body;
    const product = new Product({productname, quantity, price, image, sellername, phone, location, category,brand});
    await product.save();
    res.status(200).json({message: 'product saved successfully'});

  }
  catch (error){
    res.status(500).json({error:'product add failed'})
  }
});


//fetch all products
app.get('/productlist', async(req, res)=>{
  try{
    const product = await Product.find().sort({
        createdAt: -1,
      });
    res.status(200).json(product);

  }
  catch(error){
    console.log(error);
    res.status(500).json({error:'product not found'})
  }
})

//fetch products by id
//try to fetch a user by thier id
app.get('/productlist/:id', async(req, res) => {
    try {
        const {id} = req.params;
        const product = await Product.findById(id);
        res.status(200).json(product)
        
    } catch (error) {
        res.status(500).json({message:error.message});
        
    }
})


//fetch products by shopId
app.get('/products/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Assuming you have a Product model with a 'shopId' field
    const products = await Product.find({ shopId });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



//fetch products by seller and name

app.get('/productlist/:sellername', async(req, res) => {
    try {
        const {sellername} = req.params;
        const product = await Product.findById(sellername);
        res.status(200).json(product)
        
    } catch (error) {
        res.status(500).json({message:error.message});
        
    }
})


//fetch by seller name
app.get('/productshop/:shopName', async (req, res) => {
  try {
    const { shopName } = req.params;
    
    // Assuming you have a Shop model with a 'name' field
    const shop = await Shop.findOne({ name: shopName });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Assuming you have a Product model with a 'shopId' field
    const products = await Product.find({ shopId: shop._id });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



//fetch product by category
app.get('/productlistcategory/:category', async(req,res)=>{
  try{
    const {category} = req.params;

    const product = await Product.find({category});
    if(!product){
      res.status(404).json({message:'you have no category'});
    }
    res.status(200).json(product);
  }
  catch(error){
    res.status(500).json({message:error.message});

  }
  
})



//search a product by category and its max and min price
app.get('/productlistcategoryandprice/:category1/:price', async (req, res) => {
  try {
    const { category1, price } = req.params;
    const { minPrice,maxPrice } = req.query;

    // Build the filter object based on the two categories and price range
    const filter = {
      $or: [{ category: category1 }],
    };
    if (minPrice !== undefined) {
      filter.price = { $gte: parseFloat(minPrice) };
    }
    if (maxPrice !== undefined) {
      if (filter.price) {
        filter.price.$lte = parseFloat(maxPrice);
      } else {
        filter.price = { $lte: parseFloat(maxPrice) };
      }
    }

    const products = await Product.find(filter);

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: 'No products found for the given categories and price range.' });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//search by brandname and category
app.get('/productlistcategoryandbrand/:brand/:category', async (req, res) => {
  try {
    const { brand, category } = req.params;

    // Build the filter object based on the specified brand and category
    const filter = {
      brand: { $regex: brand, $options: 'i' }, // Using regex with case-insensitive option 'i' to match partial brand names
      category,
    };

    const products = await Product.find(filter);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for the given brand and category.' });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




//initiate a search

app.get('/productlistsearch/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const products = await Product.find({
      $or: [
        { productname: { $regex: query, $options: 'i' } }, // Search for name or letter in product name
        { sellername: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }, // Search for name or letter in seller name
      ]
    });
    if (products.length === 0) {
      res.status(404).json({ message: 'No products found' });
    } else {
      res.status(200).json(products);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});









// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});


//fetch users
app.get('/usersdata', async(req, res)=> {
  try{
    const user = await User.find({});
    res.status(200).json(user);

  }catch(error){
    console.log(error);
    res.status(500).json({error:'Data not fetched'})
  }

});

//try to fetch a user by thier id
app.get('/usersdata/:id', async(req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id);
        res.status(200).json(user)
        
    } catch (error) {
        res.status(500).json({message:error.message});
        
    }
})

//find username
app.get('/userdata/:email', async(req,res)=>{
  try{
    const {email} = req.params;

    const user = await User.find({email});
    if(!user){
      res.status(404).json({message:'you have not added any item to cart'});
    }
    res.status(200).json(user);
  }
  catch(error){
    res.status(500).json({message:error.message});

  }
  
})








//get all sellers
//fetch all products
app.get('/sellers', async(req, res)=>{
  try{
    const seller = await Shop.find({});
    res.status(200).json(seller);

  }
  catch(error){
    console.log(error);
    res.status(500).json({error:'product not found'})
  }
})



//search products by seller and category
//search by brandname and category
app.get('/productlistcategoryandseller/:sellername/:category', async (req, res) => {
  try {
    const { sellername, category } = req.params;

    // Build the filter object based on the specified brand and category
    const filter = {
      sellername: { $regex: sellername, $options: 'i' }, // Using regex with case-insensitive option 'i' to match partial brand names
      category,
    };

    const products = await Product.find(filter);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for the given brand and category.' });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});






// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
