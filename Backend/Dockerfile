FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /app

# Copy the entire backend directory content into the container at /app
COPY . .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Command to run the application
# The host 0.0.0.0 makes the server accessible from outside the container
RUN cat Backend/app/services/emergency_service.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]