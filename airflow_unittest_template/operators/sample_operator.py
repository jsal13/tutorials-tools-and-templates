import logging

from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults

log = logging.getLogger(__name__)


class CapitalizeLetters(BaseOperator):
    """ Capitalize Letters class. """
    @apply_defaults
    def __init__(self, letters, *args, **kwargs):
        self.letters = letters
        super(CapitalizeLetters, self).__init__(*args, **kwargs)

    def execute(self, context):
        log.info(f'Capitalizing letters in {self.letters}')
        return self.letters.upper()
