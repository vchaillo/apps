"use strict";

const grid = document.querySelector("#project-grid");
const count = document.querySelector("#count");
const error = document.querySelector("#error");
const template = document.querySelector("#project-template");
const tabs = document.querySelector("#category-tabs");
const dialog = document.querySelector("#category-dialog");
const manager = document.querySelector("#manage-categories");
const rows = document.querySelector("#category-rows");
const message = document.querySelector("#category-message");
const newCategory = document.querySelector("#new-category-name");
const storageKey = "github-apps-category-overrides-v2";
const legacyStorageKey = "apps-category-overrides-v1";
let projects = [];
let overrides = {};
let activeCategory = null;
let draft = {};
let draftCategories = [];

function validateProject(project) {
  for (const key of ["id", "name", "description", "category", "url", "repository"]) {
    if (typeof project[key] !== "string" || !project[key].trim()) throw new Error(`Missing field: ${key}`);
  }
  for (const key of ["url", "repository"]) {
    if (new URL(project[key]).protocol !== "https:") throw new Error(`Unsupported URL: ${key}`);
  }
}

function categoryOf(project) {
  return overrides[project.id] || project.categories || [project.category];
}

function readOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(projects.flatMap(project => {
      const value = saved[project.id];
      const categories = [...new Set((Array.isArray(value) ? value : [value]).filter(item => typeof item === "string" && item.trim() && item.length <= 60).map(item => item.trim()))];
      return categories.length ? [[project.id, categories]] : [];
    }));
  } catch {
    return {};
  }
}

function render() {
  const categories = [...new Set(projects.flatMap(categoryOf))];
  if (activeCategory && !categories.includes(activeCategory)) activeCategory = null;
  tabs.replaceChildren();
  [null, ...categories].forEach((category, index) => {
    const button = document.createElement("button");
    const selected = category === activeCategory;
    button.type = "button";
    button.className = "tab";
    button.id = `category-tab-${index}`;
    button.textContent = category || "Toutes";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(selected));
    button.setAttribute("aria-controls", "project-grid");
    button.tabIndex = selected ? 0 : -1;
    if (selected) grid.setAttribute("aria-labelledby", button.id);
    button.addEventListener("click", () => {
      activeCategory = category;
      render();
      document.querySelector(`[role="tab"][aria-selected="true"]`).focus();
    });
    tabs.append(button);
  });
  const visible = projects.filter(project => !activeCategory || categoryOf(project).includes(activeCategory));
  grid.replaceChildren(...visible.map(project => {
    const card = template.content.cloneNode(true);
    card.querySelector("article").dataset.featured = String(["year-tracker", "classroom-map"].includes(project.id));
    card.querySelector(".icon").textContent = project.icon || "▦";
    card.querySelector(".category").textContent = categoryOf(project).join(" · ");
    card.querySelector("h3").textContent = project.name;
    const details = card.querySelector(".details-trigger");
    details.setAttribute("aria-label", `Voir les détails de ${project.name}`);
    details.addEventListener("click", () => openProject(project));
    card.querySelector(".status").textContent = project.status || "";
    card.querySelector(".description").textContent = project.description;
    const open = card.querySelector(".open");
    open.href = project.url;
    open.setAttribute("aria-label", `Ouvrir ${project.name} dans un nouvel onglet`);
    const source = card.querySelector(".source");
    source.href = project.repository;
    source.setAttribute("aria-label", `Code source de ${project.name}`);
    return card;
  }));
  count.textContent = `${visible.length} application${visible.length === 1 ? "" : "s"}`;
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucune application dans cette catégorie.";
    grid.append(empty);
  }
}

tabs.addEventListener("keydown", event => {
  const buttons = [...tabs.querySelectorAll("button")];
  const current = buttons.indexOf(document.activeElement);
  if (current < 0) return;
  let next;
  if (event.key === "ArrowRight") next = (current + 1) % buttons.length;
  if (event.key === "ArrowLeft") next = (current - 1 + buttons.length) % buttons.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = buttons.length - 1;
  if (next === undefined) return;
  event.preventDefault();
  buttons[next].click();
});

function renderRows() {
  rows.replaceChildren(...projects.map(project => {
    const row = document.createElement("div");
    row.className = "category-row";
    const label = document.createElement("h3");
    label.textContent = `${project.icon || "▦"} ${project.name}`;
    row.append(label, categoryChoices(draftCategories, draft[project.id], value => { draft[project.id] = value; }));
    return row;
  }));
}

manager.addEventListener("click", () => {
  draft = Object.fromEntries(projects.map(project => [project.id, [...categoryOf(project)]]));
  draftCategories = [...new Set([...projects.flatMap(categoryOf), ...projects.map(project => project.category)])];
  message.textContent = "";
  newCategory.value = "";
  renderRows();
  dialog.showModal();
});

function addCategory() {
  const category = newCategory.value.trim();
  if (!category) {
    message.textContent = "Saisis un nom de catégorie.";
    newCategory.focus();
    return;
  }
  if (draftCategories.some(existing => existing.toLocaleLowerCase("fr") === category.toLocaleLowerCase("fr"))) {
    message.textContent = "Cette catégorie existe déjà.";
    return;
  }
  draftCategories.push(category);
  renderRows();
  newCategory.value = "";
  message.textContent = `« ${category} » est disponible dans les listes.`;
}

