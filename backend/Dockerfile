FROM nvidia/cuda:12.6.2-cudnn-runtime-ubuntu24.04

# Set working directory
WORKDIR /app

# Install system dependencies
# hadolint ignore=DL3008
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    python3.12 \
    python3-pip \
    python3-venv \
    python3-full \
    ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    python3 -m venv /opt/venv

# Activate virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Set CUDA and cuDNN environment variables
ENV PATH="/usr/local/cuda/bin:${PATH}" \
    LD_LIBRARY_PATH="/usr/local/cuda/lib64:${LD_LIBRARY_PATH}" \
    CUDA_HOME="/usr/local/cuda" \
    CUDNN_PATH="/usr/lib/x86_64-linux-gnu/libcudnn.so"

# Copy requirements and install dependencies in venv
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code and create directories
COPY . .
RUN mkdir -p uploads transcripts

# Set environment variables
ENV NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility,video \
    UVICORN_HOST=0.0.0.0 \
    UVICORN_PORT=8000

# Expose the port
EXPOSE 8000

# Run the application with venv python
CMD ["/opt/venv/bin/python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]