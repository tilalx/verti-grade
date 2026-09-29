pipeline {
    agent any

    environment {
        IMAGE_NAME = "tilalx/verti-grade"
        DOCKER_BUILDKIT = 1
        PIPELINE_NAME = "${JOB_NAME.replaceAll('/', '_')}-${BUILD_NUMBER}"
        DOCKER_CLI_EXPERIMENTAL = 'enabled'
        E2E_IMAGE = "gripello:e2e-${BUILD_NUMBER}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Setup Buildx') {
            steps {
                script {
                    sh 'docker run --rm --privileged tonistiigi/binfmt --install all'
                    sh 'docker buildx create --name gripello --driver docker-container 2>/dev/null || true'
                    sh 'docker buildx use gripello'
                    sh 'docker buildx inspect --bootstrap'
                    withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                        sh 'echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin'
                    }

                    // Resolve tags/version once, reused by the test-image build and the release build.
                    def branchName = env.BRANCH_NAME
                    def isReleaseCommit = false
                    def releaseVersion = ""

                    def commitMessage = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim().toLowerCase()
                    if (branchName == "main" && commitMessage ==~ /.*release\s+v?(\d+\.\d+\.\d+).*/) {
                        def matcher = (commitMessage =~ /release\s+v?(\d+\.\d+\.\d+)/)
                        if (matcher) {
                            releaseVersion = matcher[0][1]
                            isReleaseCommit = true
                        }
                    }

                    def tagName = ""
                    if (branchName == "main") {
                        tagName = "rolling"
                    } else if (branchName.startsWith("PR-")) {
                        tagName = "pr-${branchName.split('-')[1]}"
                    } else {
                        tagName = branchName.replaceAll(/[^a-zA-Z0-9._-]/, '-')
                    }

                    sh 'git fetch --tags --force --quiet || true'
                    def appVersion = sh(script: "git describe --tags --always | sed 's/^v//'", returnStdout: true).trim()
                    if (isReleaseCommit) {
                        appVersion = releaseVersion
                    }

                    def tags = "-t ${env.IMAGE_NAME}:${tagName}"
                    if (isReleaseCommit) {
                        tags += " -t ${env.IMAGE_NAME}:latest -t ${env.IMAGE_NAME}:${releaseVersion}"
                    }

                    env.APP_VERSION = appVersion
                    env.RELEASE_TAGS = tags
                }
            }
        }

        stage('Unit Tests') {
            parallel {
                stage('Vitest') {
                    steps {
                        sh 'docker buildx build --platform linux/amd64 --target unit-test --progress=plain --output type=cacheonly .'
                    }
                }
                stage('Go Hooks') {
                    steps {
                        sh '''
                            docker run --rm -v "$PWD/pocketbase":/src -w /src \
                                golang:1.27.1-trixie@sha256:433790e515d27dc6003e847e644cc0af956985cf315c1c58a3b73ee2dd305183 \
                                go test ./...
                        '''
                    }
                }
            }
        }

        stage('Build (test image)') {
            steps {
                sh """
                    docker buildx build --platform linux/amd64 --load --build-arg APP_VERSION=${env.APP_VERSION} -t ${env.E2E_IMAGE} .
                """
            }
        }

        stage('E2E Tests') {
            steps {
                sh """
                    docker volume create gripello-e2e-yarn-cache
                    E2E_IMAGE=${env.E2E_IMAGE} docker compose -p gripello-e2e-${BUILD_NUMBER} -f e2e/docker-compose.e2e.yml up --attach e2e --abort-on-container-exit --exit-code-from e2e
                """
            }
            post {
                failure {
                    sh "E2E_IMAGE=${env.E2E_IMAGE} docker compose -p gripello-e2e-${BUILD_NUMBER} -f e2e/docker-compose.e2e.yml logs --tail=500 app || true"
                }
                success {
                    script {
                        def flaky = fileExists('e2e/results/flaky.txt') ? readFile('e2e/results/flaky.txt').trim() : ''
                        if (flaky) {
                            unstable("Flaky e2e tests (passed only on retry):\n${flaky}")
                        }
                    }
                }
                always {
                    junit testResults: 'e2e/results/junit.xml', allowEmptyResults: true
                    archiveArtifacts artifacts: 'e2e/results/html/**, e2e/results/artifacts/**', allowEmptyArchive: true
                    sh "docker compose -p gripello-e2e-${BUILD_NUMBER} -f e2e/docker-compose.e2e.yml down -v || true"
                }
            }
        }

        stage('Build & Push (release image)') {
            steps {
                sh """
                    docker buildx build --platform linux/amd64 --provenance=true --sbom=true --build-arg DOCKER_BUILDKIT=${DOCKER_BUILDKIT} --build-arg APP_VERSION=${env.APP_VERSION} --memory 32g --memory-swap 16g ${env.RELEASE_TAGS} --push .
                """
            }
        }
    }


    post {
        always {
            script {
                sh 'docker buildx prune --builder gripello --keep-storage 20gb -f || true'
                sh "docker compose -p gripello-e2e-${BUILD_NUMBER} -f e2e/docker-compose.e2e.yml down -v || true"
            }
            cleanWs()
        }
    }
}
