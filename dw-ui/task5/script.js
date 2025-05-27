// dropdown menu
const toggleBtn = document.querySelector(".toggle_btn");
const toggleBtnIcon = document.querySelector(".toggle_btn i");
const dropDownMenu = document.querySelector(".dropdown_menu");

toggleBtn.onclick = function () {
  dropDownMenu.classList.toggle("open");
};
// akhir dropdown

// project
const projects = [];

function getData(e) {
  e.preventDefault();

  const name = document.getElementById("project-name").value;
  const start = Date.parse(document.getElementById("start-date").value);
  const end = Date.parse(document.getElementById("end-date").value);
  const desc = document.getElementById("desc").value;
  const node = document.getElementById("nodejs").checked;
  const react = document.getElementById("reactjs").checked;
  const next = document.getElementById("nextjs").checked;
  const typescript = document.getElementById("typescript").checked;
  const imageFile = document.getElementById("project-image").files[0];

  if (!name || !desc || !imageFile) {
    alert("Please fill all fields");
    return;
  }

  const duration = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));

  const reader = new FileReader();
  reader.onload = function (event) {
    const newProject = {
      name,
      duration,
      desc,
      techs: { node, react, next, typescript },
      img: event.target.result,
    };
    projects.push(newProject);
    renderCards();
  };

  reader.readAsDataURL(imageFile);
}

function renderCards() {
  const container = document.getElementById("cardContainer");
  if (projects) {
    document.getElementById("project-section").style.display = "";
  }
  container.innerHTML = "";

  projects
    .map((p) => {
      container.innerHTML += `
          <div class="col">
            <div class="card" id="konten">
              <img src="${p.img}" class="fixed-img" alt="${p.name}" />
              <div class="card-body">
                <h5 class="card-title">${p.name} - ${new Date().getFullYear()}</h5>
                <p class="card-time">durasi: ${p.duration} bulan</p>
                <p class="card-text">${p.desc}</p>
              </div>
              <div class="card-icon">
                  ${p.techs.node ? '<img class="tech-icon" src="img/nodejs.png" />' : ""}
                  ${p.techs.react ? '<img class="tech-icon" src="img/reactjs.png" />' : ""}
                  ${p.techs.next ? '<img class="tech-icon" src="img/nextjs.png" />' : ""}
                  ${p.techs.typescript ? '<img class="tech-icon" src="img/typescript.png" />' : ""}
              </div>
              <div class="card-button" style="display: flex; justify-content: center; gap: 30px">
                <button class="btn" style="width: 140px; margin-bottom: 5px">edit</button>
                <button class="btn" style="width: 140px; margin-bottom: 5px" onclick="getRemoveData(event)">delete</button>
              </div>
            </div>
          </div>
          `;
    })
    .join("");
}

function getRemoveData(event) {
  event.preventDefault();
  document.getElementById("konten").remove();
}
