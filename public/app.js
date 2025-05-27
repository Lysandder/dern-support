
// Global state
let currentUser = null
let authToken = null
let currentSection = "dashboard"
let showingLanding = true

// Function to show notifications
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  // Add styles
  notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 2rem;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
  `

  // Set background color based on type
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#333333"
      break
    case "error":
      notification.style.backgroundColor = "#000000"
      break
    case "warning":
      notification.style.backgroundColor = "#666666"
      break
    default:
      notification.style.backgroundColor = "#000000"
  }

  // Add to page
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Function to show the landing page
function showLandingPage() {
  showingLanding = true
  document.getElementById("landing-section").style.display = "block"
  document.getElementById("auth-section").style.display = "none"
  document.getElementById("dashboard-section").style.display = "none"
  document.getElementById("support-requests-section").style.display = "none"
  document.getElementById("inventory-section").style.display = "none"
  document.getElementById("analytics-section").style.display = "none"
  document.getElementById("nav").style.display = "none"
  document.getElementsByClassName("logo")[0].style.display = "none"
  document.getElementById("user-info").style.display = "none"

  // Load knowledge base articles for public viewing
  loadPublicKnowledgeBase()
}

function showLoginPage() {
  showingLanding = false
  document.getElementById("landing-section").style.display = "none"
  showAuthSection()
}

// Function to show the main application
function showMainApp() {
  document.getElementById("landing-section").style.display = "none"
  document.getElementById("auth-section").style.display = "none"
  document.getElementById("nav").style.display = "flex"
  document.getElementById("user-info").style.display = "flex"

  // Update user info display
  document.getElementById("username-display").textContent = currentUser.username
  document.getElementById("user-type-display").textContent = currentUser.userType

  // Show/hide admin-only elements
  const adminElements = document.querySelectorAll(".admin-only")
  adminElements.forEach((element) => {
    element.style.display = currentUser.userType === "admin" ? "block" : "none"
  })

  // Show/hide customer-only elements
  const customerElements = document.querySelectorAll(".customer-only")
  customerElements.forEach((element) => {
    element.style.display = currentUser.userType !== "admin" ? "block" : "none"
  })

  // Show dashboard by default
  showSection("dashboard")
}

function showAuthSection() {
  document.getElementById("auth-section").style.display = "block"
  document.getElementById("dashboard-section").style.display = "none"
  document.getElementById("support-requests-section").style.display = "none"
  document.getElementById("inventory-section").style.display = "none"
  document.getElementById("analytics-section").style.display = "none"
  document.getElementById("nav").style.display = "none"
  document.getElementsByClassName("logo")[0].style.display = "block"
  document.getElementById("user-info").style.display = "none"
}

// Function to handle user login
async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      authToken = data.token
      currentUser = data.user
      localStorage.setItem("authToken", authToken)
      showMainApp()
      showNotification("Login successful!", "success")
    } else {
      showNotification(data.error, "error")
    }
  } catch (error) {
    showNotification("Login failed. Please try again.", "error")
  }
}

// Function to handle user registration
async function handleRegister(e) {
  e.preventDefault()

  const username = document.getElementById("register-username").value
  const email = document.getElementById("register-email").value
  const password = document.getElementById("register-password").value
  const userType = document.getElementById("user-type").value
  const companyName = document.getElementById("company-name").value
  const companyLocation = document.getElementById("company-location").value

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        userType,
        companyName,
        companyLocation,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      authToken = data.token
      currentUser = data.user
      localStorage.setItem("authToken", authToken)
      showMainApp()
      showNotification("Registration successful!", "success")
    } else {
      showNotification(data.error, "error")
    }
  } catch (error) {
    showNotification("Registration failed. Please try again.", "error")
  }
}

// Function to handle user logout
function logout() {
  localStorage.removeItem("authToken")
  authToken = null
  currentUser = null
  showLandingPage()
  showNotification("Logged out successfully", "success")
}

// Function to verify the token
async function verifyToken() {
  try {
    const response = await fetch("/api/support-requests", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (response.ok) {
      // Token is valid, decode user info from token
      const payload = JSON.parse(atob(authToken.split(".")[1]))
      currentUser = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        userType: payload.userType,
      }
      showMainApp()
    } else {
      // Token is invalid
      localStorage.removeItem("authToken")
      authToken = null
      showLandingPage()
    }
  } catch (error) {
    localStorage.removeItem("authToken")
    authToken = null
    showLandingPage()
  }
}

// Function to set up event listeners
function setupEventListeners() {
  // Auth forms
  document.getElementById("login-form").addEventListener("submit", handleLogin)
  document.getElementById("register-form").addEventListener("submit", handleRegister)

  // Support request form
  document.getElementById("create-support-request-form").addEventListener("submit", handleCreateSupportRequest)

  // Inventory search
  document.getElementById("inventory-search").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchInventory()
    }
  })
}

// Function to toggle the company name field based on user type
function toggleCompanyField() {
  const userType = document.getElementById("user-type").value
  const companyField = document.getElementById("company-field")
  const locationField = document.getElementById("location-field")

  if (userType === "business") {
    companyField.style.display = "block"
    locationField.style.display = "block"
    document.getElementById("company-name").required = true
    document.getElementById("company-location").required = true
  } else {
    companyField.style.display = "none"
    locationField.style.display = "none"
    document.getElementById("company-name").required = false
    document.getElementById("company-location").required = false
  }
}

// Function to load dashboard data
async function loadDashboard() {
  try {
    // Load user support requests count (for customers) or total support requests (for admin)
    const supportRequestsResponse = await fetch("/api/support-requests", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const supportRequests = await supportRequestsResponse.json()

    if (currentUser.userType !== "admin") {
      document.getElementById("user-support-requests-count").textContent = supportRequests.length
    } else {
      document.getElementById("total-support-requests-count").textContent = supportRequests.length
    }

    // Admin-only dashboard data
    if (currentUser.userType === "admin") {
      const inventoryResponse = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const inventory = await inventoryResponse.json()
      document.getElementById("inventory-count").textContent = inventory.length
    }
  } catch (error) {
    console.error("Error loading dashboard:", error)
  }
}

// Function to show a section
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".section")
  sections.forEach((section) => {
    if (section.id !== "auth-section") {
      section.style.display = "none"
    }
  })

  // Show selected section
  document.getElementById(sectionName + "-section").style.display = "block"
  currentSection = sectionName

  // Load section data
  switch (sectionName) {
    case "dashboard":
      loadDashboard()
      break
    case "support-requests":
      loadSupportRequests()
      break
    case "inventory":
      if (currentUser.userType === "admin") {
        loadInventory()
      }
      break
    case "analytics":
      if (currentUser.userType === "admin") {
        loadAnalytics()
      }
      break
  }
}

// Tab switching for auth
function switchTab(tab) {
  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")
  const tabBtns = document.querySelectorAll(".tab-btn")

  tabBtns.forEach((btn) => btn.classList.remove("active"))

  if (tab === "login") {
    loginForm.style.display = "block"
    registerForm.style.display = "none"
    tabBtns[0].classList.add("active")
  } else {
    loginForm.style.display = "none"
    registerForm.style.display = "block"
    tabBtns[1].classList.add("active")
  }
}

// Support Request Functions
function showCreateSupportRequestForm() {
  document.getElementById("create-support-request-form").style.display = "block"
}

function hideCreateSupportRequestForm() {
  document.getElementById("create-support-request-form").style.display = "none"
  document.getElementById("create-support-request-form").reset()
}

async function handleCreateSupportRequest(e) {
  e.preventDefault()

  if (currentUser.userType === "admin") {
    showNotification("Admins cannot create support requests.", "error")
    return
  }

  const title = document.getElementById("support-request-title").value
  const description = document.getElementById("support-request-description").value

  try {
    const response = await fetch("/api/support-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ title, description }),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification("Support request created successfully!", "success")
      hideCreateSupportRequestForm()
      loadSupportRequests()
    } else {
      showNotification(data.error, "error")
    }
  } catch (error) {
    showNotification("Error creating support request", "error")
  }
}

async function loadSupportRequests() {
  try {
    const response = await fetch("/api/support-requests", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const supportRequests = await response.json()

    const supportRequestsList = document.getElementById("support-requests-list")
    supportRequestsList.innerHTML = ""

    if (supportRequests.length === 0) {
      supportRequestsList.innerHTML = '<p class="text-center">No support requests found.</p>'
      return
    }

    supportRequests.forEach((supportRequest) => {
      const supportRequestCard = createSupportRequestCard(supportRequest)
      supportRequestsList.appendChild(supportRequestCard)
    })
  } catch (error) {
    console.error("Error loading support requests:", error)
    showNotification("Error loading support requests", "error")
  }
}

function createSupportRequestCard(supportRequest) {
  const card = document.createElement("div")
  card.className = `support-request-card priority-${supportRequest.priority}`

  // Show location for business accounts
  const locationInfo = supportRequest.companyLocation ? `<span>Location: ${supportRequest.companyLocation}</span>` : ""
  const companyNameInfo = supportRequest.companyName ? `<span>Company: ${supportRequest.companyName}</span>` : ""

  card.innerHTML = `
      <div class="support-request-header">
          <div>
              <div class="support-request-title">${supportRequest.title}</div>
              <div class="support-request-meta">
                  <span>ID: ${supportRequest._id}</span>
                  <span>Priority: ${supportRequest.priority}</span>
                  ${locationInfo}
                  ${companyNameInfo}
                  <span>Created: ${new Date(supportRequest.createdAt).toLocaleDateString()}</span>
              </div>
          </div>
          <span class="support-request-status status-${supportRequest.status}">${supportRequest.status}</span>
      </div>
      <p>${supportRequest.description}</p>
      ${supportRequest.quote ? `<p><strong>Quote:</strong> $${supportRequest.quote}</p>` : ""}
      ${supportRequest.notes ? `<p><strong>Notes:</strong> ${supportRequest.notes}</p>` : ""}
      ${supportRequest.schedule ? `<p><strong>Scheduled Time:</strong> ${new Date(supportRequest.schedule).toLocaleString()}</p>` : ""}
      ${
        currentUser.userType === "admin"
          ? `
          <div class="form-actions mt-1">
              <select onchange="updateSupportRequestPriority('${supportRequest._id}', this.value)" style="margin-right: 1rem;">
                  <option value="low" ${supportRequest.priority === "low" ? "selected" : ""}>Low Priority</option>
                  <option value="medium" ${supportRequest.priority === "medium" ? "selected" : ""}>Medium Priority</option>
                  <option value="high" ${supportRequest.priority === "high" ? "selected" : ""}>High Priority</option>
              </select>
              <button class="btn btn-warning btn-small" onclick="updateSupportRequestStatus('${supportRequest._id}', 'in-progress')">In Progress</button>
              <button class="btn btn-success btn-small" onclick="updateSupportRequestStatus('${supportRequest._id}', 'closed')">Close</button>
              <button class="btn btn-primary btn-small" onclick="addQuoteToSupportRequest('${supportRequest._id}')">Add Quote</button>
              <button class="btn btn-secondary btn-small" onclick="scheduleRequest('${supportRequest._id}')">Schedule Time</button>
          </div>
      `
          : ""
      }
  `

  return card
}

async function updateSupportRequestStatus(supportRequestId, status) {
  try {
    const response = await fetch(`/api/support-requests/${supportRequestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status }),
    })

    if (response.ok) {
      showNotification("Support request updated successfully!", "success")
      loadSupportRequests()
    } else {
      showNotification("Error updating support request", "error")
    }
  } catch (error) {
    showNotification("Error updating support request", "error")
  }
}

