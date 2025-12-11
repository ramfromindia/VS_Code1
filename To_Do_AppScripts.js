'use strict';
// --- Utility to generate unique IDs for tasks ---
function generateId() {
	// Combines current timestamp and a random string for uniqueness
	return Date.now() + Math.random().toString(16).slice(2);
}
// --- Rendering ---
function renderTasks() {
	const list = document.getElementById('todo-list');
	list.innerHTML = '';
	if (tasks.length === 0) {
		list.innerHTML = '<li style="text-align:center;color:#888;">No tasks yet. Add one above!</li>';
		return;
	}
	// Sort by priority (high > medium > low), then by creation (id)
	const priorityOrder = { high: 1, medium: 2, low: 3 };
	const sorted = [...tasks].sort((a, b) => {
		if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		}
		return a.id.localeCompare(b.id);
	});
	for (const task of sorted) {
		// Create list item
		const li = document.createElement('li');
		li.className = 'todo-item' + (task.completed ? ' completed' : '');
		li.dataset.id = task.id;

		// Priority badge
		const prio = document.createElement('span');
		prio.className = 'priority ' + task.priority;
		prio.textContent = task.priority;


		// Task text or input (inline edit)
		let text;
		if (window.editingTaskId === task.id) {
			text = document.createElement('input');
			text.type = 'text';
			text.className = 'todo-edit-input';
			text.value = task.text;
			text.setAttribute('maxlength', 100);
		} else {
			text = document.createElement('span');
			text.className = 'todo-text';
			text.textContent = task.text;
		}

		// Actions
		const actions = document.createElement('span');
		actions.className = 'actions';

		// Complete/Uncomplete button
		const completeBtn = document.createElement('button');
		completeBtn.title = task.completed ? 'Mark as incomplete' : 'Mark as complete';
		completeBtn.innerHTML = task.completed ? '⟳' : '✔';
		completeBtn.setAttribute('data-action', 'toggle');
		completeBtn.setAttribute('data-id', task.id);
		completeBtn.setAttribute('type', 'button');
		actions.appendChild(completeBtn);


		// Edit button or Save/Cancel if editing
		if (window.editingTaskId === task.id) {
			// Save button
			const saveBtn = document.createElement('button');
			saveBtn.title = 'Save';
			saveBtn.innerHTML = '💾';
			saveBtn.setAttribute('data-action', 'save-edit');
			saveBtn.setAttribute('data-id', task.id);
			saveBtn.setAttribute('type', 'button');
			actions.appendChild(saveBtn);
			// Cancel button
			const cancelBtn = document.createElement('button');
			cancelBtn.title = 'Cancel';
			cancelBtn.innerHTML = '✖';
			cancelBtn.setAttribute('data-action', 'cancel-edit');
			cancelBtn.setAttribute('data-id', task.id);
			cancelBtn.setAttribute('type', 'button');
			actions.appendChild(cancelBtn);
		} else {
			const editBtn = document.createElement('button');
			editBtn.title = 'Edit task';
			editBtn.innerHTML = '✎';
			editBtn.setAttribute('data-action', 'edit');
			editBtn.setAttribute('data-id', task.id);
			editBtn.setAttribute('type', 'button');
			actions.appendChild(editBtn);
		}


		// Delete button or inline confirm
		if (window.deletingTaskId === task.id) {
			const yesBtn = document.createElement('button');
			yesBtn.title = 'Confirm delete';
			yesBtn.innerHTML = 'Yes';
			yesBtn.setAttribute('data-action', 'confirm-delete');
			yesBtn.setAttribute('data-id', task.id);
			yesBtn.setAttribute('type', 'button');
			actions.appendChild(yesBtn);
			const noBtn = document.createElement('button');
			noBtn.title = 'Cancel';
			noBtn.innerHTML = 'No';
			noBtn.setAttribute('data-action', 'cancel-delete');
			noBtn.setAttribute('data-id', task.id);
			noBtn.setAttribute('type', 'button');
			actions.appendChild(noBtn);
		} else {
			const delBtn = document.createElement('button');
			delBtn.title = 'Delete task';
			delBtn.innerHTML = '🗑';
			delBtn.setAttribute('data-action', 'delete');
			delBtn.setAttribute('data-id', task.id);
			delBtn.setAttribute('type', 'button');
			actions.appendChild(delBtn);
		}

		// Priority dropdown (inline edit)
		const prioSelect = document.createElement('select');
		prioSelect.className = 'priority-select';
		prioSelect.setAttribute('data-action', 'priority');
		prioSelect.setAttribute('data-id', task.id);
		['high','medium','low'].forEach(p => {
			const opt = document.createElement('option');
			opt.value = p;
			opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
			if (task.priority === p) opt.selected = true;
			prioSelect.appendChild(opt);
		});
		actions.appendChild(prioSelect);

		// Assemble
		li.appendChild(prio);
		li.appendChild(text);
		li.appendChild(actions);
		list.appendChild(li);
	}
}
// --- Data Model ---
// Each task: { id, text, priority, completed }
let tasks = [];

