// ini navbar dropdown

const toggleBtn = document.querySelector(".toggle_btn");
const toggleBtnIcon = document.querySelector(".toggle_btn i");
const dropDownMenu = document.querySelector(".dropdown_menu");

toggleBtn.onclick = function () {
  dropDownMenu.classList.toggle("open");
};

// ini contact form

function submitData(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phoneNumber = document.getElementById("phoneNumber").value;
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value;

  // alert(`${name}\n${email}\n${phoneNumber}\n${subject}\n${message}`)

  if (name == "") {
    return alert("name harus diisi");
  } else if (email == "") {
    return alert("email harus diisi");
  } else if (phoneNumber == "") {
    return alert("phone number harus diisi");
  } else if (subject == "") {
    return alert("subject harus diisi");
  } else if (message == "") {
    return alert("message harus diisi");
  }

  console.log("Nama: " + name);
  console.log("Email: " + email);
  console.log("Nomor: " + phoneNumber);
  console.log("Subject: " + subject);
  console.log("Message: " + message);

  // programtically link
  let a = document.createElement("a");

  a.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(message)}`;

  a.click();
}

function summary(a, b, c) {
  return a + b * c;
}

let result = summary(1, 5, 10);
let summaryResult = result + 2;
console.log("Sekarang tanggal " + result);
console.log("Sekarang ini tanggal " + summaryResult);

// const number = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// // for
// const even = [];
// for (let i = 0; i < number.length; i++) {
//   if (number[i] % 2 === 1) {
//     even.push(number[i]);
//   }
// }

// console.log(number);
// console.log(even);

// const evenNumber = number.filter(function (num) {
//   return num % 2 === 0
// })

// console.log(evenNumber);

// reduce

// const array1 = [1, 2, 3, 4];

// // 0 + 1 + 2 + 3 + 4
// const initialValue = 0;
// const sumWithInitial = array1.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);

// console.log(sumWithInitial);
// // Expected output: 10
