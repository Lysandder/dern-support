// Global state
let currentUser = null
let authToken = null
let currentSection = "dashboard"
let showingLanding = true

// Initialize app
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

function setupEventListeners() {
  // Auth forms
  document.getElementById("login-form").addEventListener("submit", handleLogin)
  document.getElementById("register-form").addEventListener("submit", handleRegister)

  // Support request form
  document.getElementById("create-support-request-form").addEventListener("submit", handleCreateSupportRequest)

  // Knowledge base forms
  document.getElementById("create-article-form").addEventListener("submit", handleCreateArticle)
  document.getElementById("edit-article-form").addEventListener("submit", handleEditArticle)

  // Knowledge base search
  document.getElementById("kb-search").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchKnowledgeBase()
    }
  })

  // Inventory search
  document.getElementById("inventory-search").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchInventory()
    }
  })
}

// Authentication functions
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

async function handleRegister(e) {
  e.preventDefault()

  const username = document.getElementById("register-username").value
  const email = document.getElementById("register-email").value
  const password = document.getElementById("register-password").value
  const userType = document.getElementById("user-type").value
  const companyName = document.getElementById("company-name").value

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, userType, companyName }),
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

function logout() {
  localStorage.removeItem("authToken")
  authToken = null
  currentUser = null
  showLandingPage()
  showNotification("Logged out successfully", "success")
}

// UI functions
function showAuthSection() {
  document.getElementById("auth-section").style.display = "block"
  document.getElementById("dashboard-section").style.display = "none"
  document.getElementById("support-requests-section").style.display = "none"
  document.getElementById("knowledge-base-section").style.display = "none"
  document.getElementById("inventory-section").style.display = "none"
  document.getElementById("analytics-section").style.display = "none"
  document.getElementById("nav").style.display = "none"
  document.getElementsByClassName("logo")[0].style.display = "block"
  document.getElementById("user-info").style.display = "none"
}

function showLandingPage() {
  showingLanding = true
  document.getElementById("landing-section").style.display = "block"
  document.getElementById("auth-section").style.display = "none"
  document.getElementById("dashboard-section").style.display = "none"
  document.getElementById("support-requests-section").style.display = "none"
  document.getElementById("knowledge-base-section").style.display = "none"
  document.getElementById("inventory-section").style.display = "none"
  document.getElementById("analytics-section").style.display = "none"
  document.getElementById("nav").style.display = "none"
  document.getElementsByClassName("logo")[0].style.display = "none"
  document.getElementById("user-info").style.display = "none"
}

function showLoginPage() {
  showingLanding = false
  document.getElementById("landing-section").style.display = "none"
  showAuthSection()
}

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
    case "knowledge-base":
      loadKnowledgeBase()
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

function toggleCompanyField() {
  const userType = document.getElementById("user-type").value
  const companyField = document.getElementById("company-field")

  if (userType === "business") {
    companyField.style.display = "block"
    document.getElementById("company-name").required = true
  } else {
    companyField.style.display = "none"
    document.getElementById("company-name").required = false
  }
}

// Dashboard functions
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

    // Load knowledge base count
    const kbResponse = await fetch("/api/knowledge-base")
    const kbArticles = await kbResponse.json()
    document.getElementById("kb-articles-count").textContent = kbArticles.length

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

