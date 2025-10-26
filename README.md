# Kelp Coding Challenge: CSV to JSON API

This project is a Node.js (Express) application built for the Kelp coding challenge. It provides an API endpoint that reads a CSV file, parses it, uploads the data to a Postgres database, and generates an age distribution report.

---

## 🚀 How to Run

1.  **Prerequisites:**
    * [Node.js](https://nodejs.org/) (v18 or later recommended)
    * [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)

2.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Tanay1256/kelp-coding-challenge.git](https://github.com/Tanay1256/kelp-coding-challenge.git)
    cd kelp-coding-challenge
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Create `.env` File:**
    Create a `.env` file in the root of the project and copy the contents of `.env.example` (or just add the variables below).

5.  **Start the Database:**
    This command will start the Postgres database in the background.
    ```bash
    docker compose up -d
    ```

6.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will be running on `http://localhost:3000`.

7.  **Trigger the Upload:**
    Open a new terminal and run the following command to trigger the CSV processing and report generation:
    ```powershell
    # PowerShell
    curl -Method POST -Uri http://localhost:3000/upload
    
    # Bash/curl (if you have it)
    # curl -X POST http://localhost:3000/upload
    ```

---

## 📋 API Endpoint

* **URL:** `/upload`
* **Method:** `POST`
* **Description:** Triggers the application to read the CSV file, process the data, upload it to the database, and print the age distribution report to the server's console.

---

## ⚙️ Environment Variables

The application requires the following environment variables to be set in a `.env` file:

```
# Database Connection
DB_USER=user
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kelp_db

# File Path
CSV_FILE_PATH=./data/users.csv
```
*(Note: `DB_PASSWORD` and `DB_USER` must match the `POSTGRES_` variables in `docker-compose.yml`.)*

---

## ✅ Assumptions Made

Here are the assumptions I made:

1.  **Simple CSV:** The CSV file is "simple," meaning values do not contain commas. This allows for a high-performance `line.split(',')` parser.
2.  **Clean Report:** The `users` table is truncated before each upload to generate a "clean" report based only on the current file.
3.  **Error Handling:** Malformed CSV lines (with a different number of columns than the header) are skipped with a console warning rather than stopping the entire upload.

---

## 🖥️ Final Report Output

Here is a screenshot of the console output after running the `/upload` endpoint with the sample data:

**(Here, paste a screenshot of your terminal showing the report)**
<img width="648" height="297" alt="image" src="https://github.com/user-attachments/assets/e4379431-8ae9-431e-9490-7bd3cafc080c" />

![Age Distribution Report](https://github.com/Tanay1256/kelp-coding-challenge/blob/main/kelp-challenge/report.png should include the complete path)
