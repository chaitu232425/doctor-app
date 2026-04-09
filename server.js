const express = require("express");
const neo4j = require("neo4j-driver");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 Neo4j Connection
const driver = neo4j.driver(
  "neo4j+s://d0d88f8a.databases.neo4j.io",
  neo4j.auth.basic("d0d88f8a", "GntIvcHXiHAQHQMvLUxYze8esoIw4XaBGvtiwGBVWyk")
);

// ================= TEST =================
app.get("/test", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run("RETURN 'Connected to Neo4j' AS msg");
    res.send(result.records[0].get("msg"));
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  const session = driver.session();
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await session.run(
      `MATCH (u:User {email:$email}) RETURN u`,
      { email }
    );

    if (existing.records.length > 0) {
      return res.status(400).json({ message: "Account already exists" });
    }

    await session.run(
      `
      CREATE (u:User {
        name:$name,
        email:$email,
        password:$password,
        role:$role
      })
      `,
      { name, email, password, role }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    await session.close();
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const session = driver.session();
  const { email, password } = req.body;

  try {
    const result = await session.run(
      `MATCH (u:User {email:$email, password:$password}) RETURN u`,
      { email, password }
    );

    if (result.records.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    const user = result.records[0].get("u").properties;
    res.json(user);

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= ADD DOCTOR =================
app.post("/add-doctor", async (req, res) => {
  const session = driver.session();
  const { name, hospital, specialization, role } = req.body;

  if (role !== "admin") {
    return res.status(403).json({ message: "Only admin can add doctors" });
  }

  try {
    const existing = await session.run(
      `MATCH (d:Doctor {name:$name, hospital:$hospital, specialization:$specialization}) RETURN d`,
      { name, hospital, specialization }
    );

    if (existing.records.length > 0) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    await session.run(
      `CREATE (d:Doctor {name:$name, hospital:$hospital, specialization:$specialization})`,
      { name, hospital, specialization }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= DELETE DOCTOR =================
app.delete("/delete-doctor", async (req, res) => {
  const session = driver.session();
  const { name, hospital, specialization, role } = req.body;

  if (role !== "admin") {
    return res.status(403).json({ message: "Only admin can delete doctors" });
  }

  try {
    await session.run(
      `MATCH (d:Doctor {name:$name, hospital:$hospital, specialization:$specialization}) DETACH DELETE d`,
      { name, hospital, specialization }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= GET DOCTORS =================
app.get("/get-doctors", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`MATCH (d:Doctor) RETURN d`);
    const doctors = result.records.map(r => r.get("d").properties);
    res.json(doctors);

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= BOOK REQUEST =================
app.post("/book", async (req, res) => {
  const session = driver.session();
  const { patient, doctor } = req.body;

  try {
    await session.run(
      `
      MERGE (p:Patient {name:$patient})
      MATCH (d:Doctor {name:$doctor})
      MERGE (p)-[r:BOOKED]->(d)
      SET r.status = "PENDING"
      `,
      { patient, doctor }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= DOCTOR VIEW =================
app.post("/doctor-appointments", async (req, res) => {
  const session = driver.session();
  const { doctorName } = req.body;

  try {
    const result = await session.run(
      `
      MATCH (p:Patient)-[r:BOOKED]->(d:Doctor {name:$doctorName})
      RETURN p.name AS patient, r.status AS status, r.time AS time
      `,
      { doctorName }
    );

    const data = result.records.map(r => ({
      patient: r.get("patient"),
      status: r.get("status"),
      time: r.get("time")
    }));

    res.json(data);

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= ACCEPT =================
app.post("/accept", async (req, res) => {
  const session = driver.session();
  const { patient, doctor, time } = req.body;

  try {
    await session.run(
      `
      MATCH (p:Patient {name:$patient})-[r:BOOKED]->(d:Doctor {name:$doctor})
      SET r.status = "ACCEPTED", r.time = $time
      `,
      { patient, doctor, time }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= REJECT =================
app.post("/reject", async (req, res) => {
  const session = driver.session();
  const { patient, doctor } = req.body;

  try {
    await session.run(
      `
      MATCH (p:Patient {name:$patient})-[r:BOOKED]->(d:Doctor {name:$doctor})
      SET r.status = "REJECTED"
      `,
      { patient, doctor }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ================= PATIENT VIEW =================
app.post("/my-appointments", async (req, res) => {
  const session = driver.session();
  const { patient } = req.body;

  try {
    const result = await session.run(
      `
      MATCH (p:Patient {name:$patient})-[r:BOOKED]->(d:Doctor)
      RETURN d.name AS doctor, r.status AS status, r.time AS time
      `,
      { patient }
    );

    const data = result.records.map(r => ({
      doctor: r.get("doctor"),
      status: r.get("status"),
      time: r.get("time")
    }));

    res.json(data);

  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// ✅ COMPLETE APPOINTMENT
app.post("/complete", async (req, res) => {
  const session = driver.session();
  const { patient, doctor, completedAt } = req.body;

  try {
    await session.run(
      `
      MATCH (p:Patient {name:$patient})-[r:BOOKED]->(d:Doctor {name:$doctor})
      SET r.status = "COMPLETED",
          r.completedAt = $completedAt
      `,
      { patient, doctor, completedAt }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("COMPLETE ERROR:", err);
    res.status(500).send(err.message);
  } finally {
    await session.close();
  }
});

// 🔁 KEEP ALIVE ROUTE
app.get("/ping", async (req, res) => {
  const session = driver.session();

  try {
    await session.run("RETURN 1");
    res.send("Server + DB Alive ✅");
  } catch (err) {
    res.status(500).send("Error ❌");
  } finally {
    await session.close();
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));