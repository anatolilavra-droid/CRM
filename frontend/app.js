const API_URL = "/tasks";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-input");
const list = document.getElementById("task-list");


async function loadTasks() {
  const res = await fetch(API_URL);
  const tasks = await res.json();
  renderTasks(tasks);
}


function renderTasks(tasks) {
  list.innerHTML = "";
  for (const task of tasks) {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id, !task.done));

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title" + (task.done ? " done" : "");
    titleSpan.textContent = task.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  }
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, done: false }),
  });

  if (res.ok) {
    titleInput.value = "";
    await loadTasks();
  } else {
    alert("Failed to create task");
  }
});


async function toggleTask(id, done) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });

  if (res.ok) {
    await loadTasks();
  } else {
    alert("Failed to update task");
  }
}

async function deleteTask(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (res.ok) {
    await loadTasks();
  } else {
    alert("Failed to delete task");
  }
}


loadTasks();