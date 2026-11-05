# Telangana Tourism Blog System

A full-stack web application developed to promote tourism destinations across Telangana through an interactive tourism blogging platform.

The project also demonstrates DevOps practices including Git, GitHub, Jenkins, GitHub Actions, Docker, Docker Compose, and Selenium automation testing.

## 1. Project Overview

The Telangana Tourism Blog System allows users to explore tourist destinations, share travel experiences, and publish tourism blogs.

The application provides an admin dashboard for managing tourism content and uses MySQL for database management.

## 2. Objectives

- Promote Telangana tourism through a digital platform.
- Allow users to create and explore tourism blogs.
- Provide user authentication and admin management.
- Implement database connectivity using MySQL.
- Apply DevOps tools for automation, testing, and containerization.

## 3. Key Features

### User Module
- User registration and login.
- Create and view tourism blogs.
- Upload tourist destination images.
- Search and filter tourism destinations.
- Like and comment on blogs.
- User profile management.

### Admin Module
- Separate admin login.
- Protected admin dashboard.
- Manage tourism blogs.
- Manage users and tourism content.

## 4. Technologies Used

| Category | Technologies |
|---|---|
| Frontend | HTML, CSS, Bootstrap, JavaScript, EJS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Testing | Jest, Supertest, Selenium |
| CI/CD | Jenkins, GitHub Actions |
| Containerization | Docker, Docker Compose |
| Programming Languages | JavaScript, Java |

## 5. Project Structure

```text
telangana-tourism/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── config/
├── middleware/
├── public/
├── tests/
├── views/
│
├── selenium-java/
│   ├── lib/
│   └── src/
│       └── HomePageTest.java
│
├── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
├── .dockerignore
├── .gitignore
├── .env.example
├── app.js
├── migrate.js
├── package.json
├── package-lock.json
└── README.md
```

## 6. Installation and Execution

### Prerequisites

- Node.js 24
- MySQL 8
- Git
- Visual Studio Code

### Step 1: Clone the Repository

```bash
git clone https://github.com/puppalisiri/devops_project.git
cd devops_project
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root.

Configure the following variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=telangana_tourism
DB_PORT=3306
```

Replace the password with your actual MySQL password.

### Step 4: Create the Database

Open MySQL and execute:

```sql
CREATE DATABASE telangana_tourism;
```

### Step 5: Start the Application

```bash
npm start
```

### Step 6: Open the Website

```text
http://localhost:3000
```

## 7. Database Migration

The project contains a migration script to update the database structure and create the likes and comments tables.

```bash
node migrate.js
```

## 8. Testing Using Jest and Supertest

Jest and Supertest are used for automated application testing.

Execute:

```bash
npm test
```

The tests verify application routes and responses.

## 9. Jenkins CI Pipeline

Jenkins is used to automate the project build and testing process.

The pipeline is configured in the `Jenkinsfile`.

### Pipeline Stages

1. **Checkout:** Retrieves the project source code from GitHub.
2. **Install Dependencies:** Installs Node.js dependencies.
3. **Build:** Executes the build stage.
4. **Test:** Runs automated tests using Jest.

The pipeline can be executed through the Jenkins dashboard.

## 10. GitHub Actions CI Pipeline

GitHub Actions automates testing whenever code is pushed to the `main` branch or a pull request is created.

Configuration file:

```text
.github/workflows/ci-cd.yml
```

### Workflow Steps

1. Checkout Repository.
2. Setup Node.js 24.
3. Install Dependencies using `npm ci`.
4. Run Tests using `npm test`.

The workflow execution results can be viewed in the Actions tab of GitHub.

## 11. Docker Containerization

Docker is used to package the application and its dependencies into a container.

### Dockerfile

The Dockerfile:

- Uses Node.js 24 as the base image.
- Sets `/app` as the working directory.
- Copies package files.
- Installs dependencies using `npm ci`.
- Copies application files.
- Exposes port 3000.
- Starts the application using `npm start`.

### Build Docker Image

```bash
docker build -t telangana-tourism-app .
```

### Run Docker Container

```bash
docker run -p 3000:3000 telangana-tourism-app
```

The application requires a reachable MySQL database and suitable environment variables when running independently.

## 12. Docker Compose

Docker Compose is used to run the Node.js application and MySQL database together.

The configuration is available in:

```text
docker-compose.yml
```

### Configure Environment Variables

Create a `.env` file containing:

```env
DB_PASSWORD=your_database_password
MYSQL_ROOT_PASSWORD=your_root_password
```

### Build and Start Containers

```bash
docker compose up --build -d
```

### Check Running Containers

```bash
docker compose ps
```

### View Container Logs

```bash
docker compose logs
```

### Stop Containers

```bash
docker compose down
```

Docker Compose manages the application container, MySQL container, persistent database storage, and application startup dependency.

The application is available at:

```text
http://localhost:3000
```

MySQL is exposed on host port `3307`.

## 13. Selenium Automation Testing

Selenium WebDriver with Java is used to automate browser testing.

The test program is located at:

```text
selenium-java/src/HomePageTest.java
```

### Compile the Java Program (Windows)

```powershell
cd selenium-java
javac -cp ".;lib/*" -d out src\HomePageTest.java
```

### Execute the Selenium Test

```powershell
java -cp "out;lib/*" HomePageTest
```

Make sure the website is running at `http://localhost:3000` and Google Chrome is installed.

The Selenium program opens the website, maximizes the browser window, retrieves the page title, and displays a success message.

## 14. Git and GitHub Commands

Check project status:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit changes:

```bash
git commit -m "Update DevOps project and documentation"
```

Push changes:

```bash
git push origin main
```

## 15. Conclusion

The Telangana Tourism Blog System demonstrates full-stack web application development along with practical DevOps implementation.

The project integrates Git and GitHub for version control, Jenkins and GitHub Actions for automated testing workflows, Docker and Docker Compose for containerization, and Selenium for browser automation testing.

These technologies help demonstrate an integrated development and testing workflow for a web application.

## 16. Repository

GitHub Repository:

https://github.com/puppalisiri/devops_project