async function updateSupportRequestPriority(supportRequestId, priority) {
  try {
    const response = await fetch(`/api/support-requests/${supportRequestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ priority }),
    })

    if (response.ok) {
      showNotification("Priority updated successfully!", "success")
      loadSupportRequests()
    } else {
      showNotification("Error updating priority", "error")
    }
  } catch (error) {
    showNotification("Error updating priority", "error")
  }
}

async function addQuoteToSupportRequest(supportRequestId) {
  const quote = prompt("Enter quote amount:")
  if (quote && !isNaN(quote)) {
    try {
      const response = await fetch(`/api/support-requests/${supportRequestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ quote: Number.parseFloat(quote) }),
      })

      if (response.ok) {
        showNotification("Quote added successfully!", "success")
        loadSupportRequests()
      } else {
        showNotification("Error adding quote", "error")
      }
    } catch (error) {
      showNotification("Error adding quote", "error")
    }
  }
}

async function scheduleRequest(supportRequestId) {
  const scheduleTime = prompt("Enter schedule time (YYYY-MM-DD HH:MM):")
  if (scheduleTime) {
    try {
      const response = await fetch(`/api/support-requests/${supportRequestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ schedule: new Date(scheduleTime) }),
      })

      if (response.ok) {
        showNotification("Schedule updated successfully!", "success")
        loadSupportRequests()
      } else {
        showNotification("Error updating schedule", "error")
      }
    } catch (error) {
      showNotification("Error updating schedule", "error")
    }
  }
}

// Inventory Functions (Admin Only)
async function loadInventory() {
  try {
    const response = await fetch("/api/inventory", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const inventory = await response.json()

    const inventoryList = document.getElementById("inventory-list")
    inventoryList.innerHTML = ""

    inventory.forEach((item) => {
      const itemCard = createInventoryCard(item)
      inventoryList.appendChild(itemCard)
    })
  } catch (error) {
    console.error("Error loading inventory:", error)
  }
}

function createInventoryCard(item) {
  const card = document.createElement("div")
  card.className = "inventory-item"

  card.innerHTML = `
      <div class="inventory-info">
          <h3>${item.name}</h3>
          <div class="inventory-meta">
              <span>Quantity: ${item.quantity}</span> |
              <span>Price: $${item.price}</span>
          </div>
      </div>
      <div class="inventory-actions">
          <button class="btn btn-primary" onclick="editInventoryItem('${item._id}')">Edit</button>
      </div>
      <div id="edit-form-${item._id}" class="inventory-edit-form" style="display: none;">
          <input type="text" id="edit-name-${item._id}" value="${item.name}" placeholder="Name">
          <input type="number" id="edit-quantity-${item._id}" value="${item.quantity}" placeholder="Quantity">
          <input type="number" id="edit-price-${item._id}" value="${item.price}" step="0.01" placeholder="Price">
          <button class="btn btn-success" onclick="saveInventoryItem('${item._id}')">Save</button>
          <button class="btn btn-secondary" onclick="cancelEditInventoryItem('${item._id}')">Cancel</button>
      </div>
  `

  return card
}

function editInventoryItem(itemId) {
  document.getElementById(`edit-form-${itemId}`).style.display = "grid"
}

function cancelEditInventoryItem(itemId) {
  document.getElementById(`edit-form-${itemId}`).style.display = "none"
}

async function saveInventoryItem(itemId) {
  const name = document.getElementById(`edit-name-${itemId}`).value
  const quantity = Number.parseInt(document.getElementById(`edit-quantity-${itemId}`).value)
  const price = Number.parseFloat(document.getElementById(`edit-price-${itemId}`).value)

  try {
    const response = await fetch(`/api/inventory/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name, quantity, price }),
    })

    if (response.ok) {
      showNotification("Item updated successfully!", "success")
      loadInventory()
    } else {
      showNotification("Error updating item", "error")
    }
  } catch (error) {
    showNotification("Error updating item", "error")
  }
}

