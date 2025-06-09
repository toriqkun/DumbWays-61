const { pool } = require("../postgres");
const bcrypt = require("bcrypt");
const moment = require("moment");


async function handleExperience(req, res) {
  try {
    const { pekerjaan, perusahaan, sdate, edate, present, techno } = req.body;
    const file = req.file;

    const tasks = [req.body.task1, req.body.task2, req.body.task3, req.body.task4, req.body.task5].filter((task) => task && task.trim() !== "");
    const job_responsibilities = tasks.join("|||");

    console.log("Final job_responsibilities string being sent to DB:", job_responsibilities);

    // Menentukan endDate based on 'present' checkbox
    let endDate = edate; // Default to edate
    if (present === "on") {
      endDate = "present";
    }

    let image_url = null;
    if (file) {
      image_url = "/uploads/" + file.filename;
    }

    const submittedAt = new Date().toISOString();

    console.log("\n======= New Project Submission =======");
    console.log(`Position     : ${pekerjaan}`);
    console.log(`Company      : ${perusahaan}`);
    console.log(`Start Date   : ${sdate}`);
    console.log(`End Date     : ${edate}`);
    console.log(`Present      : ${present}`);
    console.log(`Job          : ${tasks}`);
    console.log(`Technologies : ${techno}`);
    console.log(`Image        : ${image_url}`);
    console.log(`Submitted At : ${new Date(submittedAt).toLocaleString()}`);
    console.log("======================================\n");
    console.log("req.file:", req.file);

    const queryText = `
            INSERT INTO experience (position, company, start_date, end_date, job_responsibilities, technologies, image)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
    const values = [pekerjaan, perusahaan, sdate, endDate, job_responsibilities, techno, image_url];

    await pool.query(queryText, values);
    console.log("✅ Data successfully inserted into database.");

    req.flash('success', '✅ Experience berhasil ditambahkan!');
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error inserting experience:", err);
    req.flash('error', 'Gagal menambahkan Experience.');
    res.redirect('/dashboard');
    res.status(500).send("Internal Server Error");
  }
}

async function handleTechStack(req, res) {
  try {
    const { nameTools } = req.body;
    const file = req.file;

    if (!nameTools) {
      req.flash("error", "⚠️ Nama Tools harus diisi.");
      return res.redirect("/dashboard");
    }

    let image_url = null;
    if (file) {
      image_url = "/uploads/" + file.filename;
    }

    console.log("\n======= New Tech Stack Tool Submission =======");
    console.log(`Nama Tools   : ${nameTools}`);
    console.log(`Image        : ${image_url}`);
    console.log("======================================\n");
    console.log("req.file:", req.file);

    // Insert data ke tabel 'public.techstack'
    const queryText = `
      INSERT INTO public.techstack (image, nama_tools)
      VALUES ($1, $2)
    `;
    const values = [image_url, nameTools];

    await pool.query(queryText, values);
    console.log("✅ Data tech stack successfully inserted into database.");

    req.flash("success", "✅ Tech Stack berhasil ditambahkan!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error inserting tech stack tool:", err);
    req.flash("error", "Gagal menambahkan Tech Stack.");
    res.status(500).send("Internal Server Error");
  }
}

async function handleRegister(req, res) {
  const { email, password, confirmPassword } = req.body;
  let errors = {};

  if (!email || !password || !confirmPassword) {
    errors.formError = "Semua field harus diisi.";
  }

  if (password !== confirmPassword) {
    errors.passwordError = "The password confirmation does not match.";
  }

  if (password && password.length < 6) {
    errors.passwordError = "Password minimal 6 karakter.";
  }

  if (Object.keys(errors).length > 0) {
    req.session.errors = errors;
    req.session.formData = { email };
    return res.redirect("/register");
  }

  try {
    const userExists = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      req.session.errors = { emailError: "Email sudah terdaftar." };
      req.session.formData = { email };
      return res.redirect("/register");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query("INSERT INTO accounts (email, password_hash) VALUES ($1, $2) RETURNING id, email", [email, passwordHash]);

    console.log("Pengguna baru berhasil terdaftar:", result.rows[0]);

    res.redirect("/login?registration=success");
  } catch (err) {
    console.error("Error saat registrasi pengguna:", err);
    req.session.errors = { serverError: "Terjadi kesalahan server." };
    req.session.formData = { email };
    res.redirect("/register");
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", {
      title: "Login",
      loginError: "Email dan password harus diisi.",
    });
  }

  try {
    const result = await pool.query("SELECT id, email, password_hash FROM accounts WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.render("login", {
        title: "Login",
        loginError: "Email atau password salah.",
      });
    }

    // Bandingkan Password yang Diberikan dengan Password Hash di Database
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      req.session.userId = user.id;
      console.log(`Pengguna ${user.email} berhasil login.`);
      return res.redirect("/dashboard");
    } else {
      return res.render("login", {
        title: "Login",
        loginError: "Email atau password salah.",
      });
    }
  } catch (err) {
    console.error("Error saat proses login:", err);
    return res.status(500).send("Terjadi kesalahan server saat login.");
  }
}

async function getDashboard(req, res) {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }

  try {
    // Ambil data tech stack
    const techStackResult = await pool.query("SELECT id, image, nama_tools FROM public.techstack ORDER BY id ASC");
    const techStacks = techStackResult.rows;

    // Ambil data Experience
    const experienceResult = await pool.query("SELECT * FROM public.experience ORDER BY id DESC");
    const experiences = experienceResult.rows.map((row) => {
      const start = moment(row.start_date).format("DD MMM YYYY");
      const end = row.end_date === "present" ? "Present" : moment(row.end_date).format("DD MMM YYYY");

      return {
        id: row.id,
        position: row.position,
        company: row.company,
        formattedPeriod: `${start} - ${end}`,
        job_responsibilities: row.job_responsibilities ? row.job_responsibilities.split("|||").map((item) => item.trim()) : [],
        technologies: row.technologies || "",
        imageUrl: row.image,
      };
    });

    // Ambil data My Projects
    const projectsResult = await pool.query("SELECT * FROM myprojects ORDER BY id DESC");
    const projects = projectsResult.rows;

    res.render("dashboard", {
      title: "Dashboard Profil",
      techStacks: techStacks,
      experiences: experiences,
      projects: projects,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).send("Internal Server Error saat memuat dashboard.");
  }
}

async function handleLogout(req, res) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Gagal logout.");
      }
      res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
}

async function handleDeleteTechStack(req, res) {
  const techStackId = req.params.id;

  try {
    await pool.query("DELETE FROM public.techstack WHERE id = $1", [techStackId]);
    console.log(`✅ Tech stack with ID ${techStackId} deleted successfully.`);
    req.flash("success", "✅ Tech Stack berhasil dihapus!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error deleting tech stack:", err);
    req.flash("error", "Gagal menghapus Tech Stack.");
    res.status(500).send("Gagal menghapus tech stack.");
  }
}

async function getEditTechStackForm(req, res) {
  const techStackId = req.params.id;

  try {
    const result = await pool.query("SELECT id, image, nama_tools FROM public.techstack WHERE id = $1", [techStackId]);
    const techStack = result.rows[0];

    if (!techStack) {
      req.flash("error", "Tech Stack tidak ditemukan.");
      return res.redirect("/dashboard");
    }

    // Ambil pesan flash 'error'
    const errorMessage = req.flash("error");

    res.render("editTechStack", {
      title: "Edit Tech Stack",
      techStack: techStack,
      error: errorMessage.length ? errorMessage[0] : null,
    });
  } catch (err) {
    console.error("Error fetching tech stack for edit:", err);
    req.flash("error", "Gagal mengambil data tech stack untuk diedit.");
    res.status(500).send("Gagal mengambil data tech stack untuk diedit.");
  }
}

async function handleUpdateTechStack(req, res) {
  const techStackId = req.params.id;
  const { nama_tools } = req.body;
  const file = req.file;

  if (!nama_tools) {
    req.flash("error", "⚠️ Nama Tools tidak boleh kosong.");
    return res.redirect(`/edit-techstack/${techStackId}`);
  }

  try {
    const currentTechStackResult = await pool.query("SELECT image FROM public.techstack WHERE id = $1", [techStackId]);
    const currentTechStack = currentTechStackResult.rows[0];

    if (!currentTechStack) {
      req.flash("error", "Tech Stack tidak ditemukan untuk diperbarui.");
      return res.redirect("/dashboard");
    }

    let imageUrl = currentTechStack.image;
    if (file) {
      imageUrl = "/uploads/" + file.filename;
    }

    await pool.query("UPDATE public.techstack SET image = $1, nama_tools = $2 WHERE id = $3", [imageUrl, nama_tools, techStackId]);
    console.log(`✅ Tech stack with ID ${techStackId} updated successfully.`);
    req.flash("success", "✅ Tech Stack berhasil diperbarui!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error updating tech stack:", err);
    req.flash("error", "Gagal memperbarui Tech Stack.");
    res.status(500).send("Gagal memperbarui tech stack.");
  }
}

async function handleDeleteExperience(req, res) {
  const id = req.params.id;
  try {
    await pool.query("DELETE FROM experience WHERE id = $1", [id]);
    req.flash("success", "✅ Experience berhasil dihapus.");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Gagal menghapus pengalaman:", err);
    req.flash("error", "❌ Gagal menghapus experience.");
    res.redirect("/dashboard");
  }
}

async function getEditExperienceForm(req, res) {
  try {
    const result = await pool.query("SELECT * FROM experience WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      req.flash("error", "Data pengalaman tidak ditemukan.");
      return res.redirect("/dashboard");
    }

    const experience = result.rows[0];

    experience.start_date_formatted = moment(experience.start_date).format("YYYY-MM-DD");
    experience.end_date_formatted = experience.end_date === "present" || !experience.end_date ? "" : moment(experience.end_date).format("YYYY-MM-DD");

    experience.isCurrentJob = experience.end_date === "present";

    const responsibilitiesArray = experience.job_responsibilities ? experience.job_responsibilities.split("|||").map((item) => item.trim()) : [];
    for (let i = 0; i < 5; i++) {
      experience[`task${i + 1}`] = responsibilitiesArray[i] || "";
    }
    experience.job_responsibilities_array = responsibilitiesArray;
    experience.image_url = experience.image;

    res.render("editExperience", {
      title: "Edit Pengalaman",
      experience: result.rows[0],
      error: req.flash("error")[0] || null,
    });
  } catch (err) {
    console.error("Gagal mengambil data edit:", err);
    req.flash("error", "Terjadi kesalahan saat mengambil data.");
    res.redirect("/dashboard");
  }
}

async function handleUpdateExperience(req, res) {
  try {
    const { pekerjaan, perusahaan, sdate, edate, present, techno } = req.body;
    const file = req.file;
    const id = req.params.id;

    const filteredTasksArray = [req.body.task1, req.body.task2, req.body.task3, req.body.task4, req.body.task5].filter((task) => task && task.trim() !== "");
    const job_responsibilities_string = filteredTasksArray.join("|||");

    const endDate = present === "on" ? "present" : edate;
    const imageUrl = file ? "/uploads/" + file.filename : req.body.old_image;

    await pool.query(
      `
      UPDATE experience SET 
        position = $1, 
        company = $2, 
        start_date = $3, 
        end_date = $4, 
        job_responsibilities = $5, 
        technologies = $6, 
        image = $7 
      WHERE id = $8
    `,
      [pekerjaan, perusahaan, sdate, endDate, job_responsibilities_string, techno, imageUrl, id]
    );

    req.flash("success", "✅ Experience berhasil diperbarui.");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Gagal memperbarui pengalaman:", err);
    req.flash("error", "Terjadi kesalahan saat memperbarui pengalaman.");
    res.redirect("/dashboard");
  }
}

async function handleProjects(req, res) {
  try {
    const { project_name, description, repo_link, live_demo, technologies } = req.body;
    const image = req.file;

    let image_url = null;
    if (image) {
      image_url = "/uploads/" + image.filename;
    }

    const submittedAt = new Date().toISOString();

    console.log("\n======= New Project Submission =======");
    console.log(`Project Name    : ${project_name}`);
    console.log(`Description     : ${description}`);
    console.log(`Repository      : ${repo_link}`);
    console.log(`Link Demo       : ${live_demo}`);
    console.log(`Technologies    : ${technologies}`);
    console.log(`Image           : ${image_url}`);
    console.log(`Submitted At    : ${new Date(submittedAt).toLocaleString()}`);
    console.log("======================================\n");
    console.log("req.file (dari Multer):", req.file);

    const queryText = `
            INSERT INTO myprojects (project_name, description, technologies, image, repo_link, live_demo)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
    const values = [project_name, description, technologies, image_url, repo_link, live_demo];

    await pool.query(queryText, values);
    console.log("✅ Data successfully inserted into database.");

    req.flash('success', '✅ Projects berhasil ditambahkan!');
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error inserting experience:", err);
    req.flash('error', 'Gagal menambahkan Projects.');
    res.redirect('/dashboard');
    res.status(500).send("Internal Server Error");
  }
}

