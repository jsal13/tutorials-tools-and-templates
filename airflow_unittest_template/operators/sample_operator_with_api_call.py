import logging
import requests
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults

log = logging.getLogger(__name__)


class GetWeatherWithAPI(BaseOperator):
    """ Hits an API (fake here, but could be real!) to make a message for a user.
    """

    @apply_defaults
    def __init__(self, *args, **kwargs):
        super(GetWeatherWithAPI, self).__init__(*args, **kwargs)

    def get_weather(self):
        # This is a fake API, this doesn't actually do anything when called.
        # It will give an obvious error here, but it's used for mocking in a test
        resp = requests.post("fakeaddress.fake/weather",
                             data={"area": "Chicago"})
        weather = resp.json()["data"]["weather"]
        return weather

    def execute(self, context):
        log.info(f"Hitting our custom API to get weather")
        return self.get_weather()
