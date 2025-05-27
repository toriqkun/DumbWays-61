document.getElementById("contact-form").addEventListener("submit", async function (e) {
  e.preventDefault(); // Stop default form submission

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  if (!data.name || !data.email || !data.phone || !data.subject || !data.message) {
    alert("⚠️ Semua field harus diisi!");
    return;
  }

  try {
    const response = await fetch("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ " + result.message);
      this.reset(); // Clear form
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error(error);
    alert("⚠️ An error occurred while submitting the form.");
  }
});
