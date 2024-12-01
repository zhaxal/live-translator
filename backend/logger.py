# logger.py
import logging
import sys
from typing import Dict, Any
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Unified format for all logs
UNIFIED_FORMAT = "%(levelprefix)s %(asctime)s | %(name)s | %(message)s"

class ColoredFormatter(logging.Formatter):
    def __init__(self):
        super().__init__(fmt=UNIFIED_FORMAT, datefmt="%Y-%m-%d %H:%M:%S")
        
        self.level_colors = {
            logging.DEBUG: Fore.CYAN,
            logging.INFO: Fore.GREEN,
            logging.WARNING: Fore.YELLOW,
            logging.ERROR: Fore.RED,
            logging.CRITICAL: Fore.RED + Style.BRIGHT
        }
        
        self.level_prefixes = {
            logging.DEBUG: "DEBUG:   ",
            logging.INFO: "INFO:    ",
            logging.WARNING: "WARNING: ",
            logging.ERROR: "ERROR:   ",
            logging.CRITICAL: "CRITICAL:"
        }

    def format(self, record):
        if not hasattr(record, "levelprefix"):
            color = self.level_colors.get(record.levelno, Fore.WHITE)
            prefix = self.level_prefixes.get(record.levelno, "INFO:    ")
            record.levelprefix = color + prefix + Style.RESET_ALL  # Reset color after prefix
        return super().format(record)

def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(ColoredFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger

def get_uvicorn_log_config() -> Dict[str, Any]:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "unified": {
                "()": ColoredFormatter,
            }
        },
        "handlers": {
            "default": {
                "formatter": "unified",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            }
        },
        "loggers": {
            "": {"handlers": ["default"], "level": "INFO"},
            "uvicorn": {"handlers": ["default"], "level": "INFO"},
            "uvicorn.error": {"level": "INFO"},
            "uvicorn.access": {"handlers": ["default"], "level": "INFO", "propagate": False},
        },
    }
