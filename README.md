# Verti-Grade

- [Setup Docker Compose](#setup-docker-compose)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Setup Docker Compose

### Prerequisites

Before setting up Verti-Grade, ensure you have the following installed on your system:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Download Docker Compose File

Download the `docker-compose.yml` file from the Verti-Grade GitHub repository:

```sh
wget https://github.com/tilalx/verti-grade/blob/main/docker-compose.yml
```

### Docker Compose Configuration

The `docker-compose.yml` file provided below configures the Verti-Grade service.

```yaml
services:
  verti-grade:
    container_name: verti-grade-app
    image: tilalx/verti-grade:latest
    ports:
      - "80:80"
#    environment:
#       SERVER_URL=http://example.com
    volumes:
      - ./pb:/pb
```

### Running the Project

1. **Download Docker Compose File:**
   Ensure you have downloaded the `docker-compose.yml` file as shown above.

2. **Start Docker Compose:**
   Navigate to the directory containing the `docker-compose.yml` file and run the following command to start the Verti-Grade service:

   ```sh
   docker-compose up -d
   ```

3. **Access Verti-Grade:**
   Once the service is running, you can access Verti-Grade through your web browser at `http://localhost`.

### Additional Configuration

If you need to set the `SERVER_URL` environment variable, uncomment the relevant line in the `docker-compose.yml` file and set the URL appropriately.

### Stopping the Service

To stop the Verti-Grade service, run:

```sh
docker-compose down
```

## Usage

Verti-Grade is designed to be simple and straightforward to use. Once set up, you can start managing and evaluating grades through the web interface. For detailed usage instructions and examples, refer to the [documentation](https://github.com/tilalx/verti-grade/wiki).

## Contributing

We welcome contributions from the community! If you'd like to contribute to Verti-Grade, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

Verti-Grade is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

For more information and detailed documentation, visit the [Verti-Grade GitHub repository](https://github.com/tilalx/verti-grade). If you have any questions or need further assistance, feel free to open an issue or contact the maintainers.

---

Thank you for using Verti-Grade! Your feedback and contributions are greatly appreciated.