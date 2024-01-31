param (
    [Parameter(Mandatory=$true)]
    [string]$version
)

# Name of the image
$imageName = "tilalx/verti-grade"

# Full image tag with version
$imageTag = "${imageName}:$version"

# Create and start the builder
docker buildx create --name multiarchbuild --use
docker buildx inspect multiarchbuild --bootstrap

# Build the image for multiple platforms
docker buildx build --platform linux/amd64 -t $imageTag . --push
docker buildx build --platform linux/arm/v7,linux/arm64/v8 -t $imageTag . --push