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
const storageKey = "apps-category-overrides-v1";
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
  return overrides[project.id] || project.category;
}

function readOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(projects.filter(project => typeof saved[project.id] === "string" && saved[project.id].trim() && saved[project.id].length <= 60).map(project => [project.id, saved[project.id].trim()]));
  } catch {
    return {};
  }
}

function render() {
  const categories = [...new Set(projects.map(categoryOf))];
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
  const visible = projects.filter(project => !activeCategory || categoryOf(project) === activeCategory);
  grid.replaceChildren(...visible.map(project => {
    const card = template.content.cloneNode(true);
    card.querySelector("article").dataset.featured = String(["year-tracker", "classroom-map"].includes(project.id));
    card.querySelector(".icon").textContent = project.icon || "▦";
    card.querySelector(".category").textContent = categoryOf(project);
    card.querySelector("h3").textContent = project.name;
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
    const label = document.createElement("label");
    label.htmlFor = `category-${project.id}`;
    label.textContent = `${project.icon || "▦"} ${project.name}`;
    const select = document.createElement("select");
    select.id = label.htmlFor;
    for (const category of draftCategories) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      select.append(option);
    }
    select.value = draft[project.id];
    select.addEventListener("change", () => { draft[project.id] = select.value; });
    row.append(label, select);
    return row;
  }));
}

manager.addEventListener("click", () => {
  draft = Object.fromEntries(projects.map(project => [project.id, categoryOf(project)]));
  draftCategories = [...new Set([...projects.map(categoryOf), ...projects.map(project => project.category)])];
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
  const next = Object.fromEntries(projects.filter(project => draft[project.id] !== project.category).map(project => [project.id, draft[project.id]]));
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
