from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

def init_openai():
    try:
        client = OpenAI()
        logger.info("Initialized OpenAI client successfully.")
        return client
    except Exception as e:
        logger.exception("Failed to initialize OpenAI client.")
        raise e
