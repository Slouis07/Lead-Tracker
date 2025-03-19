
let myLeads = [];
let myCategories = ["Work", "Personal", "Follow-up"]; //predefined
let currentFilter = "All";


const inputEl = document.getElementById("input-el");
const inputBtn = document.getElementById("input-btn");
const tabBtn = document.getElementById("tab-btn");
const deleteBtn = document.getElementById("delete-btn");
const exportBtn = document.getElementById("export-btn");
const ulEl = document.getElementById("ul-el");
const categorySelect = document.getElementById("category-select");
const noteInput = document.getElementById("note-input");
const searchInput = document.getElementById("search-input");
const filterChips = document.querySelectorAll(".filter-chip");
const leadsCount = document.querySelector(".leads-count");

// Load leads from localStorage
const leadsFromLocalStorage = JSON.parse(localStorage.getItem("myLeads"));
if (leadsFromLocalStorage) {
  myLeads = leadsFromLocalStorage;
  updateLeadsCount();
  render(myLeads);
}

// Initialize filter chips
filterChips.forEach((chip) => {
  chip.addEventListener("click", function () {

    filterChips.forEach((c) => c.classList.remove("active"));
  
    this.classList.add("active");

    currentFilter = this.textContent;
 
    applyFilters();
  });
});

// Search functionality
searchInput.addEventListener("input", function () {
  applyFilters();
});

// Apply search and category filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  let filteredLeads = myLeads;

  // Apply search filter
  if (searchTerm) {
    filteredLeads = filteredLeads.filter((lead) => {
      const url = typeof lead === "string" ? lead : lead.url;
      const title = typeof lead === "string" ? url : lead.title || url;
      const note = typeof lead === "string" ? "" : lead.note || "";
      const category = typeof lead === "string" ? "" : lead.category || "";

      return (
        url.toLowerCase().includes(searchTerm) ||
        title.toLowerCase().includes(searchTerm) ||
        note.toLowerCase().includes(searchTerm) ||
        category.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Apply category filter
  if (currentFilter !== "All" && currentFilter !== "+ Add Category") {
    filteredLeads = filteredLeads.filter((lead) => {
      return typeof lead !== "string" && lead.category === currentFilter;
    });
  }

  render(filteredLeads);
}

// Update leads count display
function updateLeadsCount() {
  leadsCount.textContent = myLeads.length;
}

// Save current tab
tabBtn.addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const newLead = {
      url: tabs[0].url,
      title: tabs[0].title || tabs[0].url,
      category: categorySelect.value,
      note: noteInput.value,
      date: new Date().toLocaleDateString(),
    };

    myLeads.push(newLead);
    localStorage.setItem("myLeads", JSON.stringify(myLeads));
    noteInput.value = "";
    updateLeadsCount();
    applyFilters();
  });
});

// Delete individual lead
function deleteLead(index) {
  // Find the actual index in the original array
  const leadToDelete = myLeads[index];
  myLeads = myLeads.filter((lead) => lead !== leadToDelete);

  localStorage.setItem("myLeads", JSON.stringify(myLeads));
  updateLeadsCount();
  applyFilters();
}

// Edit lead
function editLead(index) {
  const lead = myLeads[index];

  // Fill the form with lead data
  inputEl.value = lead.url;
  categorySelect.value = lead.category;
  noteInput.value = lead.note || "";

  // Remove the lead
  myLeads.splice(index, 1);
  localStorage.setItem("myLeads", JSON.stringify(myLeads));

  // Focus on the first input
  inputEl.focus();
  updateLeadsCount();
  applyFilters();
}

