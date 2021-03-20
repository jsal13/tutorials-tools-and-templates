from datetime import datetime, timedelta
import pytest
from airflow import DAG

# What is a conftest?
# For more info, check out: https://docs.pytest.org/en/2.7.3/plugins.html?highlight=re


@pytest.fixture
def test_dag():
    """Returns a test dag if the operator requires a dag to run in."""
    return DAG(
        "test_dag",
        default_args={"owner": "airflow", "start_date": datetime.today()},
        schedule_interval=timedelta(days=1),
    )
