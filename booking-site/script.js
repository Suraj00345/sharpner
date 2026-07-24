const form = document.getElementById("bookingForm");
const bookingList = document.getElementById("bookingList");
const filterBus = document.getElementById("filterBus");

let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let editId = null;

// Display bookings on page load
displayBookings(bookings);

// Form Submit
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const booking = {
    id: editId || Date.now(),
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    bus: document.getElementById("bus").value,
  };

  if (editId) {
    // Update booking
    bookings = bookings.map((item) =>
      item.id === editId ? booking : item
    );
    editId = null;
  } else {
    // Add new booking
    bookings.push(booking);
  }

  localStorage.setItem("bookings", JSON.stringify(bookings));

  displayBookings(bookings);

  form.reset();
});

// Display Bookings
function displayBookings(data) {
  bookingList.innerHTML = "";

  data.forEach((booking) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${booking.name}</td>
      <td>${booking.email}</td>
      <td>${booking.phone}</td>
      <td>${booking.bus}</td>
      <td>
        <button onclick="editBooking(${booking.id})">Edit</button>
        <button class="delete" onclick="deleteBooking(${booking.id})">Delete</button>
      </td>
    `;

    bookingList.appendChild(tr);
  });
}

// Delete Booking
function deleteBooking(id) {
  bookings = bookings.filter((booking) => booking.id !== id);

  localStorage.setItem("bookings", JSON.stringify(bookings));

  displayBookings(bookings);
}

// Edit Booking
function editBooking(id) {
  const booking = bookings.find((item) => item.id === id);

  if (!booking) return;

  document.getElementById("name").value = booking.name;
  document.getElementById("email").value = booking.email;
  document.getElementById("phone").value = booking.phone;
  document.getElementById("bus").value = booking.bus;

  editId = id;
}

// Filter Booking
filterBus.addEventListener("change", function () {
  if (this.value === "All") {
    displayBookings(bookings);
  } else {
    const filtered = bookings.filter(
      (booking) => booking.bus === this.value
    );

    displayBookings(filtered);
  }
});