// Render leads list with improved formatting
function render(leads) {
  let listItems = "";

  if (leads.length === 0) {
    listItems = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No leads found. Add some leads to get started!</p>
            </div>
        `;
  } else {
    for (let i = 0; i < leads.length; i++) {
      // Find the index in the original array
      const originalIndex = myLeads.indexOf(leads[i]);
      const lead = leads[i];
      const url = typeof lead === "string" ? lead : lead.url;
      const title = typeof lead === "string" ? url : lead.title || url;
      const category =
        typeof lead === "string"
          ? ""
          : lead.category
          ? `<span class="category ${lead.category.toLowerCase()}">${
              lead.category
            }</span>`
          : "";
      const note =
        typeof lead === "string"
          ? ""
          : lead.note
          ? `<div class="note">${lead.note}</div>`
          : "";
      const date =
        typeof lead === "string"
          ? ""
          : lead.date
          ? `<span class="date">${lead.date}</span>`
          : "";

      listItems += `
                <li class="lead-item">
                    <div class="lead-header">
                        <a target='_blank' href='${url}' class="lead-title">
                            ${title}
                        </a>
                        <div class="lead-url">${url}</div>
                        <div class="lead-meta">
                            ${category}
                            ${date}
                        </div>
                    </div>
                    ${note ? `<div class="lead-content">${note}</div>` : ""}
                    <div class="lead-actions">
                        <button class="btn-outline edit-lead-btn" data-index="${originalIndex}">Edit</button>
                        <button class="btn-danger delete-lead-btn" data-index="${originalIndex}">Delete</button>
                    </div>
                </li>
            `;
    }
  }

  ulEl.innerHTML = listItems;

  // Add event listeners to action buttons
  const deleteLeadBtns = document.querySelectorAll(".delete-lead-btn");
  const editLeadBtns = document.querySelectorAll(".edit-lead-btn");

  deleteLeadBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      deleteLead(index);
    });
  });

  editLeadBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      editLead(index);
    });
  });
}

// Delete all leads
deleteBtn.addEventListener("dblclick", function () {
  localStorage.clear();
  myLeads = [];
  updateLeadsCount();
  render(myLeads);
});

// Save manual input
inputBtn.addEventListener("click", function () {
  if (inputEl.value) {
    const newLead = {
      url: inputEl.value,
      title: inputEl.value,
      category: categorySelect.value,
      note: noteInput.value,
      date: new Date().toLocaleDateString(),
    };

    myLeads.push(newLead);
    localStorage.setItem("myLeads", JSON.stringify(myLeads));
    inputEl.value = "";
    noteInput.value = "";
    updateLeadsCount();
    applyFilters();
  }
});

// Export functionality
exportBtn.addEventListener("click", function () {
  const exportData = JSON.stringify(myLeads, null, 2);
  const blob = new Blob([exportData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "leads-" + new Date().toISOString().split("T")[0] + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Add custom category functionality
filterChips.forEach((chip) => {
  if (chip.textContent === "+ Add Category") {
    chip.addEventListener("click", function () {
      const newCategory = prompt("Enter a new category name:");
      if (newCategory && !myCategories.includes(newCategory)) {
        myCategories.push(newCategory);

        // Add to category select dropdown
        const option = document.createElement("option");
        option.value = newCategory;
        option.textContent = newCategory;
        categorySelect.appendChild(option);

        // Add new filter chip before the "+ Add Category" chip
        const newChip = document.createElement("div");
        newChip.className = "filter-chip";
        newChip.textContent = newCategory;
        newChip.addEventListener("click", function () {
          filterChips.forEach((c) => c.classList.remove("active"));
          this.classList.add("active");
          currentFilter = this.textContent;
          applyFilters();
        });

        this.parentNode.insertBefore(newChip, this);

        // Save categories to localStorage
        localStorage.setItem("myCategories", JSON.stringify(myCategories));
      }
    });
  }
});

// Load categories from localStorage
const categoriesFromLocalStorage = JSON.parse(
  localStorage.getItem("myCategories")
);
if (categoriesFromLocalStorage) {
  myCategories = categoriesFromLocalStorage;

  // Update category select dropdown with custom categories
  myCategories.forEach((category) => {
    if (
      category !== "Work" &&
      category !== "Personal" &&
      category !== "Follow-up"
    ) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);

      // Add filter chip
      const addCategoryChip = document.querySelector(".filter-chip:last-child");
      const newChip = document.createElement("div");
      newChip.className = "filter-chip";
      newChip.textContent = category;
      newChip.addEventListener("click", function () {
        filterChips.forEach((c) => c.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.textContent;
        applyFilters();
      });

      addCategoryChip.parentNode.insertBefore(newChip, addCategoryChip);
    }
  });
}

function updateCopyright() {
  const currentYear = new Date().getFullYear();
  const copyrightElement = document.getElementById("copyright");
  copyrightElement.textContent = `© ${currentYear} Severine Louis. All rights reserved.`;
}

updateCopyright();