// --- Utility Functions ---
// Save tasks to localStorage
function saveTasks() {
	localStorage.setItem('todo_tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
	try {
		const data = localStorage.getItem('todo_tasks');
		tasks = data ? JSON.parse(data) : [];
	} catch (e) {
		tasks = [];
	}
}


// --- Task Operations ---
function addTask(text, priority) {
	if (!text.trim()) return;
	if (tasks.some(t => t.text === text.trim())) {
		showInlineAlert('Task already exists!');
		return;
	}
	const task = {
		id: generateId(),
		text: text.trim(),
		priority,
		completed: false
	};
	tasks.push(task);
	saveTasks();
	renderTasks();
}

function editTask(id) {
	window.editingTaskId = id;
	renderTasks();
	// Focus input
	setTimeout(() => {
		const input = document.querySelector('.todo-edit-input');
		if (input) input.focus();
	}, 50);
}

function saveEditTask(id) {
	const input = document.querySelector('.todo-edit-input');
	if (!input) return;
	const newText = input.value;
	if (!newText.trim()) {
		showInlineAlert('Task cannot be empty.');
		return;
	}
	if (tasks.some(t => t.text === newText.trim() && t.id !== id)) {
		showInlineAlert('Task already exists!');
		return;
	}
	const task = tasks.find(t => t.id === id);
	if (task) {
		task.text = newText.trim();
		saveTasks();
	}
	window.editingTaskId = null;
	renderTasks();
}

function cancelEditTask() {
	window.editingTaskId = null;
	renderTasks();
}

function showInlineAlert(msg) {
	// Show a temporary alert above the form
	let alertDiv = document.getElementById('inline-alert');
	if (!alertDiv) {
		alertDiv = document.createElement('div');
		alertDiv.id = 'inline-alert';
		alertDiv.style.background = '#ff5252';
		alertDiv.style.color = '#fff';
		alertDiv.style.padding = '0.5rem 1rem';
		alertDiv.style.margin = '0.5rem auto';
		alertDiv.style.borderRadius = '4px';
		alertDiv.style.maxWidth = '500px';
		alertDiv.style.textAlign = 'center';
		alertDiv.style.fontWeight = 'bold';
		const form = document.getElementById('todo-form');
		form.parentNode.insertBefore(alertDiv, form);
	}
	alertDiv.textContent = msg;
	setTimeout(() => {
		if (alertDiv) alertDiv.remove();
	}, 1800);
}


function deleteTask(id) {
	window.deletingTaskId = id;
	renderTasks();
}

function confirmDeleteTask(id) {
	tasks = tasks.filter(t => t.id !== id);
	saveTasks();
	window.deletingTaskId = null;
	renderTasks();
}

function cancelDeleteTask() {
	window.deletingTaskId = null;
	renderTasks();
}

function toggleComplete(id) {
	const task = tasks.find((t) =>{return t.id === id;});
	if (task) {
		task.completed = !task.completed;
		saveTasks();
		renderTasks();
	}
}

function changePriority(id, newPriority) {
	const task = tasks.find((t) => { t.id === id;});
	if (task && ['high','medium','low'].includes(newPriority)) {
		task.priority = newPriority;
		saveTasks();
		renderTasks();
	}
}

// --- Event Listeners ---

// Handles form submission to add a new task
document.getElementById('todo-form').addEventListener('submit', function(e) {
	e.preventDefault();
	const input = document.getElementById('todo-input');
	const prio = document.getElementById('priority-input');
	addTask(input.value, prio.value);
	input.value = '';
	prio.value = 'medium';
	input.focus();
});

// Use event delegation for all actions on the todo list
document.getElementById('todo-list').addEventListener('click', function(e) {
	// Find the closest button with a data-action attribute
	const btn = e.target.closest('button[data-action]');
	if (!btn) return;
	const action = btn.getAttribute('data-action');
	const id = btn.getAttribute('data-id');
	if (action === 'toggle') toggleComplete(id);
	else if (action === 'edit') editTask(id);
	else if (action === 'save-edit') saveEditTask(id);
	else if (action === 'cancel-edit') cancelEditTask();
	else if (action === 'delete') deleteTask(id);
	else if (action === 'confirm-delete') confirmDeleteTask(id);
	else if (action === 'cancel-delete') cancelDeleteTask();
});

// Use event delegation for priority change
document.getElementById('todo-list').addEventListener('change', function(e) {
	const select = e.target.closest('select[data-action]');
	if (!select) return;
	const action = select.getAttribute('data-action');
	const id = select.getAttribute('data-id');
	if (action === 'priority') changePriority(id, select.value);
});

// --- Initialization ---
loadTasks();
renderTasks();
