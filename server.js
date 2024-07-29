const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const qr = require("qr-image");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://talha300:talha300@employeeinfo.jqmbcew.mongodb.net/employeeinfo?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Employee Schema
const employeeSchema = new mongoose.Schema({
  empNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  laptopName: String,
  laptopMemory: String, // Ensure laptopMemory is included
  laptopRam: String,
  description: String,
});

const Employee = mongoose.model("Employee", employeeSchema);

// Route to add employee and generate QR code
app.post("/addEmployee", async (req, res) => {
  try {
    const { empNo, name, laptopName, laptopMemory, laptopRam, description } = req.body;

    if (!empNo || !name) {
      return res
        .status(400)
        .json({ message: "Employee Number and Name are required" });
    }

    const existingEmployee = await Employee.findOne({ empNo });
    if (existingEmployee) {
      return res.status(409).json({ message: "Employee already exists" });
    }

    const employee = new Employee({
      empNo,
      name,
      laptopName,
      laptopMemory,
      laptopRam,
      description,
    });
    await employee.save();

    // Format the data as plain text
    const qrTextData = `
      Employee Number: ${empNo}
      Name: ${name}
      Laptop Name: ${laptopName}
      Laptop Memory: ${laptopMemory}
      Laptop RAM: ${laptopRam}
      Description: ${description}
    `;  // Remove any extra whitespace

    // Generate QR code with plain text
    const qrCodeImage = qr.imageSync(qrTextData, { type: "png" });
    const qrCodeBase64 = `data:image/png;base64,${qrCodeImage.toString("base64")}`;

    res.json({ qrCodeUrl: qrCodeBase64, employee });
  } catch (err) {
    console.error("Error handling request:", err);
    res.status(500).json({ message: err.message });
  }
});


// Serve the index.html file when accessing the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
