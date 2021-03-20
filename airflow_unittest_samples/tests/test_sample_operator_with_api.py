from datetime import datetime
from airflow.models import TaskInstance
from operators.sample_operator_with_api_call import GetWeatherWithAPI


def test_weather_dag(test_dag, caplog, mocker):
    """ Tests the WeatherWithAPI task

        To test operators, we need three pieces (with examples used here):
        1. The dag (test_dag fixture)
        2. The task (instance of WeatherWithAPI)
        3. The task instance (ti)

        We execute the task instance and any returned values
        get stored in `result` for testing.

    """

    mocker.patch.object(
        GetWeatherWithAPI, "get_weather", return_value="cloudy",
    )

    task = GetWeatherWithAPI(task_id="get_weather", dag=test_dag,)
    ti = TaskInstance(task=task, execution_date=datetime.now())
    result = task.execute(ti.get_template_context())

    # Trivial check, but this is how one mocks the object + function.
    # We have a return which should match the API result approximately.
    assert result == "cloudy"
