const STORAGE_KEY = "sentinel_tasks";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatCountdown(deadline) {
    const difference = new Date(deadline).getTime() - Date.now();

    if (difference <= 0) {
        return "OVERDUE";
    }

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDeadline(deadline) {
    return new Date(deadline).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function isOverdue(deadline) {
    return new Date(deadline).getTime() <= Date.now();
}

function renderTasks() {
    const taskList = document.getElementById("taskList");

    if (!taskList) return;

    const taskCount = document.getElementById("taskCount");
    const clearCompletedButton = document.getElementById("clearCompletedButton");

    taskCount.textContent = tasks.filter(task => !task.completed).length;

    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.appendChild(createEmptyState());
        return;
    }

    tasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    if (clearCompletedButton) {
        clearCompletedButton.style.visibility =
            tasks.some(task => task.completed) ? "visible" : "hidden";
    }
}

function createEmptyState() {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
        <div class="empty-icon">✓</div>
        <h3>No tasks yet</h3>
        <p>Add a task to start tracking your deadlines.</p>
    `;

    return emptyState;
}

function createTaskElement(task) {
    const article = document.createElement("article");

    article.className = `task-item ${task.completed ? "completed" : ""}`;
    article.dataset.id = task.id;

    article.innerHTML = `
        <input
            class="task-checkbox"
            type="checkbox"
            ${task.completed ? "checked" : ""}
            aria-label="Complete task"
        />

        <div class="task-content">
            <div class="task-title">${escapeHTML(task.title)}</div>
            <div class="task-deadline">
                ${formatDeadline(task.deadline)}
            </div>
        </div>

        <div class="task-countdown ${isOverdue(task.deadline) ? "overdue" : ""}">
            ${formatCountdown(task.deadline)}
        </div>

        <button
            class="delete-task"
            type="button"
            aria-label="Delete task"
        >
            ×
        </button>
    `;

    article
        .querySelector(".task-checkbox")
        .addEventListener("change", () => {
            toggleTask(task.id);
        });

    article
        .querySelector(".delete-task")
        .addEventListener("click", () => {
            deleteTask(task.id);
        });

    return article;
}


function addTask() {
    const taskInput = document.getElementById("taskInput");
    const deadlineDate = document.getElementById("deadlineDate");
    const deadlineTime = document.getElementById("deadlineTime");

    if (!taskInput || !deadlineDate || !deadlineTime) {
        return;
    }
    const title = taskInput.value.trim();
    const date = deadlineDate.value;
    const time = deadlineTime.value;

    if (!title) {
        taskInput.focus();
        return;
    }

    if (!date) {
        deadlineDate.focus();
        return;
    }

    if (!time) {
        deadlineTime.focus();
        return;
    }

    const deadline = new Date(`${date}T${time}`);

    if (Number.isNaN(deadline.getTime())) {
        alert("Please select a valid date and time.");
        return;
    }

    if (deadline.getTime() <= Date.now()) {
        alert("Please choose a future deadline.");
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        title: title,
        deadline: deadline.toISOString(),
        completed: false
    };

    tasks.push(newTask);

    saveTasks();
    taskInput.value = "";
    deadlineDate.value = "";
    deadlineTime.value = "";
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    task.completed = !task.completed;

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
}

function updateCountdowns() {
    document.querySelectorAll(".task-item").forEach(item => {
        const task = tasks.find(task => task.id === item.dataset.id);
        if (!task) return;
        const countdown = item.querySelector(".task-countdown");
        countdown.textContent = formatCountdown(task.deadline);
        countdown.classList.toggle(
            "overdue",
            isOverdue(task.deadline)
        );
    });
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


function importTasks() {
    const jsonInput = document.getElementById("jsonInput");
    const message = document.getElementById("jsonMessage");
    if (!jsonInput || !message) return;
    try {
        const importedTasks = JSON.parse(jsonInput.value);
        if (!Array.isArray(importedTasks)) {
            throw new Error("JSON must contain an array of tasks.");
        }
        const validTasks = importedTasks.every(task =>
            task &&
            typeof task === "object" &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.deadline === "string" &&
            typeof task.completed === "boolean" &&
            !Number.isNaN(new Date(task.deadline).getTime())
        );
        if (!validTasks) {
            throw new Error("Invalid task format.");
        }
        tasks = importedTasks;
        saveTasks();
        message.textContent = "Tasks imported successfully.";
        jsonInput.value = JSON.stringify(tasks, null, 2);
    } catch (error) {
        message.textContent = error.message;
    }
}

function exportTasks() {
    const jsonInput = document.getElementById("jsonInput");
    const message = document.getElementById("jsonMessage");
    if (!jsonInput) return;
    jsonInput.value = JSON.stringify(tasks, null, 2);
    if (message) {
        message.textContent = "Tasks exported successfully.";
    }
}


function minimizePanel() {
    const content = document.getElementById("panelContent");
    const panel = document.querySelector(".json-panel");
    if (!content || !panel) return;
    const minimized = content.style.display === "none";
    content.style.display = minimized ? "block" : "none";
    panel.classList.toggle("minimized", !minimized);

}

function closePanel() {
    const panel = document.querySelector(".json-panel");
    if (panel) {
        panel.style.display = "none";
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const addButton = document.getElementById("addTaskButton");
    if (addButton) {
        addButton.addEventListener("click", addTask);
    }
    const taskInput = document.getElementById("taskInput");
    if (taskInput) {
        taskInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                addTask();
            }
        });
    }
    const clearButton = document.getElementById("clearCompletedButton");
    if (clearButton) {
        clearButton.addEventListener("click", clearCompleted);
    }
    const importButton = document.getElementById("importButton");
    if (importButton) {
        importButton.addEventListener("click", importTasks);
    }
    const exportButton = document.getElementById("exportButton");
    if (exportButton) {
        exportButton.addEventListener("click", exportTasks);
    }
    const minimizeButton = document.getElementById("minimizeButton");
    if (minimizeButton) {
        minimizeButton.addEventListener("click", minimizePanel);
    }
    const closeButton = document.getElementById("closeButton");
    if (closeButton) {
        closeButton.addEventListener("click", closePanel);
    }
    renderTasks();
    setInterval(updateCountdowns, 1000);
});