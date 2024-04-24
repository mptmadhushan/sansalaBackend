const port = 4000;
const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const mysql = require("mysql");

app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MySQL connection
const connection = mysql.createConnection({
  host: "sql6.freemysqlhosting.net",
  user: "sql6701655",
  password: "g6jx7pGSYF",
  database: "sql6701655",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// Create table for products
const createProductTable = `
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  available BOOLEAN DEFAULT TRUE
)
`;

connection.query(createProductTable, (err, results) => {
  if (err) {
    console.error("Error creating product table:", err);
    return;
  }
  console.log("Product table created or already exists");
});
// Create table for cart
const createCartTable = `
CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL)

`;

connection.query(createCartTable, (err, results) => {
  if (err) {
    console.error("Error creating cart table:", err);
    return;
  }
  console.log("Cart table created or already exists");
});
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// API for uploading images and creating products
app.post("/upload", upload.single("image"), (req, res) => {
  const { filename } = req.file;
  const imagePath = `http://localhost:${port}/uploads/${filename}`;

  // Insert the image path into the database
  connection.query(
    "INSERT INTO products (name, image, category, new_price, old_price) VALUES (?, ?, ?, ?, ?)",
    [
      req.body.name,
      imagePath,
      req.body.category,
      req.body.new_price,
      req.body.old_price,
    ],
    (error, results) => {
      if (error) {
        console.error("Error inserting product into database:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to upload product" });
        return;
      }
      console.log("Product uploaded and path inserted into database");
      res.json({ success: true, imagePath });
    }
  );
});

// API for deleting products
app.post("/removeproduct", async (req, res) => {
  try {
    await connection.query("DELETE FROM products WHERE id = ?", [req.body.id]);
    console.log("Product removed");
    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove product" });
  }
});

// API for fetching all products
// API for fetching all products
app.get("/allproducts", async (req, res) => {
  try {
    connection.query("SELECT * FROM products", (err, rows) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch products" });
        return;
      }
      console.log("All products fetched");
      res.json(rows);
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
});

// API for fetching a product by ID
app.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    connection.query(
      "SELECT * FROM products WHERE id = ?",
      [productId],
      (err, rows) => {
        if (err) {
          console.error(err);
          res
            .status(500)
            .json({ success: false, message: "Failed to fetch product" });
          return;
        }
        if (rows.length === 0) {
          res
            .status(404)
            .json({ success: false, message: "Product not found" });
          return;
        }
        console.log("Product fetched by ID");
        res.json(rows[0]);
      }
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product" });
  }
});
// API for adding a product to the cart
app.post("/addtocart", async (req, res) => {
  try {
    const { product_id, user_id, name, image, price } = req.body;
    connection.query(
      "INSERT INTO cart (product_id, user_id,name,image,price) VALUES (?, ?,?,?,?)",
      [product_id, user_id, name, image, price],
      (err, results) => {
        if (err) {
          console.error("Error adding product to cart:", err);
          res
            .status(500)
            .json({ success: false, message: "Failed to add product to cart" });
          return;
        }
        console.log("Product added to cart");
        res.json({ success: true, message: "Product added to cart" });
      }
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add product to cart" });
  }
});
// API for fetching cart items by user ID
app.get("/cart/:user_id", async (req, res) => {
  try {
    const userId = req.params.user_id;
    connection.query(
      "SELECT * FROM cart WHERE user_id = ?",
      [userId],
      (err, rows) => {
        if (err) {
          console.error(err);
          res
            .status(500)
            .json({ success: false, message: "Failed to fetch cart items" });
          return;
        }
        console.log("Cart items fetched by user ID");
        res.json(rows);
      }
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch cart items" });
  }
});
app.post("/removefromcart", async (req, res) => {
    try {
      await connection.query("DELETE FROM cart WHERE id = ?", [req.body.id]);
      console.log("Product removed");
      res.json({
        success: true,
        name: req.body.name,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Failed to remove product" });
    }
  });
// Start the server
app.listen(port, () => {
  console.log("Server running on port " + port);
});