// Support Request functions
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

  card.innerHTML = `
        <div class="support-request-header">
            <div>
                <div class="support-request-title">${supportRequest.title}</div>
                <div class="support-request-meta">
                    <span>ID: ${supportRequest._id}</span>
                    <span>Priority: ${supportRequest.priority}</span>
                    <span>Schedule: ${supportRequest.schedule || "Not specified"}</span>
                    <span>Created: ${new Date(supportRequest.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <span class="support-request-status status-${supportRequest.status}">${supportRequest.status}</span>
        </div>
        <p>${supportRequest.description}</p>
        ${supportRequest.quote ? `<p><strong>Quote:</strong> $${supportRequest.quote}</p>` : ""}
        ${supportRequest.notes ? `<p><strong>Notes:</strong> ${supportRequest.notes}</p>` : ""}
        ${currentUser.userType === "admin"
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
            </div>
        `
      : ""
    }
    `

  return card
}

async function handleCreateSupportRequest(e) {
  e.preventDefault()

  if (currentUser.userType === "admin") {
    showNotification("Admins cannot create support requests.", "error")
    return
  }

  const title = document.getElementById("support-request-title").value
  const description = document.getElementById("support-request-description").value
  const schedule = document.getElementById("support-request-schedule").value

  try {
    const response = await fetch("/api/support-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ title, description, schedule }),
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

function showCreateSupportRequestForm() {
  document.getElementById("create-support-request-form").style.display = "block"
}

function hideCreateSupportRequestForm() {
  document.getElementById("create-support-request-form").style.display = "none"
  document.getElementById("create-support-request-form").reset()
}

// Knowledge Base functions
async function loadKnowledgeBase() {
  try {
    const response = await fetch("/api/knowledge-base")
    const articles = await response.json()
    displayKnowledgeBase(articles)
  } catch (error) {
    console.error("Error loading knowledge base:", error)
  }
}

async function searchKnowledgeBase() {
  const query = document.getElementById("kb-search").value

  try {
    const params = new URLSearchParams()
    if (query) params.append("q", query)

    const response = await fetch(`/api/knowledge-base/search?${params}`)
    const articles = await response.json()
    displayKnowledgeBase(articles)
  } catch (error) {
    console.error("Error searching knowledge base:", error)
  }
}

function displayKnowledgeBase(articles) {
  const kbList = document.getElementById("knowledge-base-list")
  kbList.innerHTML = ""

  if (articles.length === 0) {
    kbList.innerHTML = '<p class="text-center">No articles found.</p>'
    return
  }

  articles.forEach((article) => {
    const articleCard = document.createElement("div")
    articleCard.className = "kb-article"

    articleCard.innerHTML = `
            <h3>${article.title}</h3>
            ${currentUser.userType === "admin"
        ? `
                <div class="kb-actions">
                    <button class="btn btn-primary btn-small" onclick="editArticle('${article._id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteArticle('${article._id}')">Delete</button>
                </div>
            `
        : ""
      }
            <p><strong>Problem:</strong> ${article.problem}</p>
            <p><strong>Solution:</strong></p>
            <div class="kb-solution">${article.solution}</div>
        `

    kbList.appendChild(articleCard)
  })
}

// Knowledge base management (admin only)
async function handleCreateArticle(e) {
  e.preventDefault()

  const title = document.getElementById("article-title").value
  const problem = document.getElementById("article-problem").value
  const solution = document.getElementById("article-solution").value

  try {
    const response = await fetch("/api/knowledge-base", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ title, problem, solution }),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification("Article created successfully!", "success")
      hideCreateArticleForm()
      loadKnowledgeBase()
    } else {
      showNotification(data.error, "error")
    }
  } catch (error) {
    showNotification("Error creating article", "error")
  }
}

async function handleEditArticle(e) {
  e.preventDefault()

  const articleId = document.getElementById("edit-article-id").value
  const title = document.getElementById("edit-article-title").value
  const problem = document.getElementById("edit-article-problem").value
  const solution = document.getElementById("edit-article-solution").value

  try {
    const response = await fetch(`/api/knowledge-base/${articleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ title, problem, solution }),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification("Article updated successfully!", "success")
      hideEditArticleModal()
      loadKnowledgeBase()
    } else {
      showNotification(data.error, "error")
    }
  } catch (error) {
    showNotification("Error updating article", "error")
  }
}

async function editArticle(articleId) {
  try {
    const response = await fetch("/api/knowledge-base")
    const articles = await response.json()
    const article = articles.find((a) => a._id === articleId)

    if (article) {
      document.getElementById("edit-article-id").value = article._id
      document.getElementById("edit-article-title").value = article.title
      document.getElementById("edit-article-problem").value = article.problem
      document.getElementById("edit-article-solution").value = article.solution
      showEditArticleModal()
    }
  } catch (error) {
    showNotification("Error loading article", "error")
  }
}

async function deleteArticle(articleId) {
  if (confirm("Are you sure you want to delete this article?")) {
    try {
      const response = await fetch(`/api/knowledge-base/${articleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        showNotification("Article deleted successfully!", "success")
        loadKnowledgeBase()
      } else {
        showNotification("Error deleting article", "error")
      }
    } catch (error) {
      showNotification("Error deleting article", "error")
    }
  }
}

function showCreateArticleForm() {
  document.getElementById("create-article-form").style.display = "block"
}

function hideCreateArticleForm() {
  document.getElementById("create-article-form").style.display = "none"
  document.getElementById("create-article-form").reset()
}

function showEditArticleModal() {
  document.getElementById("edit-article-modal").style.display = "block"
}

function hideEditArticleModal() {
  document.getElementById("edit-article-modal").style.display = "none"
  document.getElementById("edit-article-form").reset()
}

// Inventory functions (Admin only)
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

// Analytics functions (Admin only)
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

// Utility functions
function showNotification(message, type) {
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("create-article-form").style.display = "none"
})