// Inventory search function
async function searchInventory() {
  const query = document.getElementById("inventory-search").value.toLowerCase()

  try {
    const response = await fetch("/api/inventory", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const inventory = await response.json()

    let filteredInventory = inventory
    if (query) {
      filteredInventory = inventory.filter((item) => item.name.toLowerCase().includes(query))
    }

    const inventoryList = document.getElementById("inventory-list")
    inventoryList.innerHTML = ""

    if (filteredInventory.length === 0) {
      inventoryList.innerHTML = '<p class="text-center">No items found.</p>'
      return
    }

    filteredInventory.forEach((item) => {
      const itemCard = createInventoryCard(item)
      inventoryList.appendChild(itemCard)
    })
  } catch (error) {
    console.error("Error searching inventory:", error)
  }
}

// Analytics Functions (Admin Only)
async function loadAnalytics() {
  try {
    const response = await fetch("/api/analytics", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const analytics = await response.json()

    const analyticsContent = document.getElementById("analytics-content")
    analyticsContent.innerHTML = `
          <div class="analytics-section">
              <h3>Support Request Overview</h3>
              <div class="analytics-grid">
                  <div class="analytics-item">
                      <div class="analytics-number">${analytics.totalSupportRequests}</div>
                      <div>Total Requests</div>
                  </div>
                  <div class="analytics-item">
                      <div class="analytics-number">${analytics.openSupportRequests}</div>
                      <div>Open Requests</div>
                  </div>
                  <div class="analytics-item">
                      <div class="analytics-number">${analytics.closedSupportRequests}</div>
                      <div>Closed Requests</div>
                  </div>
              </div>
          </div>
          
          <div class="analytics-section">
              <h3>Priority Distribution</h3>
              <div class="analytics-grid">
                  ${analytics.priorityDistribution
                    .map(
                      (priority) => `
                      <div class="analytics-item">
                          <div class="analytics-number">${priority.count}</div>
                          <div>${priority.priority} Priority</div>
                      </div>
                  `,
                    )
                    .join("")}
              </div>
          </div>
          
          <div class="analytics-section">
              <h3>Performance Metrics</h3>
              <div class="analytics-grid">
                  <div class="analytics-item">
                      <div class="analytics-number">${analytics.avgCompletionTime}</div>
                      <div>Avg Completion Time</div>
                  </div>
                  <div class="analytics-item">
                      <div class="analytics-number">${analytics.satisfactionRating}/5</div>
                      <div>Customer Satisfaction</div>
                  </div>
              </div>
          </div>
      `
  } catch (error) {
    console.error("Error loading analytics:", error)
  }
}

// Load public knowledge base articles for landing page
async function loadPublicKnowledgeBase() {
  try {
    const response = await fetch("/api/knowledge-base")
    const articles = await response.json()

    const kbContainer = document.getElementById("public-knowledge-base")
    kbContainer.innerHTML = ""

    articles.forEach((article) => {
      const articleCard = document.createElement("div")
      articleCard.className = "public-kb-article"

      articleCard.innerHTML = `
        <h3>${article.title}</h3>
        <div class="problem">Problem: ${article.problem}</div>
        <div class="solution">${article.solution}</div>
      `

      kbContainer.appendChild(articleCard)
    })
  } catch (error) {
    console.error("Error loading public knowledge base:", error)
  }
}

// Initial setup on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // Check for existing token
  const token = localStorage.getItem("authToken")
  if (token) {
    authToken = token
    showingLanding = false
    // Verify token and get user info
    verifyToken()
  } else {
    showLandingPage()
  }

  // Set up form event listeners
  setupEventListeners()
})

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
  @keyframes slideIn {
      from {
          transform: translateX(100%);
          opacity: 0;
      }
      to {
          transform: translateX(0);
          opacity: 1;
      }
  }
  
  @keyframes slideOut {
      from {
          transform: translateX(0);
          opacity: 1;
      }
      to {
          transform: translateX(100%);
          opacity: 0;
      }
  }
`
document.head.appendChild(style)

