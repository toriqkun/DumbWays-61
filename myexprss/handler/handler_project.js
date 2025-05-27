const moment = require("moment");
const pool = require("../postgres");
const fs = require("fs");
const path = require("path");

async function handleUpdateProject(req, res) {
  try {
    const { id } = req.params;
    const { projectName, sdate, edate, desc } = req.body;

    const start = new Date(sdate);
    const end = new Date(edate);

    // Gabungkan teknologi ke dalam satu string
    const selectedTechs = [];
    if (req.body.node) selectedTechs.push("Node JS");
    if (req.body.react) selectedTechs.push("React JS");
    if (req.body.next) selectedTechs.push("Next JS");
    if (req.body.typescript) selectedTechs.push("TypeScript");

    const techString = selectedTechs.join(", ");

    // Log input data
    console.log("🔧 Update Project ID:", id);
    console.log("📦 Data:", { projectName, sdate, edate, desc, techString });

    // Ambil data lama dari database
    const oldData = await pool.query("SELECT image FROM public.project WHERE id = $1", [id]);
    if (oldData.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Project not found." });
    }

    let oldImageUrl = oldData.rows[0].image;
    let imageUrl = oldImageUrl;

    // Jika ada gambar baru, hapus gambar lama
    if (req.file && req.file.filename) {
      imageUrl = "/uploads/" + req.file.originalname;

      if (oldImageUrl) {
        const oldImagePath = path.join(__dirname, "..", oldImageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // hapus file lama
          console.log("🧹 Gambar lama dihapus:", oldImageUrl);
        }
      }
    }

    // Bangun query dinamis
    let query = `
      UPDATE public.project SET
        project_name = $1,
        description = $2,
        start_date = $3,
        end_date = $4,
        technologies = $5,
        image = $6
      WHERE id = $7
      RETURNING id
      `;

    const values = [projectName, desc, start, end, techString, imageUrl, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      console.warn("⚠️ Project dengan ID", id, "tidak ditemukan.");
      return res.status(404).json({ status: "error", message: "Project not found." });
    }

    res.status(200).json({ status: "success", message: "Project updated successfully.", id });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(500).json({ status: "error", message: "Failed to update project." });
  }
}

async function handleProject(req, res) {
  try {
    const { projectName, sdate, edate, desc, node, react, next, typescript } = req.body;

    const technologies = [node, react, next, typescript].filter(Boolean).join(", ");
    const submittedAt = new Date().toISOString();
    const image = req.file ? req.file.originalname : "";
    const imageUrl = req.file ? "/uploads/" + req.file.originalname : "";

    if (!projectName || !sdate || !edate || !desc || !image) {
      return res.status(400).json({ status: "error", message: "Please fill all required fields and upload an image." });
    }

    console.log("\n======= New Project Submission =======");
    console.log(`Name         : ${projectName}`);
    console.log(`Start Date   : ${sdate}`);
    console.log(`End Date     : ${edate}`);
    console.log(`Technologies : ${technologies}`);
    console.log(`Submitted At : ${new Date(submittedAt).toLocaleString()}`);
    console.log("======================================\n");

    const query = `
      INSERT INTO public.project (project_name, start_date, end_date, description, technologies, image)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;
    const values = [projectName, sdate, edate, desc, technologies, imageUrl];

    const result = await pool.query(query, values);
    const insertedId = result.rows[0].id;

    // ✅ Log success di terminal
    console.log(`✅ Project berhasil disimpan ke database! ID: ${insertedId}`);

    res.status(200).json({ status: "success", message: "Project submitted successfully!", id: insertedId });
  } catch (err) {
    console.error("❌ Error saat submit:", err);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengirim project!" });
  }
}

async function handleDeleteProject(req, res) {
  try {
    const { id } = req.params;
    console.log("🧾 Deleting ID:", id); // cek ID-nya

    // Ambil data project untuk dapatkan path gambar
    const project = await pool.query("SELECT image FROM public.project WHERE id = $1", [id]);
    if (project.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Project not found." });
    }

    const imageUrl = project.rows[0].image;
    if (imageUrl) {
      const imagePath = path.join(__dirname, "..", imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("🧹 Gambar berhasil dihapus:", imageUrl);
      } else {
        console.warn("⚠️ Gambar tidak ditemukan:", imageUrl);
      }
    }

    // Hapus data dari database
    await pool.query("DELETE FROM public.project WHERE id = $1", [id]);

    res.status(200).json({ status: "success", message: "Project deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting project:", error.stack);
    res.status(500).json({ status: "error", message: "Failed to delete project." });
  }
}

async function handleDetailProject(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    const project = result.rows[0];

    if (!project) {
      return res.status(404).send("Project not found");
    }

    // Hitung durasi dalam bulan
    const durationInMonths = moment(project.end_date).diff(moment(project.start_date), "months", true);
    project.duration = Math.ceil(durationInMonths); // Bisa pakai Math.floor atau Math.round juga

    res.render("project-detail", { project });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

module.exports = { handleProject, handleDeleteProject, handleUpdateProject, handleDetailProject };
