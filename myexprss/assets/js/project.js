let editMode = false;
let editId = null;

document.getElementById("projectForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const file = document.getElementById("project-image").files[0];

  const submitBtn = document.querySelector(".btn-project");
  const spinner = document.getElementById("loadingSpinner");

  // Tampilkan loading spinner & disable tombol
  spinner.style.display = "inline-block";
  submitBtn.disabled = true;

  const name = formData.get("projectName");
  const start = new Date(formData.get("sdate"));
  const end = new Date(formData.get("edate"));
  const desc = formData.get("desc");
  const duration = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));

  const techs = {
    node: formData.get("node") !== null,
    react: formData.get("react") !== null,
    next: formData.get("next") !== null,
    typescript: formData.get("typescript") !== null,
  };

  try {
    let response, result;

    if (editMode && editId) {
      console.log("🚨 Sedang Edit ID:", editId);
      // ========== PUT: Update Project ==========
      response = await fetch(`/project/${editId}`, {
        method: "PUT",
        body: formData,
      });
      result = await response.json();
    } else {
      // ========== POST: Tambah Baru ==========
      response = await fetch("/project", {
        method: "POST",
        body: formData,
      });
      result = await response.json();
    }

    if (!response.ok) {
      console.error("❌ Gagal submit:", result.message);
      return alert("❌ " + result.message);
    }

    alert("✅ Project berhasil disubmit!");
    console.log("✅ Project berhasil disubmit:", result);

    // ========== Baca Gambar ==========
    const reader = new FileReader();
    reader.onload = function (event) {
      const newProject = {
        id: editMode ? editId : result.id,
        name,
        duration,
        desc,
        startDate: start,
        endDate: end,
        techs,
        img: event.target.result,
      };

      let projects = JSON.parse(localStorage.getItem("projects")) || [];

      if (editMode) {
        // Ganti data existing
        const index = projects.findIndex((p) => p.id == editId);
        if (index !== -1) projects[index] = newProject;
      } else {
        // Tambah baru
        projects.push(newProject);
      }

      localStorage.setItem("projects", JSON.stringify(projects));
      renderCards();
      form.reset();
      document.getElementById("preview-image").style.display = "none";
      document.getElementById("project-section").style.display = "block";

      // Reset edit mode
      editMode = false;
      editId = null;
    };

    if (file) {
      reader.readAsDataURL(file);
    } else {
      // Jika tidak ada gambar baru (saat edit), gunakan gambar lama
      const projects = JSON.parse(localStorage.getItem("projects")) || [];
      const old = projects.find((p) => p.id == editId);
      reader.onload({ target: { result: old.img } });
    }
  } catch (err) {
    console.error("❌ Error saat submit:", err);
    alert("❌ Terjadi kesalahan");
  } finally {
    // ✅ Sembunyikan loading spinner & aktifkan tombol
    spinner.style.display = "none";
    submitBtn.disabled = false;
  }
});

// Membatasi description di Card Project
function truncate(text, max) {
  return text.length > max ? text.substring(0, max) + "..." : text;
}
// RenderCard
function renderCards() {
  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";

  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const section = document.getElementById("project-section");

  if (projects.length === 0) {
    section.style.display = "none";
  } else {
    section.style.display = "block";
  }

  projects.forEach((project) => {
    const techIcons = [];
    if (project.techs.node) techIcons.push('<img class="tech-icon" src="/assets/img/node.png" />');
    if (project.techs.react) techIcons.push('<img class="tech-icon" src="/assets/img/react.png" />');
    if (project.techs.next) techIcons.push('<img class="tech-icon" src="/assets/img/next.png" />');
    if (project.techs.typescript) techIcons.push('<img class="tech-icon" src="/assets/img/typescript.png" />');

    // Buat elemen card utama
    const card = document.createElement("div");
    card.classList.add("card");

    // Set link untuk halaman detail (gunakan id project)
    card.setAttribute("onclick", `goToDetail('${project.id}')`);
    card.style.cursor = "pointer";

    // HTML Card Projects
    card.innerHTML = `
      <img src="${project.img}" class="fixed-img" />
      <div class="card-body">
        <h3>${project.name} - ${new Date().getFullYear()}</h3>
        <p class="card-time">duration: ${project.duration} month</p>
        <p class="card-text">${truncate(project.desc, 100)}</p>
      </div>
      <div class="tech-icons">${techIcons.join(" | ")}</div>
    `;

    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "card-button";
    buttonWrapper.style.display = "flex";
    buttonWrapper.style.justifyContent = "center";
    buttonWrapper.style.gap = "10px";
    buttonWrapper.innerHTML = `
      <div class="card-button" style="display: flex; justify-content: center; gap: 10px">
        <button class="btn" type="button" onclick="editProject(event)" data-id="${project.id}">edit</button>
        <button class="btn" onclick="getRemoveData(event)" data-id="${project.id}">delete</button>
      </div>
    `;

    // Tambahkan ke container
    card.appendChild(buttonWrapper);
    cardContainer.appendChild(card);
  });
}

function goToDetail(id) {
  window.open(`/project/${id}`, '_blank');
}

window.addEventListener("DOMContentLoaded", () => {
  renderCards();
});

// Untuk menghapus data
async function getRemoveData(event) {
  event.preventDefault();
  event.stopPropagation();

  const button = event.target;
  const id = button.getAttribute("data-id");

  try {
    console.log("🧨 Menghapus project ID:", id);

    // 1. Hapus dari database via backend
    const response = await fetch(`/project/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete from database");

    // 2. Hapus dari localStorage
    let projects = JSON.parse(localStorage.getItem("projects")) || [];
    projects = projects.filter((project) => project.id != id);
    localStorage.setItem("projects", JSON.stringify(projects));

    // 3. Render ulang kartu (UI refresh)
    renderCards();

    alert("✅ Project berhasil dihapus!");
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    alert("❌ Gagal menghapus project.");
  }
}

// Untuk mengedit data
function editProject(event) {
  event.stopPropagation();
  const id = event.target.getAttribute("data-id");
  console.log("✏️ Edit ID:", id);
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id == id);

  if (!project) return alert("❌ Project tidak ditemukan");

  // Isi form
  document.getElementById("project-name").value = project.name;
  document.getElementById("start-date").value = new Date(project.startDate).toISOString().split("T")[0];
  document.getElementById("end-date").value = new Date(project.endDate).toISOString().split("T")[0];
  document.getElementById("desc").value = project.desc;
  document.getElementById("nodejs").checked = project.techs.node;
  document.getElementById("reactjs").checked = project.techs.react;
  document.getElementById("nextjs").checked = project.techs.next;
  document.getElementById("typescript").checked = project.techs.typescript;

  // Set edit mode
  editMode = true;
  editId = id;

  // Tampilkan preview gambar lama
  const previewImg = document.getElementById("preview-image");
  previewImg.src = project.img;
  previewImg.style.display = "block";

  // Scroll ke atas agar form terlihat
  window.scrollTo({ top: 0, behavior: "smooth" });
}
