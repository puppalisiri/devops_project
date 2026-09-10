pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/puppalisiri/devops_project.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                bat 'echo Build completed successfully'
            }
        }

        stage('Test') {
            steps {
                bat 'npm test'
            }
        }
    }
}