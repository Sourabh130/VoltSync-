/*
// This simulates the OCPP Heartbeat from physical chargers
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

console.log("Starting OCPP Hardware Simulator...");

setInterval(async () => {
    console.log("--- Pinging Chargers (Heartbeat) ---");
    
    // Logic: Fetch all stations from DB.
    // Randomly select 10% to fail (simulate hardware drop).
    // Update the 'lastHeartbeat' timestamp for the remaining 90%.
    
    const dropChance = Math.random();
    if(dropChance > 0.9) {
        console.log("Hardware Fault Simulated: Station 2 Offline.");
        // db.stations.updateOne({ id: 2 }, { status: 'offline' })
    } else {
        console.log("All stations reporting online.");
        // db.stations.updateMany({}, { lastHeartbeat: new Date() })
    }
}, 10000); // Runs every 10 seconds for hackathon demo purposes

*/

const mongoose = require('mongoose');
const Station = require('./models/Station'); // This links to your Station model!
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("OCPP Simulator Connected to Database!"))
  .catch(err => console.log(err));

console.log("Starting OCPP Hardware Simulator...");
console.log("Simulating hardware heartbeats every 10 seconds...");

// This interval runs every 10 seconds (10000 ms)
setInterval(async () => {
    try {
        console.log("--- Pinging Chargers (Heartbeat) ---");
        
        // Randomly decide if a hardware fault happens (10% chance)
        const dropChance = Math.random();
        
        if (dropChance > 0.9) {
            console.log("⚠️ Hardware Fault Simulated: A station went offline.");
            // Actually find an available station in the database and turn it offline
            const stationToFail = await Station.findOne({ status: 'available' });
            if (stationToFail) {
                stationToFail.status = 'offline';
                await stationToFail.save();
            }
        } else {
            console.log("✅ All stations reporting online.");
            // Reset any offline stations back to available (simulating a reboot)
            await Station.updateMany({ status: 'offline' }, { status: 'available' });
        }
    } catch (err) {
        console.error("Simulator Error:", err.message);
    }
}, 10000);