const postgres = require("../postgres");

async function handleContact(req, res) {
  const { name, email, phone, subject, message } = req.body;
  // Alert Isi semua Form
  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  //Validasi email
  if (!email.includes("@")) return res.status(400).json({ success: false, message: "Invalid email address." });

  const contactData = {
    name,
    email,
    phone,
    subject,
    message,
    submittedAt: new Date().toISOString(),
  };

  console.log("\n=== New Contact Submission ===");
  console.log(`Name    : ${name}`);
  console.log(`Email   : ${email}`);
  console.log(`Phone   : ${phone}`);
  console.log(`Subject : ${subject}`);
  console.log(`Message : ${message}`);
  console.log(`Time    : ${new Date(contactData.submittedAt).toLocaleString()}`);
  console.log("================================\n");
  // Insert into Database
  const query = `
    INSERT INTO public.contact(nama, email, phone_number, subject, massage)
    VALUES ($1, $2, $3, $4, $5);
  `;
  // Values Database
  const values = [name, email, phone, subject, message];

  try {
    await postgres.query(query, values);
    res.status(200).json({ success: true, message: "Contact submitted successfully." });
  } catch (error) {
    console.error("Error inserting contact:", error);
    res.status(500).json({ success: false, message: "Failed to submit contact." });
  }
}

module.exports = { handleContact };