import express from "express";
//import mysql from "mysql";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

// const db = mysql.createConnection({
//   host: `mscf.c8ffb1ghnv2r.us-east-1.rds.amazonaws.com`,
//   user: `MSCF`,
//   password: `Cambr1dg323`,
//   database: `sys`,
// });


let dbPromise2 = new sqlite3.Database('./data/tracking.db');
const dbPromise = open({
  filename: './data/tracking.db',
  driver: sqlite3.Database
});



app.get("/", (req, res) => {
  res.json("hello");
});


app.get("/trackingRecent", async (req, res) => {
  try {
    const db = await dbPromise;
    const data = await db.all("SELECT * FROM TRACKING ORDER BY TIME_LAST_ACTION DESC LIMIT 1");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/trackingAll", async (req, res) => {
  try {
    const db = await dbPromise;
    const data = await db.all("SELECT * FROM TRACKING");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/trackingTime/", async (req, res ) => {
  console.log(req.params.value)
  try {
    const value = req.query.value; // Extract Tin from query parameters
    const db = await dbPromise;
    const query = "SELECT * FROM TRACKING ORDER BY TIME_LAST_ACTION DESC LIMIT " + value.toString()
    const data = await db.all(query);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/startLocation", async (req, res) => {
  // updates all value (should be just one in the database)
  try{
    const db = await dbPromise;
    const queryUpdate = "UPDATE TRACKING_START SET LAT = (?), LON = (?),  NAME = (?) ";
    if(req.body.lat != null && req.body.lon !=null){
    const values = [
      req.body.lat,
      req.body.lon,
      req.body.name,
    ];
    await db.run(queryUpdate, values);
    res.json({ message: "Location of start updated successfully" });
    } else {
    res.status(500).json({ error: "null data" });
  }
  } catch (err) {
    console.error("Error in /startLocation:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/clearData", async (req, res) => {
  // updates all value (should be just one in the database)
  try{
    const db = await dbPromise;
    const queryUpdate = "DELETE FROM TRACKING";
    await db.run(queryUpdate);
    res.json({ message: "Data cleared from TRACKING" });
  } catch (err) {
    console.error("Error in /clearData:", err.message);
  }
});

app.get("/startLocation", async (req, res) => {
  try {
    const db = await dbPromise;
    const data = await db.all("SELECT * FROM TRACKING_START");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/endLocation", async (req, res) => {
  // updates all value (should be just one in the database)
  try{
    const db = await dbPromise;
    const queryUpdate = "UPDATE TRACKING_END SET LAT = (?), LON = (?),  NAME = (?) ";
    if(req.body.lat != null && req.body.lon !=null){
    const values = [
      req.body.lat,
      req.body.lon,
      req.body.name,
    ];
    await db.run(queryUpdate, values);
    res.json({ message: "Location of end updated successfully" });
  } else {
    res.status(500).json({ error: "null data" });
  }
  } catch (err) {
    console.error("Error in /endLocation:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/", async (req, res) => {
  // updates all value (should be just one in the database)
  let date = new Date()
  let mon = parseInt(date.getMonth()) + 1
  let dateString = date.getFullYear()+ "-" + mon.toString() + 
  "-" + date.getDate() + " " + date.getHours() +
  ":" + date.getMinutes() +
  ":" + date.getSeconds()
  try{
    const db = await dbPromise;
    const queryUpdate = "INSERT INTO TRACKING VALUES (?, ?, ?, ?, ?, ?)";
    if(req.body.lat != null && req.body.lon !=null){
    const values = [
      req.body.lat,
      req.body.lat_dir,
      req.body.lon,
      req.body.lon_dir,
      req.body.speed,
      dateString,
    ];
    await db.run(queryUpdate, values);
    res.json({ message: "Data added successfully" });
  }  else {
    res.status(500).json({ error: "null data" });
  }
  } catch (err) {
    console.error("Error in /endLocation:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/endLocation", async (req, res) => {
  try {
    const db = await dbPromise;
    const data = await db.all("SELECT * FROM TRACKING_END");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(8800, () => {
  console.log("Connected to backend.");
});
