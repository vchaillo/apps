"use strict";

const grid = document.querySelector("#project-grid");
const count = document.querySelector("#count");
const error = document.querySelector("#error");
const template = document.querySelector("#project-template");

function validateProject(project) {
  for (const key of ["id", "name", "description", "category", "url", "repository"]) {
    if (typeof project[key] !== "string" || !project[key].trim()) {
      throw new Error(`Missing project field: ${key}`);
    }
  }
  for (const key of ["url", "repository"]) {
    if (new URL(project[key]).protocol !== "https:") {
      throw new Error(`Unsupported project URL: ${key}`);
    }
  }
}

async function loadProjects() {
  grid.setAttribute("aria-busy", "true");
  error.hidden = true;
  count.textContent = "Chargement…";
  try {
    const response = await fetch("./projects.json");
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const projects = await response.json();
    if (!Array.isArray(projects)) throw new Error("The catalog must be an array");
    projects.forEach(validateProject);
    if (new Set(projects.map(project => project.id)).size !== projects.length) {
      throw new Error("Project IDs must be unique");
    }
    const cards = projects.map(project => {
      const card = template.content.cloneNode(true);
      card.querySelector(".icon").textContent = project.icon || "▦";
      card.querySelector(".category").textContent = project.category;
      card.querySelector("h3").textContent = project.name;
      card.querySelector(".status").textContent = project.status || "";
      card.querySelector(".description").textContent = project.description;
      card.querySelector(".note").textContent = project.note || "";
      const open = card.querySelector(".open");
      open.href = project.url;
      open.setAttribute("aria-label", `Ouvrir ${project.name}`);
      const source = card.querySelector(".source");
      source.href = project.repository;
      source.setAttribute("aria-label", `Code source de ${project.name}`);
      return card;
    });
    grid.replaceChildren(...cards);
    count.textContent = `${projects.length} projet${projects.length === 1 ? "" : "s"}`;
    if (!projects.length) count.textContent = "Aucun projet pour le moment";
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
