pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION = 'ap-southeast-2' 
        S3_BUCKET_NAME     = 'ai-powered-learninig-platform' 
        EC2_PUBLIC_IP      = '13.210.164.2' 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Deploy Backend (EC2 via Docker Compose)') {
            steps {
                // Rebuild and restart the Docker services on the local EC2 machine running Jenkins
                sh '''
                    docker compose down
                    docker compose build --no-cache
                    docker compose up -d
                '''
            }
        }

        stage('Build & Deploy Frontend (S3)') {
            steps {
                dir('learner-intelligence-frontend') {
                    // Update frontend configuration dynamically to point to the EC2 Public IP
                    sh """
                        echo "VITE_API_URL=http://${EC2_PUBLIC_IP}:8081" > .env.production
                        echo "VITE_SOCKET_URL=http://${EC2_PUBLIC_IP}:3001" >> .env.production
                    """
                    
                    // Install dependencies and compile production static build (dist/)
                    sh '''
                        npm install
                        npm run build
                    '''
                    
                    // Upload built static site to AWS S3 bucket
                    sh 'aws s3 sync dist/ s3://${S3_BUCKET_NAME} --delete'
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment complete! The application is fully live.'
        }
        failure {
            echo 'Deployment failed. Please check build logs.'
        }
    }
}
