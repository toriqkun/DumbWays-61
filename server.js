const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const moment = require("moment");
const methodOverride = require("method-override");
const { pool } = require("./postgres");
const upload = require("./middlewares/upload-file");
const { isAuthenticated } = require("./middlewares/auth");
const app = express();

const {
  handleRegister,
  handleLogin,
  getDashboard,
  handleLogout,
  handleTechStack,
  handleDeleteTechStack,
  getEditTechStackForm,
  handleUpdateTechStack,
  handleExperience,
  handleDeleteExperience,
  getEditExperienceForm,
  handleUpdateExperience,
  handleProjects,
  getEditProjectForm,
  handleUpdateProject,
  handleDeleteProject,
} = require("./controllers/controllers");

const profileController = require("./controllers/profileController");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

const port = 2003;

// Konfigurasi Session
app.use(
  session({
    secret: "Icunnn",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(async (req, res, next) => {
  res.locals.profile = {
    fullName: "Pengguna",
    imageUrl: "/assets/img/default-profile.jpg",
  };

  if (req.session && req.session.userId) {
    try {
      const result = await pool.query("SELECT full_name, profile_image FROM accounts WHERE id = $1", [req.session.userId]);

      const user = result.rows[0];
      if (user) {
        res.locals.profile = {
          fullName: user.full_name || "Pengguna",
          imageUrl: user.profile_image ? `/uploads/${user.profile_image}` : "/assets/img/default-profile.jpg",
        };
      }
    } catch (err) {
      console.error("Gagal mengambil profile user:", err);
    }
  }

  next();
});

// Konfigurasi Flash Messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.successMessage = req.flash("success").join(" ") || null;
  res.locals.errorMessage = req.flash("error").join(" ") || null;
  next();
});

// Setup Handlebars dengan layout + partials
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layout"),
    partialsDir: path.join(__dirname, "views", "partials"),
    helpers: {
      formatDate: (date, format) => moment(date).format(format),
      addOne: (value) => value + 1,
      subtract: (a, b) => a - b,
      times: function (n, block) {
        let accum = "";
        for (let i = 0; i < n; ++i) {
          accum += block.fn(i);
        }
        return accum;
      },
      lt: (a, b) => a < b,
      add: (a, b) => a + b,
      split: (str, delimiter) => str.split(delimiter),
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Static folder untuk CSS dan gambar
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Helper function untuk format tanggal pengalaman kerja
const formatExperienceDate = (dateString) => {
  if (dateString === "present") {
    return "Present";
  }
  if (!dateString) {
    return "";
  }
  // Menggunakan moment untuk format tanggal
  return moment(dateString).format("MMM YYYY"); // Contoh: "Oct 2022"
};

// Routes Portofolio (Home Page)
app.get("/", async (req, res) => {
  try {
    const experienceResult = await pool.query("SELECT * FROM public.experience ORDER BY id DESC");

    // Proses data experiences untuk tampilan
    const experiences = experienceResult.rows.map((row) => {
      const startDateFormatted = formatExperienceDate(row.start_date);
      const endDateFormatted = formatExperienceDate(row.end_date);

      let displayDate;
      if (row.end_date === "present") {
        displayDate = `${startDateFormatted} - Present`;
      } else if (startDateFormatted && endDateFormatted) {
        displayDate = `${startDateFormatted} - ${endDateFormatted}`;
      } else {
        displayDate = "";
      }

      return {
        id: row.id,
        position: row.position,
        company: row.company,
        displayDate: displayDate,
        responsibilities: row.job_responsibilities ? row.job_responsibilities.split("|||").map((item) => item.trim()) : [],
        technologies: row.technologies ? row.technologies.split(", ").map((item) => item.trim()) : [],
        imageUrl: row.image,
      };
    });

    const techStackResult = await pool.query("SELECT id, image, nama_tools FROM public.techstack ORDER BY id ASC");
    const techStacks = techStackResult.rows;

    const projectResult = await pool.query("SELECT * FROM public.myprojects ORDER BY id DESC");
    const projects = projectResult.rows.map((row) => {
      return {
        id: row.id,
        project_name: row.project_name,
        description: row.description,
        technologies_array: row.technologies ? row.technologies.split(",").map((tech) => tech.trim()) : [], // Pecah string teknologi menjadi array
        image_url: row.image, // <<< PENTING: Gunakan 'row.image' karena itu nama kolom di DB Anda
        repo_link: row.repo_link,
        live_demo: row.live_demo,

        // --- Tambahkan flag untuk conditional rendering di Handlebars ---
        // isPrivateRepo: True jika repo_link adalah NULL/kosong/spasi
        isPrivateRepo: !row.repo_link || row.repo_link.trim() === "",
        // hasLiveDemo: True jika live_demo tidak NULL/kosong/spasi
        hasLiveDemo: !!row.live_demo && row.live_demo.trim() !== "",
      };
    });

    res.render("portofolio", {
      title: "Toriq Rosid",
      experiences: experiences,
      techStacks: techStacks,
      projects: projects,
      hideHeader: true,
    });
  } catch (err) {
    console.error("Error fetching data for portfolio page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Rute untuk menampilkan form registrasi
app.get("/register", (req, res) => {
  const errors = req.session.errors || {};
  const formData = req.session.formData || {};

  // Hapus data setelah ditampilkan
  req.session.errors = null;
  req.session.formData = null;

  res.render("register", {
    title: "Daftar Akun Baru",
    errors,
    email: formData.email || "",
    hideHeader: true,
  });
});
app.post("/register", handleRegister);

// Rute untuk menampilkan form login
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    registrationSuccess: req.query.registration === "success",
    hideHeader: true,
  });
});
app.post("/login", handleLogin);

// Route LogOut
app.post("/logout", handleLogout);

// Dashboard Route
app.get("/dashboard", isAuthenticated, getDashboard);

// PROFILE ROUTE
app.get("/profile", isAuthenticated, profileController.getProfile);
app.post("/profile", isAuthenticated, upload.single("profileImage"), profileController.updateProfile);

// Routes addTechStack
app.get("/add-techstack", isAuthenticated, (req, res) => {
  res.render("addTechStack", { title: "Form Techstack" });
});
app.post("/add-techstack", isAuthenticated, upload.single("toolsImage"), handleTechStack);

// Rute menghapus Tech Stack
app.post("/delete-techstack/:id", isAuthenticated, handleDeleteTechStack);
// Rute edit Tech Stack (form dan update)
app.get("/edit-techstack/:id", isAuthenticated, getEditTechStackForm);
app.post("/edit-techstack/:id", isAuthenticated, upload.single("toolsImage"), handleUpdateTechStack);

// Routes addExperience
app.get("/add-experience", isAuthenticated, (req, res) => {
  res.render("addExperience", { title: "Form Experience" });
});
app.post("/add-experience", isAuthenticated, upload.single("file"), handleExperience);

// Route delete experience
app.post("/delete-experience/:id", isAuthenticated, handleDeleteExperience);
// Route edit experience (form dan update)
app.get("/edit-experience/:id", isAuthenticated, getEditExperienceForm);
app.put("/edit-experience/:id", isAuthenticated, upload.single("file"), handleUpdateExperience);

// Route My Projects
app.get("/add-projects", isAuthenticated, (req, res) => {
  res.render("addMyProjects", { title: "Form Projects" });
});
app.post("/add-projects", isAuthenticated, upload.single("image"), handleProjects);

// Route edit projects (form dan update)
app.get("/edit-project/:id", isAuthenticated, getEditProjectForm);
app.put("/edit-project/:id", isAuthenticated, upload.single("image"), handleUpdateProject);
// Route delete projects
app.post("/delete-project/:id", isAuthenticated, handleDeleteProject);

// Port Berjalan
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
