import openai
import os


def init_openai():
    api_key = os.getenv('OPENAI_API_KEY')
    openai.api_key = api_key
    return openai
