const API_URL = 'http://localhost:3000/api/users';

// Track whether we are editing an existing user
let editUserId = null;

// Save or Update User (Submit Form)
async function handleFormSubmit(event) {
  event.preventDefault();

  const userDetails = {
    name: event.target.username.value,
    email: event.target.email.value,
    phone: event.target.phone.value
  };

  try {
    if (editUserId) {
      // 1. UPDATE existing user (PUT request)
      const response = await axios.put(`${API_URL}/${editUserId}`, userDetails);
      
      // Remove old element from DOM if tracking reference exists
      const oldElement = document.getElementById(`user-${editUserId}`);
      if (oldElement) oldElement.remove();

      showUserOnScreen(response.data.user);
      editUserId = null; // Reset edit state
    } else {
      // 2. CREATE new user (POST request)
      const response = await axios.post(API_URL, userDetails);
      showUserOnScreen(response.data.user);
    }

    event.target.reset();
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

// Fetch All Users on Page Load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await axios.get(API_URL);
    response.data.users.forEach(user => showUserOnScreen(user));
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});

// Delete User
async function deleteUser(userId, element) {
  try {
    await axios.delete(`${API_URL}/${userId}`);
    element.remove();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// Populate form for Editing
function editUserDetails(user) {
  document.getElementById('username').value = user.name;
  document.getElementById('email').value = user.email;
  document.getElementById('phone').value = user.phone;
  
  // Save ID of the user being edited
  editUserId = user.id;
}

// Render User in UI
function showUserOnScreen(user) {
  const parentElem = document.getElementById('listOfItems');
  const childElem = document.createElement('li');
  childElem.id = `user-${user.id}`; // Add ID for easy tracking during edits
  
  // Text node for user info
  const textNode = document.createTextNode(`${user.name} - ${user.email} - ${user.phone} `);
  childElem.appendChild(textNode);

  // Edit Button
  const editButton = document.createElement('input');
  editButton.type = 'button';
  editButton.value = 'Edit';
  editButton.className = 'btn-edit';
  editButton.style.marginRight = '8px';
  editButton.onclick = () => editUserDetails(user);

  // Delete Button
  const deleteButton = document.createElement('input');
  deleteButton.type = 'button';
  deleteButton.value = 'Delete';
  deleteButton.className = 'btn-delete';
  deleteButton.onclick = () => deleteUser(user.id, childElem);

  childElem.appendChild(editButton);
  childElem.appendChild(deleteButton);
  parentElem.appendChild(childElem);
}