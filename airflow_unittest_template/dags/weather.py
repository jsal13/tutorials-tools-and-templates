from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago
from operators.sample_operator_with_api_call import GetWeatherWithAPI

args = {
    "owner": "airflow",
    "start_date": days_ago(2),
}

with DAG(
    dag_id="aaaaa_silly_python",
    default_args=args,
    schedule_interval=None,
    tags=["example"],
) as dag:

    def other_task():
        """ Another task potentially depending on get_weather hitting the API. """
        return 1

    # Notice that even though this hits a fake API and should fail, the validation passes.
    get_weather = GetWeatherWithAPI(task_id="get_weather")

    python_fn = PythonOperator(
        task_id="python_fn", python_callable=other_task,)

# pylint: disable=pointless-statement
get_weather >> python_fn
