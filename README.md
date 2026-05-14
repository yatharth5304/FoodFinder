# 🍽 FoodFinder — Restaurant Recommendation Platform

A full-stack restaurant discovery platform built with **Java 17**, **Spring Boot 3.2**, and **Supabase PostgreSQL**. Search by cuisine, dish, or location — with geolocation-based distance sorting powered by the Haversine formula.

**Live Demo:** [foodfinder on Render](https://foodfinder-xxxx.onrender.com) *(update after deployment)*

---

## ✨ Features

- 🔍 **Smart Search** — Search by cuisine type, dish name, or location
- 📍 **Geolocation Sorting** — Find restaurants nearest to you using browser geolocation
- ⭐ **Multi-Sort** — Sort by highest rated, cheapest, nearest, or best match
- 📱 **Responsive Design** — Premium UI optimized for mobile, tablet, and desktop
- 🎨 **Modern Aesthetics** — Glassmorphism panels, micro-animations, and dynamic hero banners
- ⚡ **Fast API** — Paginated search with indexed database queries
- 🩺 **Health Monitoring** — Spring Actuator for production health checks

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.2, Spring Data JPA, Hibernate |
| **Database** | PostgreSQL (Supabase) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Deployment** | Docker, Render |
| **Build** | Maven |

---

## 📁 Project Structure

```
foodfinder/
├── backend/
│   ├── src/main/java/com/foodfinder/
│   │   ├── FoodFinderApplication.java
│   │   ├── controller/RestaurantController.java
│   │   ├── service/RestaurantService.java
│   │   ├── repository/RestaurantRepository.java
│   │   ├── entity/Restaurant.java
│   │   ├── dto/           # RestaurantDTO, SearchRequestDTO, ApiResponse
│   │   ├── utility/       # HaversineUtil, RestaurantMapper
│   │   ├── exception/     # GlobalExceptionHandler
│   │   └── config/WebConfig.java
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── static/        # Frontend (HTML, CSS, JS)
│   ├── Dockerfile
│   └── pom.xml
├── build.sh
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+
- A [Supabase](https://supabase.com) project with PostgreSQL

### 1. Clone the Repository
```bash
git clone https://github.com/yatharth5304/foodfinder.git
cd foodfinder
```

### 2. Set Environment Variables
```bash
export DATABASE_URL=jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?sslmode=require
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=your-supabase-password
```

### 3. Run Locally
```bash
cd backend
mvn spring-boot:run
```

Open: **http://localhost:8080**

---

## 🌐 Deploy on Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Render Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New → Web Service → Connect GitHub Repo**
3. Set **Root Directory**: `backend`
4. Render auto-detects the `Dockerfile`

### Step 3: Add Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?sslmode=require` |
| `DATABASE_USERNAME` | `postgres` |
| `DATABASE_PASSWORD` | `your-supabase-password` |

> Render automatically sets `PORT`. Spring Boot reads it via `${PORT:8080}`.

### Step 4: Deploy
Click **Deploy** — your app will be live at `https://your-app.onrender.com` 🎉

---

## 📡 API Reference

### Search Restaurants
```
GET /api/restaurants/search?cuisine=Indian&dish=Biryani&sortBy=rated&page=0&size=20
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `cuisine` | string | Filter by cuisine (e.g., "Italian", "Indian") |
| `dish` | string | Filter by dish or menu item |
| `location` | string | Filter by city, locality, or address |
| `userLat` | double | User latitude (for nearest sorting) |
| `userLon` | double | User longitude (for nearest sorting) |
| `sortBy` | string | `rated` · `cheapest` · `nearest` · `best` |
| `page` | int | Page number (default: 0) |
| `size` | int | Results per page (default: 20, max: 100) |

### Get Restaurant by ID
```
GET /api/restaurants/{id}
```

### Health Check
```
GET /actuator/health
```

---

## 🛠 Troubleshooting

| Issue | Solution |
|-------|---------|
| **Connection refused to Supabase** | Use direct connection (port `5432`), not pooler. Ensure `?sslmode=require` in URL. |
| **App won't start on Render** | Check Render logs. Ensure all 3 env vars are set. |
| **Out of memory (free tier)** | Dockerfile already sets `-XX:MaxRAMPercentage=75.0`. Reduce `HIKARI_MAX_POOL` to `3`. |
| **Nearest sort not working** | Browser must grant geolocation permission. HTTPS required (Render provides this). |

---

## 👨‍💻 Author

**Yatharth Maharwade**

- 📧 [yatharth0503@hotmail.com](mailto:yatharth0503@hotmail.com)
- 💼 [LinkedIn](https://www.linkedin.com/in/yatharthmaharwade/)
- 📸 [Instagram](https://www.instagram.com/yatharth__maharwade/)
- 💻 [GitHub](https://github.com/yatharth5304)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Restaurant data sourced from [Kaggle Open Datasets](https://www.kaggle.com/).
