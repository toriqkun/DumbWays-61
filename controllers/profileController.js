const { pool } = require("../postgres");

async function getProfile(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/login");
    }
    const result = await pool.query("SELECT * FROM public.accounts WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).send("User tidak ditemukan");
    }
    res.render("profile", {
      user: result.rows[0],
      title: "Profile Saya",
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { fullName } = req.body;
    const profileImage = req.file ? req.file.filename : null;

    let query = `UPDATE public.accounts SET full_name = $1`;
    const params = [fullName];

    if (profileImage) {
      query += `, profile_image = $2 WHERE id = $3`;
      params.push(profileImage, userId);
    } else {
      query += ` WHERE id = $2`;
      params.push(userId);
    }

    const { rowCount } = await pool.query(query, params);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({ success: true, message: "Profil berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
