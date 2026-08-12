const API_URL = 'http://localhost:3000/api/expenses';
let editExpenseId = null;

// Submit Handler (Create or Edit)
async function handleFormSubmit(event) {
  event.preventDefault();

  const expenseDetails = {
    amount: event.target.amount.value,
    description: event.target.description.value,
    category: event.target.category.value
  };

  try {
    if (editExpenseId) {
      // Edit Existing Expense
      const res = await axios.put(`${API_URL}/${editExpenseId}`, expenseDetails);
      const oldElement = document.getElementById(`expense-${editExpenseId}`);
      if (oldElement) oldElement.remove();

      showExpenseOnScreen(res.data.expense);
      editExpenseId = null;
    } else {
      // Add New Expense
      const res = await axios.post(API_URL, expenseDetails);
      showExpenseOnScreen(res.data.expense);
    }

    event.target.reset();
  } catch (error) {
    console.error('Error saving expense:', error);
  }
}

// Fetch Expenses on Refresh
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await axios.get(API_URL);
    res.data.expenses.forEach(expense => showExpenseOnScreen(expense));
  } catch (error) {
    console.error('Error fetching expenses:', error);
  }
});

// Delete Expense
async function deleteExpense(id, element) {
  try {
    await axios.delete(`${API_URL}/${id}`);
    element.remove();
  } catch (error) {
    console.error('Error deleting expense:', error);
  }
}

// Edit Expense Handler
function editExpenseDetails(expense) {
  document.getElementById('amount').value = expense.amount;
  document.getElementById('description').value = expense.description;
  document.getElementById('category').value = expense.category;

  editExpenseId = expense.id;
}

// Render Item in List
function showExpenseOnScreen(expense) {
  const parentElem = document.getElementById('expenseList');
  const childElem = document.createElement('li');
  childElem.id = `expense-${expense.id}`;

  const textNode = document.createTextNode(
    `${expense.amount} - ${expense.category} - ${expense.description} `
  );
  childElem.appendChild(textNode);

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit Expense';
  editBtn.className = 'btn-edit';
  editBtn.onclick = () => editExpenseDetails(expense);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete Expense';
  deleteBtn.className = 'btn-delete';
  deleteBtn.onclick = () => deleteExpense(expense.id, childElem);

  childElem.appendChild(editBtn);
  childElem.appendChild(deleteBtn);
  parentElem.appendChild(childElem);
}