const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const router = express.Router();
const pool = require("./postgres");
const upload = require("./middlewares/uploads-file");
// Format tanggal & hitung durasi
const moment = require("moment");
// Upload form input ke database contact
const { handleContact } = require("./handler/handler_contact");
// Upload, Edit, Delete, View Detail Project
const { handleProject, handleDeleteProject, handleUpdateProject, handleDetailProject } = require("./handler/handler_project");

// Route untuk create
router.post("/project", upload.single("image"), handleProject);
// Route untuk delete
router.delete("/project/:id", handleDeleteProject);
// Route untuk update
router.put("/project/:id", upload.single("image"), handleUpdateProject);

module.exports = router;

const app = express();
const port = 8080;

app.locals.moment = moment;
// Default Partials/Layout Doctype
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      formatDate: (date, format) => moment(date).format(format),
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");
// Untuk Melihat File Assets
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  console.error("❌ Error Middleware:", err.message);
  if (err instanceof multer.MulterError) {
    // Error dari multer (contoh: file terlalu besar)
    return res.status(400).send({ error: err.message });
  } else if (err) {
    // Error lain (contoh: ekstensi tidak valid)
    return res.status(400).send({ error: err.message });
  }
  next(); // teruskan ke middleware lain kalau tidak ada error
});

// Render Halaman Home
app.get("/", (req, res) => {
  res.render("index", { title: "Toriq Rosid" });
});

// Render Halaman Project
app.get("/project", (req, res) => {
  res.render("project", { title: "Project" });
});
// Render Halaman Project Detail
app.get("/project/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM project WHERE id = $1", [projectId]);
    const project = result.rows[0];

    if (!project) {
      return res.status(404).send("Project not found");
    }

    // Format tanggal & hitung durasi
    project.start_date_formatted = moment(project.start_date).format("DD MMM YYYY");
    project.end_date_formatted = moment(project.end_date).format("DD MMM YYYY");
    const durationInMonths = moment(project.end_date).diff(moment(project.start_date), "months", true);
    project.duration = Math.ceil(durationInMonths);

    project.duration_label = `${project.duration} month${project.duration > 1 ? "s" : ""}`;

    // Flag Technologi
    const techs = (project.technologies || "").split(",").map((t) => t.trim().toLowerCase());
    project.tech_node = techs.includes("node js");
    project.tech_react = techs.includes("react js");
    project.tech_next = techs.includes("next js");
    project.tech_typescript = techs.includes("typescript");

    res.render("project-detail", {
      title: `Detail - ${project.project_name}`,
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Render Halaman Contact
app.get("/contact", (req, res) => {
  res.render("contact", { title: "Get in Touch" });
});
// Post Halaman Contact Ke Database
app.post("/contact", handleContact);

// Middleware router
app.use(router);

// Port Berjalan
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
// Test Postgres Connected
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL connected!");
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
})();
