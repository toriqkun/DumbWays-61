function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    req.flash("error", "Anda harus login terlebih dahulu.");
    res.redirect("/login");
  }
}

module.exports = { isAuthenticated };
