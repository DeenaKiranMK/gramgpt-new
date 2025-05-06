import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import bcrypt from 'bcrypt'; // Add bcrypt for password hashing

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const app = express();
app.use(cors());
app.use(express.json());

// Open or create the database
const db = new sqlite3.Database('./db.sqlite3', (err) => {

  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
  }
});

// Example route: Create a team table
app.get('/init-db', (req, res) => {
  db.run(`
    CREATE TABLE IF NOT EXISTS team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      captain TEXT
    );
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
      res.status(500).send('Database initialization failed');
    } else {
      res.send('Database initialized');
    }
  });
});

// Example route: Add a team
app.post('/teams', (req, res) => {
  const { name, captain } = req.body;
  db.run('INSERT INTO team (name, captain) VALUES (?, ?)', [name, captain], function(err) {
    if (err) {
      console.error('Error inserting team:', err);
      res.status(500).json({ message: 'Failed to add team' });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

// Example route: Get all teams
app.get('/teams', (req, res) => {
  db.all('SELECT * FROM team', (err, rows) => {
    if (err) {
      console.error('Error retrieving teams:', err);
      res.status(500).json({ message: 'Failed to retrieve teams' });
    } else {
      res.json(rows);
    }
  });
});

// 🌱 Crop Recommendation API
app.post('/crop-recommendation', (req, res) => {
  const { soil, water, lastCrop, rainfall, temperature } = req.body;

  // Manual Expert Recommendation
  let crop = "Soybean"; // Default
  if (soil === 'black' && rainfall === 'heavy') {
    crop = "Rice";
  } else if (soil === 'red' && temperature === 'hot') {
    crop = "Cotton";
  } else if (soil.includes('sandy') && rainfall === 'low') {
    crop = "Millets";
  }

  res.json({ manualRecommendation: crop });
});

// 🛑 Speech Synthesis API (Text-to-Speech)
app.post('/speak-text', (req, res) => {
  const { text } = req.body;
  res.json({ message: `Speaking: ${text}` });
});

// 🔬 Predict Crop Disease Based on Weather
app.get('/predict-disease', async (req, res) => {
  const city = req.query.city || 'Hyderabad';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY`; // Ensure API Key is added

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    const data = await response.json();
    const humidity = data.main.humidity;
    const temperature = data.main.temp - 273.15; // Kelvin to Celsius

    let risk = '';
    if (humidity > 80 && temperature > 25) {
      risk = "⚠️ High Risk of fungal diseases.";
    } else if (humidity < 40) {
      risk = "✅ Low Risk.";
    } else {
      risk = "⚠️ Moderate Risk.";
    }
    
    res.json({ diseaseRisk: risk });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ❓ Submit a Question to Experts
app.post('/submit-question', (req, res) => {
  const { query } = req.body;
  if (!query.trim()) {
    return res.status(400).json({ message: "Please enter a question." });
  }
  res.json({ message: "✅ Question sent to experts! You'll get a reply soon." });
});

// 🏠 Dashboard Route (Provides Schemes)
app.get('/dashboard-data', (req, res) => {
  res.json({
    message: "Dashboard connected!",
    schemes: ["Govt Schemes", "Loan Info", "Crop", "Order", "Medical"]
  });
});

// 🌱 Disease Report Route (Provides Symptoms & Experts)
app.get('/disease-data', (req, res) => {
  res.json({
    symptoms: ["Yellow Leaves", "Brown Spots", "Wilting", "Stunted Growth"],
    experts: [
      { name: "Dr. Ravi Kumar", specialty: "Soil Specialist", contact: "9876543210" },
      { name: "Dr. Ananya Sharma", specialty: "Plant Pathologist", contact: "9123456780" },
      { name: "Mr. Suresh Patel", specialty: "Farming Consultant", contact: "9988776655" }
    ]
  });
});

// 🏥 Doctor Registration & Booking
const doctors = [];

app.post('/register-doctor', (req, res) => {
  const { name, specialization, availableTime, email } = req.body;
  const doctor = { name, specialization, availableTime, email };
  doctors.push(doctor);
  res.json({ message: "Doctor registered successfully!", doctor });
});

app.get('/doctors-list', (req, res) => {
  res.json(doctors);
});

// 🚁 Drone Rentals API
const droneRentals = [];

app.post('/rent-drone', (req, res) => {
  const { farmerName, farmerPhone, farmerAddress, droneType, totalCost } = req.body;
  const rental = { farmerName, farmerPhone, farmerAddress, droneType, totalCost };
  droneRentals.push(rental);
  res.json({ message: "Drone rental request placed successfully!", rental });
});

app.get('/drone-rentals', (req, res) => {
  res.json(droneRentals);
});

// 🏛️ Govt Schemes API
app.get('/govt-schemes', (req, res) => {
  res.json([
    { name: "Pradhan Mantri Fasal Bima Yojana", description: "Comprehensive crop insurance against natural calamities.", applyUrl: "https://pmfby.gov.in/" },
    { name: "Kisan Credit Card (KCC)", description: "Easy, low-interest credit for agricultural needs.", applyUrl: "https://www.kisan.gov.in/credit_card.aspx" },
    { name: "Paramparagat Krishi Vikas Yojana", description: "Support for organic farming and certification.", applyUrl: "https://pgsindia-ncof.gov.in/" }
  ]);
});

// 🛒 Order Management API
const orders = [];

app.post('/place-order', (req, res) => {
  const { itemName, quantity, buyerName, buyerContact, deliveryAddress } = req.body;
  if (!itemName || !quantity || !buyerName || !buyerContact || !deliveryAddress) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  const order = { itemName, quantity, buyerName, buyerContact, deliveryAddress };
  orders.push(order);
  res.json({ message: "Order placed successfully!", order });
});

app.get('/orders', (req, res) => {
  res.json(orders);
});

// 🔐 User Login Route with bcrypt password comparison
const users = [{ name: "John Doe", email: "user@example.com", password: "$2b$10$12345" }]; // Using hashed password for example

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (user && bcrypt.compareSync(password, user.password)) {
    res.json({ message: "Login successful!", redirect: "dashboard.html" });
  } else {
    res.status(401).json({ message: "Invalid email or password." });
  }
});

// 🆕 User Signup Route with password hashing
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email already registered!" });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ name, email, password: hashedPassword });
  res.json({ message: "Signup successful! Please log in." });
});

// 🏁 Start the Server on Port 4000
app.get('/', (req, res) => {
  res.send('🌾 Welcome to the eKrishi Server!');
});

app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000');
});
