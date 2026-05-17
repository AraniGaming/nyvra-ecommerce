const dotenv = require("dotenv");
const csv = require("csvtojson");
const connectDB = require("./config/db");
const Product = require("./models/productModel");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const importData = async () => {
  try {
    await connectDB();
    console.log("🟢 Connected to Database.");

    // Clear old data to prevent duplicates
    await Product.deleteMany({});
    console.log("🧹 Cleared old products.");

    // Path to your premium CSV file
    const csvFilePath = path.join(__dirname, "WEBSITE(Sheet1)-2.csv"); 
    const productsCSV = await csv().fromFile(csvFilePath);

    // Map rows directly to numbers and values
    const products = productsCSV.map((item) => {
      return {
        // Basic Info
        name: `${item.brand || ''} ${item.model || ''} ${item.variantName || ''}`.trim(),
        price: Number(item.price) || 0,
        image: item.image || '',
        brand: item.brand || 'Unknown',
        category: item.category || "smartphone",
        stock: 50,
        description: item.description || `${item.processor}, ${item.ram}GB RAM, ${item.storage}GB Storage`,

        // Tech Specs
        ram: Number(item.ram) || 0,
        storage: Number(item.storage) || 0,
        battery: Number(item.battery) || 0,
        chargingSpeed: Number(item.chargingSpeed) || 0,
        refreshRate: Number(item.refreshRate) || 60,
        processor: item.processor || 'Unknown',
        processorTier: item.processorTier || "midrange",

        // Smart Recommendation Scores (PARSING REAL VALUES OUT OF 100)
        gamingScore: Number(item.gamingScore) || 50,
        cameraScore: Number(item.cameraScore) || 50,
        batteryScore: Number(item.batteryScore) || 50,
        performanceScore: Number(item.performanceScore) || 50,
        displayScore: Number(item.displayScore) || 50,
        designScore: Number(item.designScore) || 50,
        valueScore: Number(item.valueScore) || 50,

        // Segments
        priceSegment: item.priceSegment || "midrange",
        idealFor: item.idealFor ? item.idealFor.split(",").map(str => str.trim()) : []
      };
    });

    // Upload clean array of data to MongoDB cluster
    await Product.insertMany(products);

    console.log(`✅ SUCCESS: ${products.length} Premium Products Imported successfully!`);
    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

importData();