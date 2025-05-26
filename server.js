const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { MongoClient, ObjectId } = require("mongodb")
const path = require("path")

const app = express()
const PORT = 3000
const JWT_SECRET = "MyVeryVerySecretKey123456789"
const MONGODB_URI = "mongodb+srv://eketcum61:U1r9h4aBA5OeXadF@cluster0.p1trykg.mongodb.net/name?retryWrites=true&w=majority&appName=Cluster0"

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  if (req.method === "OPTIONS") {
    res.sendStatus(200)
  } else {
    next()
  }
})

// MongoDB connection
let db
let client

async function connectToMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    db = client.db()
    console.log("Connected to MongoDB")

    // Initialize sample data if collections are empty
    await initializeSampleData()
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

async function initializeSampleData() {
  try {
    // Initialize inventory if empty
    const inventoryCount = await db.collection("inventory").countDocuments()
    if (inventoryCount === 0) {
      const initialInventory = [
        { name: "Hard Drive 1TB", quantity: 25, price: 89.99 },
        { name: "RAM 8GB DDR4", quantity: 40, price: 45.99 },
        { name: "Power Supply 650W", quantity: 15, price: 79.99 },
        { name: "Motherboard ATX", quantity: 8, price: 129.99 },
        { name: "CPU Cooler", quantity: 20, price: 35.99 },
      ]
      await db.collection("inventory").insertMany(initialInventory)
    }

    // Initialize knowledge base if empty
    const kbCount = await db.collection("knowledgeBase").countDocuments()
    if (kbCount === 0) {
      const initialKB = [
        {
          title: "Computer Won't Start",
          problem: "Computer doesn't power on",
          solution:
            "1. Check power cable connections\n2. Verify power outlet works\n3. Check power supply switch\n4. Test with different power cable\n5. If still not working, contact support",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Slow Computer Performance",
          problem: "Computer running slowly",
          solution:
            "1. Restart your computer\n2. Check for Windows updates\n3. Run disk cleanup\n4. Check for malware\n5. Close unnecessary programs\n6. Consider adding more RAM if issue persists",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Internet Connection Issues",
          problem: "Cannot connect to internet",
          solution:
            "1. Check cable connections\n2. Restart router and modem\n3. Run network troubleshooter\n4. Check network adapter settings\n5. Contact ISP if problem persists",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Blue Screen Error",
          problem: "Computer shows blue screen and restarts",
          solution:
            "1. Note the error code\n2. Boot in safe mode\n3. Check for recent hardware/software changes\n4. Run memory diagnostic\n5. Update drivers\n6. Contact support with error code",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      await db.collection("knowledgeBase").insertMany(initialKB)
    }
  } catch (error) {
    console.error("Error initializing sample data:", error)
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (req.user.userType !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// Routes

// Auth routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, userType, companyName } = req.body

    if (!username || !email || !password || !userType) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (!["individual", "business", "admin"].includes(userType)) {
      return res.status(400).json({ error: "Invalid user type" })
    }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      userType,
      companyName: userType === "business" ? companyName : null,
      createdAt: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)
    const userId = result.insertedId

    // Generate token
    const token = jwt.sign({ id: userId, username, email, userType }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      message: "User registered successfully",
      token,
      user: { id: userId, username, email, userType, companyName },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await db.collection("users").findOne({ email })

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        companyName: user.companyName,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Support request routes
app.get("/api/support-requests", authenticateToken, async (req, res) => {
  try {
    const query = {}

    // Filter support requests based on user type
    if (req.user.userType !== "admin") {
      query.userId = new ObjectId(req.user.id)
    }

    const supportRequests = await db.collection("supportRequests").find(query).sort({ createdAt: -1 }).toArray()
    res.json(supportRequests)
  } catch (error) {
    console.error("Get support requests error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/api/support-requests", authenticateToken, async (req, res) => {
  try {
    const { title, description, schedule } = req.body

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" })
    }

    const newSupportRequest = {
      userId: new ObjectId(req.user.id),
      username: req.user.username,
      title,
      description,
      schedule: schedule || null,
      priority: "medium", // Default priority, only admin can change
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("supportRequests").insertOne(newSupportRequest)
    newSupportRequest._id = result.insertedId

    res.json({ message: "Support request created successfully", supportRequest: newSupportRequest })
  } catch (error) {
    console.error("Create support request error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/api/support-requests/:id", authenticateToken, async (req, res) => {
  try {
    const supportRequestId = new ObjectId(req.params.id)
    const { status, quote, notes, priority } = req.body

    const supportRequest = await db.collection("supportRequests").findOne({ _id: supportRequestId })

    if (!supportRequest) {
      return res.status(404).json({ error: "Support request not found" })
    }

    // Check permissions
    if (req.user.userType !== "admin" && !supportRequest.userId.equals(new ObjectId(req.user.id))) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Prepare update object
    const updateData = { updatedAt: new Date() }

    if (status) updateData.status = status
    if (quote) updateData.quote = quote
    if (notes) updateData.notes = notes

    // Only admin can change priority
    if (priority && req.user.userType === "admin") {
      updateData.priority = priority
    }

    await db.collection("supportRequests").updateOne({ _id: supportRequestId }, { $set: updateData })

    const updatedSupportRequest = await db.collection("supportRequests").findOne({ _id: supportRequestId })
    res.json({ message: "Support request updated successfully", supportRequest: updatedSupportRequest })
  } catch (error) {
    console.error("Update support request error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Knowledge base routes
app.get("/api/knowledge-base", async (req, res) => {
  try {
    const knowledgeBase = await db.collection("knowledgeBase").find({}).sort({ createdAt: -1 }).toArray()
    res.json(knowledgeBase)
  } catch (error) {
    console.error("Get knowledge base error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/api/knowledge-base/search", async (req, res) => {
  try {
    const { q } = req.query
    let query = {}

    if (q) {
      const searchRegex = new RegExp(q, "i")
      query = {
        $or: [{ title: searchRegex }, { problem: searchRegex }, { solution: searchRegex }],
      }
    }

    const results = await db.collection("knowledgeBase").find(query).sort({ createdAt: -1 }).toArray()
    res.json(results)
  } catch (error) {
    console.error("Search knowledge base error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Knowledge base management (admin only)
app.post("/api/knowledge-base", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, problem, solution } = req.body

    if (!title || !problem || !solution) {
      return res.status(400).json({ error: "Title, problem, and solution are required" })
    }

    const newArticle = {
      title,
      problem,
      solution,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("knowledgeBase").insertOne(newArticle)
    newArticle._id = result.insertedId

    res.json({ message: "Article created successfully", article: newArticle })
  } catch (error) {
    console.error("Create knowledge base article error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/api/knowledge-base/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const articleId = new ObjectId(req.params.id)
    const { title, problem, solution } = req.body

    const updateData = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (problem) updateData.problem = problem
    if (solution) updateData.solution = solution

    await db.collection("knowledgeBase").updateOne({ _id: articleId }, { $set: updateData })

    const updatedArticle = await db.collection("knowledgeBase").findOne({ _id: articleId })

    if (!updatedArticle) {
      return res.status(404).json({ error: "Article not found" })
    }

    res.json({ message: "Article updated successfully", article: updatedArticle })
  } catch (error) {
    console.error("Update knowledge base article error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.delete("/api/knowledge-base/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const articleId = new ObjectId(req.params.id)

    const result = await db.collection("knowledgeBase").deleteOne({ _id: articleId })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Article not found" })
    }

    res.json({ message: "Article deleted successfully" })
  } catch (error) {
    console.error("Delete knowledge base article error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Inventory routes (admin only)
app.get("/api/inventory", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inventory = await db.collection("inventory").find({}).sort({ name: 1 }).toArray()
    res.json(inventory)
  } catch (error) {
    console.error("Get inventory error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.put("/api/inventory/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const itemId = new ObjectId(req.params.id)
    const { name, quantity, price } = req.body

    const updateData = {}
    if (name) updateData.name = name
    if (quantity !== undefined) updateData.quantity = quantity
    if (price !== undefined) updateData.price = price

    await db.collection("inventory").updateOne({ _id: itemId }, { $set: updateData })

    const updatedItem = await db.collection("inventory").findOne({ _id: itemId })

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" })
    }

    res.json({ message: "Item updated successfully", item: updatedItem })
  } catch (error) {
    console.error("Update inventory error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Analytics routes (admin only)
app.get("/api/analytics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const supportRequests = await db.collection("supportRequests").find({}).toArray()

    // Priority distribution
    const priorityCount = {}
    supportRequests.forEach((supportRequest) => {
      priorityCount[supportRequest.priority] = (priorityCount[supportRequest.priority] || 0) + 1
    })

    // Performance metrics (mock data for demo)
    const avgCompletionTime = "2.5 hours"
    const satisfactionRating = 4.2

    const analytics = {
      totalSupportRequests: supportRequests.length,
      openSupportRequests: supportRequests.filter((sr) => sr.status === "open").length,
      closedSupportRequests: supportRequests.filter((sr) => sr.status === "closed").length,
      priorityDistribution: Object.entries(priorityCount).map(([priority, count]) => ({
        priority,
        count,
      })),
      avgCompletionTime,
      satisfactionRating,
    }

    res.json(analytics)
  } catch (error) {
    console.error("Get analytics error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...")
  if (client) {
    await client.close()
  }
  process.exit(0)
})

// Initialize and start server
connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
  })
