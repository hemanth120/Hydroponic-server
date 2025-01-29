const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mqtt = require("mqtt");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MQTT Broker Configuration
const mqttClient = mqtt.connect("mqtt://34.29.202.158:1883"); // Replace with your MQTT broker's IP and port

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

// Store latest sensor values
const sensorData = {
  temperature: null,
  humidity: null,
  ph: null,
  ec: null,
 
};

// Subscribe to MQTT topics for sensor data
const topics = [
  "dht/temp",
  "dht/hum",
  "sensor/ph",
  "sensor/ec",
  
];

mqttClient.subscribe(topics, (err) => {
  if (err) {
    console.error("Failed to subscribe to topics:", err);
  } else {
    console.log(`Subscribed to topics: ${topics.join(", ")}`);
  }
});

// Handle incoming MQTT messages and update sensorData
mqttClient.on("message", (topic, message) => {
  const value = parseFloat(message.toString());
  console.log(`Received message from topic "${topic}": ${value}`);
  switch (topic) {
    case "dht/temp":
      sensorData.temperature = value;
      break;
    case "dht/hum":
      sensorData.humidity = value;
      break;
    case "sensor/ph":
      sensorData.ph = value;
      break;
    case "sensor/ec":
      sensorData.ec = value;
      break;

    default:
      console.warn(`Unrecognized topic: ${topic}`);
  }
});

// Endpoint to fetch the latest sensor values
app.get("/temp", (req, res) => {
  res.json({ temperature: sensorData.temperature });
});

app.get("/humid", (req, res) => {
  res.json({ humidity: sensorData.humidity });
});

app.get("/ph", (req, res) => {
  res.json({ ph: sensorData.ph });
});

app.get("/ec", (req, res) => {
  res.json({ ec: sensorData.ec });
});

// Button endpoints (POST)
app.post("/buttons", (req, res) => {
  const { button, state } = req.body;
  const topic = button === 1 ? "control/button1" : "control/button2";
  const message = state ? "ON" : "OFF";

  mqttClient.publish(topic, message, (err) => {
    if (err) {
      console.error(`Failed to publish to ${topic}:`, err);
      res.status(500).send(`Failed to send data to ${topic}`);
    } else {
      console.log(`Sent message to topic "${topic}": ${message}`);
      res.status(200).send(`Data sent to ${topic} successfully`);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
