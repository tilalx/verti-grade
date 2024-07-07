pipeline {
    agent any

    parameters {
        string(name: 'VERSION', defaultValue: 'beta', description: 'Version tag for the Docker image')
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        IMAGE_NAME = "tilalx/verti-grade"
        DOCKER_BUILDKIT = 1
        PIPELINE_NAME = "${JOB_NAME.replaceAll('/', '_')}-${BUILD_NUMBER}"
    }

    triggers {
        githubPush() // GitHub hook trigger for GITScm polling
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
                        buildDockerImage('amd64')
                    }
                }
                stage('Build Docker Image for ARM64') {
                    steps {
                        buildDockerImage('arm64')
                    }
                }
            }
        }

        stage('Create and Push Multi-Arch Image') {
            steps {
                script {
                    createAndPushMultiArchImage()
                }
            }
        }
    }

    post {
        always {
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

def buildDockerImage(arch) {
    script {
        def imageTag = "${env.IMAGE_NAME}:${params.VERSION}-${arch}"
        if (env.CHANGE_ID) {
            imageTag = "${env.IMAGE_NAME}:pr-${env.CHANGE_ID}-${arch}"
        }
        def builderName = "builder-${arch}-${env.PIPELINE_NAME}"
        docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
            sh """
                export DOCKER_CLI_EXPERIMENTAL=enabled
                docker buildx create --use --name ${builderName}
                docker buildx build --platform linux/${arch} -t ${imageTag} . \
                    --cache-from=type=registry,ref=${env.IMAGE_NAME}:cache-${arch} \
                    --cache-to=type=registry,ref=${env.IMAGE_NAME}:cache-${arch},mode=max \
                    --progress=plain \
                    --push
                docker buildx rm ${builderName}
            """
        }
    }
}

def createAndPushMultiArchImage() {
    def imageTag = "${env.IMAGE_NAME}:${params.VERSION}"
    if (env.CHANGE_ID) {
        imageTag = "${env.IMAGE_NAME}:pr-${env.CHANGE_ID}"
    }
    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
        sh """
            export DOCKER_CLI_EXPERIMENTAL=enabled
            docker buildx imagetools create -t ${imageTag} \
                ${env.IMAGE_NAME}:${params.VERSION}-amd64 \
                ${env.IMAGE_NAME}:${params.VERSION}-arm64
        """
    }
}
