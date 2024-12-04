# Use the specified NVIDIA CUDA base image
FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu20.04

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.8 \
    python3-pip \
    build-essential \
    ffmpeg \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Ensure python3 and pip3 point to the correct versions
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1 \
    && update-alternatives --install /usr/bin/pip3 pip3 /usr/bin/pip3 1

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt /app/

# Install Python dependencies
RUN pip3 install --upgrade pip
RUN pip3 install --no-cache-dir -r requirements.txt

# Install PyTorch separately to ensure CUDA compatibility
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Copy the rest of the application code
COPY . /app/

# Create necessary directories
RUN mkdir -p uploads transcripts logs

# Expose port
EXPOSE 8000

# Use non-root user for security
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
