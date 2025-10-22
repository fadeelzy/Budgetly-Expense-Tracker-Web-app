🪙 Budgetly – Split Expenses, Stay Friends
Track shared expenses easily, settle up with friends, and never argue about who owes who again.

🌟 Overview

Budgetly is a full-stack Django web app designed to simplify group expense management. Whether it’s a weekend trip, roommates sharing rent, or a group project, Budgetly helps you log, track, and split expenses fairly.

Built with:

🐍 Django 5 for backend logic

🍃 MongoDB Atlas for a modern, flexible, cloud-based NoSQL database

🎨 Tailwind-inspired custom CSS for elegant, responsive UI

⚙️ Pipenv for isolated environment & dependency management

🚀 Key Features

✅ Add & Split Expenses – Seamlessly add shared expenses and assign participants

✅ Smart Summary View – Instantly see who owes and who’s owed

✅ Balance Settlement – Auto-generate clear settlement breakdowns

✅ Modern, Minimal UI – Warm, professional palette built with CSS variables

✅ Persistent Storage with MongoDB – Cloud-hosted, scalable data backend

✅ Environment-safe Configuration – Secure .env file integration

🧠 Tech Stack

Layer	Technology

Backend	Django 5

Database	MongoDB Atlas

Frontend	HTML5, CSS3 (custom Tailwind-like utility classes)

Environment	Pipenv

Server	Django’s built-in dev server

Version Control	Git & GitHub


⚙️ Setup Instructions

1️⃣ Clone the Repository
git clone https://github.com/yourusername/budgetly.git
cd budgetly

2️⃣ Install Dependencies (with Pipenv)
pipenv install
pipenv shell

3️⃣ Configure MongoDB Atlas

Create a .env file in your project root and add your MongoDB credentials:

MONGODB_DB=expense-cluster
MONGODB_USER=your_user
MONGODB_PASS=your_password
MONGODB_HOST=your_cluster.mongodb.net

4️⃣ Apply Migrations (if needed)
python manage.py makemigrations
python manage.py migrate

5️⃣ Run the Server
python manage.py runserver


Then visit:
👉 http://127.0.0.1:8000/

📁 Project Structure

budgetly/

├── myapp/

│   ├── models.py

│   ├── views.py

│   ├── urls.py

│   ├── templates/

│   │   ├── dashboard.html

│   │   ├── add_expense.html

│   │   └── summary.html

│   └── static/

│       └── css/

│           └── style.css

├── expenseproject/

│   ├── settings.py

│   ├── urls.py

│   └── wsgi.py

├── .env

├── Pipfile

├── Pipfile.lock

└── README.md


💡 Core Logic Overview

Expense Model: Stores amount, payer, and participants

Summary View: Computes who owes who using balance mapping

Settlement Algorithm: Ensures minimum transaction settlement

Templates: Clean, semantic HTML with reusable layout


🤝 Contributing

Pull requests are welcome!

Fork the repo

Create your feature branch (git checkout -b feature/new-feature)

Commit your changes (git commit -m 'Add new feature')

Push to the branch (git push origin feature/new-feature)

Open a Pull Request 🚀

🧑‍💻 Author

Fadilah Abdulkadir

💼 Site Reliability Engineer | AWS Cloud Solutions Architect | Backend Developer | Python and Django


🪶 License

This project is licensed under the MIT License — feel free to use, modify, and share.