document.querySelector("#add-category").addEventListener("click", addCategory);
newCategory.addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); addCategory(); }
});
document.querySelector("#category-form").addEventListener("submit", event => {
  event.preventDefault();
  if (projects.some(project => !draft[project.id].length)) { message.textContent = "Choisis au moins une catégorie pour chaque application."; return; }
  const next = draft;
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    message.textContent = "La sauvegarde est bloquée par ce navigateur. Autorise le stockage local pour enregistrer tes catégories.";
    return;
  }
  overrides = next;
  render();
  dialog.close();
});
for (const id of ["close-dialog", "cancel-dialog"]) document.querySelector(`#${id}`).addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

async function loadProjects() {
  grid.setAttribute("aria-busy", "true");
  error.hidden = true;
  manager.disabled = true;
  count.textContent = "Chargement…";
  try {
    const response = await fetch("./projects.json");
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const catalog = await response.json();
    if (!Array.isArray(catalog)) throw new Error("The catalog must be an array");
    catalog.forEach(validateProject);
    if (new Set(catalog.map(project => project.id)).size !== catalog.length) throw new Error("IDs must be unique");
    projects = catalog;
    overrides = readOverrides();
    render();
    manager.disabled = false;
  } catch (cause) {
    console.error("Unable to load the project catalog", cause);
    count.textContent = "Catalogue indisponible";
    error.hidden = false;
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

document.querySelector("#retry").addEventListener("click", loadProjects);
loadProjects();

const projectDialog = document.querySelector("#project-dialog");
const projectChoices = document.querySelector("#project-categories");
const projectMessage = document.querySelector("#project-message");
let selectedProject;
let selectedCategories = [];
let availableCategories = [];
let returnFocus;

function categoryChoices(categories, selected, onChange) {
  const group = document.createElement("div");
  group.className = "category-choices";
  for (const category of categories) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected.includes(category);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.push(category);
      else selected.splice(selected.indexOf(category), 1);
      onChange([...selected]);
    });
    const text = document.createElement("span");
    text.textContent = category;
    label.append(checkbox, text);
    group.append(label);
  }
  return group;
}

function renderProjectChoices() {
  projectChoices.replaceChildren(categoryChoices(availableCategories, selectedCategories, value => { selectedCategories = value; }));
}

function openProject(project) {
  returnFocus = document.activeElement;
  selectedProject = project;
  selectedCategories = [...categoryOf(project)];
  availableCategories = [...new Set([...projects.flatMap(categoryOf), ...projects.map(item => item.category)])];
  document.querySelector("#project-title").textContent = project.name;
  document.querySelector("#project-icon").textContent = project.icon || "▦";
  document.querySelector("#project-summary").textContent = project.summary || project.description;
  const technologies = document.querySelector("#project-technologies");
  technologies.replaceChildren(...(project.technologies || []).map(technology => {
    const tag = document.createElement("li"); tag.textContent = technology; return tag;
  }));
  document.querySelector("#project-open").href = project.url;
  document.querySelector("#project-source").href = project.repository;
  projectMessage.textContent = "";
  document.querySelector("#project-new-category").value = "";
  renderProjectChoices();
  projectDialog.showModal();
}

function addProjectCategory() {
  const input = document.querySelector("#project-new-category");
  const name = input.value.trim();
  if (!name) { projectMessage.textContent = "Saisis un nom de catégorie."; input.focus(); return; }
  const existing = availableCategories.find(item => item.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"));
  const category = existing || name;
  if (!existing) availableCategories.push(category);
  if (!selectedCategories.includes(category)) selectedCategories.push(category);
  input.value = "";
  projectMessage.textContent = "";
  renderProjectChoices();
}
document.querySelector("#project-add-category").addEventListener("click", addProjectCategory);
document.querySelector("#project-new-category").addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); addProjectCategory(); }
});
document.querySelector("#project-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!selectedCategories.length) { projectMessage.textContent = "Choisis au moins une catégorie."; return; }
  const next = {...overrides, [selectedProject.id]: [...selectedCategories]};
  try { localStorage.setItem(storageKey, JSON.stringify(next)); }
  catch { projectMessage.textContent = "Impossible d’enregistrer les catégories dans ce navigateur."; return; }
  overrides = next;
  render();
  projectDialog.close();
});
for (const id of ["project-close", "project-cancel"]) document.querySelector(`#${id}`).addEventListener("click", () => projectDialog.close());
projectDialog.addEventListener("click", event => {
  if (event.target !== projectDialog) return;
  const bounds = projectDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) projectDialog.close();
});
projectDialog.addEventListener("close", () => {
  const trigger = [...grid.querySelectorAll(".details-trigger")].find(button => button.getAttribute("aria-label") === `Voir les détails de ${selectedProject.name}`);
  (trigger || (returnFocus?.isConnected ? returnFocus : document.querySelector('[aria-selected="true"]')))?.focus();
});

