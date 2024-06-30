pipeline {
    agent any

    parameters {
        string(name: 'VERSION', defaultValue: 'beta', description: 'Version tag for the Docker image')
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        IMAGE_NAME = "tilalx/verti-grade"
        DOCKER_BUILDKIT = 1
    }

    triggers {
        // GitHub hook trigger for GITScm polling
        githubPush()
    }

    options {
        timestamps() // Enable timestamps for each build step
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm: [$class: 'GitSCM', userRemoteConfigs: [[
                    url: 'https://github.com/tilalx/verti-grade.git',
                    credentialsId: 'github-tilalx'
                ]], branches: [[name: '*/main']]]
            }
        }

        stage('Build Docker Images for Each Architecture') {
            parallel {
                stage('Build Docker Image for AMD64') {
                    steps {
                        script {
                            def imageTag = "${env.IMAGE_NAME}:${params.VERSION}-amd64"
                            docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                                sh """
                                    export DOCKER_CLI_EXPERIMENTAL=enabled
                                    docker buildx create --use --name builder-amd64
                                    docker buildx build --platform linux/amd64 -t ${imageTag} . \
                                        --cache-from=type=registry,ref=${env.IMAGE_NAME}:cache-amd64 \
                                        --cache-to=type=registry,ref=${env.IMAGE_NAME}:cache-amd64,mode=max \
                                        --progress=plain \
                                        --push
                                    docker buildx rm builder-amd64
                                """
                            }
                        }
                    }
                }
                stage('Build Docker Image for ARM64') {
                    steps {
                        script {
                            def imageTag = "${env.IMAGE_NAME}:${params.VERSION}-arm64"
                            docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                                sh """
                                    export DOCKER_CLI_EXPERIMENTAL=enabled
                                    docker buildx create --use --name builder-arm64
                                    docker buildx build --platform linux/arm64 -t ${imageTag} . \
                                        --cache-from=type=registry,ref=${env.IMAGE_NAME}:cache-arm64 \
                                        --cache-to=type=registry,ref=${env.IMAGE_NAME}:cache-arm64,mode=max \
                                        --progress=plain \
                                        --push
                                    docker buildx rm builder-arm64
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Create and Push Multi-Arch Image') {
            steps {
                script {
                    def imageTag = "${env.IMAGE_NAME}:${params.VERSION}"
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        sh """
                            export DOCKER_CLI_EXPERIMENTAL=enabled
                            docker buildx imagetools create -t ${imageTag} \
                                ${env.IMAGE_NAME}:${params.VERSION}-amd64 \
                                ${env.IMAGE_NAME}:${params.VERSION}-arm64
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Remove unused Docker images, containers, networks, etc.
                sh 'docker system prune -af'
                // Optionally remove dangling volumes
                sh 'docker volume prune -f'
            }
            cleanWs()
        }
        success {
            echo 'Build and Push Successful!'
        }
        failure {
            echo 'Build or Push Failed.'
        }
    }
}