async function getEditProjectForm(req, res) {
  const id = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM myprojects WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      req.flash("error", "Project tidak ditemukan");
      return res.redirect("/dashboard");
    }
    res.render("editMyProjects", {
      title: "Edit Project",
      project: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Terjadi kesalahan saat mengambil data project");
    res.redirect("/dashboard");
  }
}

async function handleUpdateProject(req, res) {
  const id = req.params.id;
  const { project_name, description, repo_link, live_demo, technologies } = req.body;
  const image = req.file;

  try {
    let query, values;

    if (image) {
      const image_url = "/uploads/" + image.filename;
      query = `UPDATE myprojects SET project_name=$1, description=$2, technologies=$3, image=$4, repo_link=$5, live_demo=$6 WHERE id=$7`;
      values = [project_name, description, technologies, image_url, repo_link, live_demo, id];
    } else {
      query = `UPDATE myprojects SET project_name=$1, description=$2, technologies=$3, repo_link=$4, live_demo=$5 WHERE id=$6`;
      values = [project_name, description, technologies, repo_link, live_demo, id];
    }

    await pool.query(query, values);
    req.flash("success", "Project berhasil diperbarui");
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Gagal memperbarui project");
    res.redirect("/dashboard");
  }
}

async function handleDeleteProject(req, res) {
  const id = req.params.id;
  try {
    await pool.query("DELETE FROM myprojects WHERE id = $1", [id]);
    req.flash("success", "Project berhasil dihapus");
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Gagal menghapus project");
    res.redirect("/dashboard");
  }
}

module.exports = {
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
};
