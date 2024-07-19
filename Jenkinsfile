pipeline {
    agent any

    environment {
        IMAGE_NAME = "tilalx/verti-grade"
        DOCKER_BUILDKIT = 1
        PIPELINE_NAME = "${JOB_NAME.replaceAll('/', '_')}-${BUILD_NUMBER}"
        DOCKER_CLI_EXPERIMENTAL = 'enabled'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm: [$class: 'GitSCM', userRemoteConfigs: [[
                    url: 'https://github.com/tilalx/verti-grade.git',
                    credentialsId: 'github-tilalx'
                ]], branches: [[name: '**']]]
            }
        }

        stage('Setup Buildx') {
            steps {
                script {
                    sh 'docker run --rm --privileged tonistiigi/binfmt --install all'
                    def builderName = "builder-${env.BUILD_ID}-${env.BRANCH_NAME}"
                    sh "docker buildx create --name ${builderName} --use"
                    sh 'docker buildx inspect --bootstrap'
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                        sh 'echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def branchName = env.BRANCH_NAME
                    def tagName = ""

                    if (branchName == "main") {
                        tagName = "latest"
                    } else if (branchName.startsWith("PR-")) {
                        tagName = "pr-${branchName.split('-')[1]}"
                    } else {
                        tagName = branchName
                    }

                    sh """
                        docker buildx build --platform linux/amd64,linux/arm64,linux/s390x --build-arg DOCKER_BUILDKIT=${DOCKER_BUILDKIT} --memory 32g --memory-swap 16g -t ${env.IMAGE_NAME}:${tagName} --push .
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                def builderName = "builder-${env.BUILD_ID}-${env.BRANCH_NAME}"
                sh "docker buildx rm ${builderName}"
            }
            cleanWs()
        }
    }
}
