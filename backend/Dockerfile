# Use newer CUDA base image with cuDNN
FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu20.04

# Set working directory
WORKDIR /app

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies including Rust prerequisites
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    tzdata \
    curl \
    build-essential \
    && ln -fs /usr/share/zoneinfo/Etc/UTC /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set CUDA and cuDNN environment variables
ENV PATH="/usr/local/cuda/bin:${PATH}"
ENV LD_LIBRARY_PATH="/usr/local/cuda/lib64:${LD_LIBRARY_PATH}"
ENV CUDA_HOME="/usr/local/cuda"
ENV CUDNN_PATH="/usr/lib/x86_64-linux-gnu/libcudnn.so"

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads transcripts

# Expose the port the app runs on
EXPOSE 8000

# Set environment variables for GPU usage
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility,video

# Command to run the application
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]