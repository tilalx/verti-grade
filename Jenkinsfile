pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        IMAGE_NAME = "tilalx/verti-grade"
        DOCKER_BUILDKIT = 1
        PIPELINE_NAME = "${JOB_NAME.replaceAll('/', '_')}-${BUILD_NUMBER}"
        DOCKER_CLI_EXPERIMENTAL = 'enabled'
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
                        docker buildx build --platform linux/amd64,linux/arm64 --build-arg DOCKER_BUILDKIT=${env.DOCKER_BUILDKIT} -t ${env.IMAGE_NAME}:${tagName} --push .
                    """
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    def builderName = "builder-${env.BUILD_ID}-${env.BRANCH_NAME}"
                    sh "docker buildx rm ${builderName}"
                }
            }
        }
    }

    post {
        always {
            cleanWs() // Clean workspace after each build
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
