# Stage 1: Build the Maven application
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copy pom.xml and dependency definitions
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy src and build the package
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/learner-placement-0.0.1-SNAPSHOT.jar app.jar

# Create folder for application logs
RUN mkdir logs

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]