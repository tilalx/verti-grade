# Verti-Grade

A climbing route management system for gyms and outdoor venues.

- [Setup Docker Compose](#setup-docker-compose)
- [Getting Started](#getting-started)
- [Custom TLS Certificate](#custom-tls-certificate)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Setup Docker Compose

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Download Docker Compose File

```sh
wget https://raw.githubusercontent.com/tilalx/verti-grade/main/docker-compose.yml
```

### Docker Compose Configuration

```yaml
services:
  verti-grade:
    container_name: verti-grade-app
    image: tilalx/verti-grade:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      # Default superuser created on first boot. Change before deploying!
      PB_SUPERUSER_EMAIL: admin@example.com
      PB_SUPERUSER_PASSWORD: changeme123
    volumes:
      - ./pb_data:/pb/pb_data
```

### Running the Project

```sh
docker-compose up -d
```

## Getting Started

After `docker-compose up -d` completes, follow these steps to get the application ready.

### 1. Open the Application

Navigate to **`https://localhost`** in your browser.

> The default setup uses a self-signed TLS certificate. Your browser will show a security warning — click "Advanced" → "Proceed" to continue. See [Custom TLS Certificate](#custom-tls-certificate) to use a real certificate.

### 2. Log In as Superuser

The superuser account is created automatically on first boot using the credentials set in `docker-compose.yml`:

| Field    | Default value         |
|----------|-----------------------|
| Email    | `admin@example.com`   |
| Password | `changeme123`         |

**Change these before deploying to production.**

The superuser account is used to access the PocketBase admin panel at `https://localhost/_/` — it is separate from regular user accounts.

### 3. Create Your First User Account

Regular user accounts must be created via the PocketBase admin panel:

1. Open `https://localhost/_/` and log in with the superuser credentials
2. Navigate to **Collections → users → New record**
3. Fill in the email, password, and any other required fields
4. Set **verified** to `true` so the user can log in immediately
5. Save the record

After that the user can log in at `https://localhost/auth/login`.

### 4. Configure Application Settings

Go to **Admin → Settings** in the Verti-Grade UI to configure:

- Organisation name and logo
- Privacy policy / imprint URL
- Sign image for route cards

### 5. Start Adding Routes

Once logged in as a regular user, use the dashboard to add and manage climbing routes.

---

## Custom TLS Certificate

By default, a self-signed certificate is generated automatically at startup. To use your own certificate (e.g. from Let's Encrypt), mount it into the container:

```yaml
volumes:
  - ./pb_data:/pb/pb_data
  - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem:ro
  - ./ssl/key.pem:/etc/nginx/ssl/key.pem:ro
```

---

## Stopping the Service

```sh
docker-compose down
```

Data is persisted in `./pb_data` and survives restarts.

## Usage

Verti-Grade is designed to be simple and straightforward. Once set up, manage and evaluate climbing routes through the web interface. For detailed usage instructions refer to the [documentation](https://github.com/tilalx/verti-grade/wiki).

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

Verti-Grade is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.