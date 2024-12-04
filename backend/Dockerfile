FROM nvidia/cuda:12.6.2-cudnn-runtime-ubuntu24.04

# Set working directory
WORKDIR /app

# Install system dependencies
# hadolint ignore=DL3008
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    python3.12 \
    ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install UV package manager
COPY --from=ghcr.io/astral-sh/uv:0.5.1 /uv /bin/uv

# Set CUDA and cuDNN environment variables
ENV PATH="/usr/local/cuda/bin:${PATH}"
ENV LD_LIBRARY_PATH="/usr/local/cuda/lib64:${LD_LIBRARY_PATH}"
ENV CUDA_HOME="/usr/local/cuda"
ENV CUDNN_PATH="/usr/lib/x86_64-linux-gnu/libcudnn.so"

# Copy dependency files
COPY requirements.txt pyproject.toml uv.lock ./

# Install dependencies using UV
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads transcripts

# Set environment variables
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility,video
ENV UVICORN_HOST=0.0.0.0
ENV UVICORN_PORT=8000

# Expose the port
EXPOSE 8000

# Run the application
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]