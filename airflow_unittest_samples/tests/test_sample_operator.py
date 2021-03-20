from datetime import datetime
from airflow.models import TaskInstance
from operators.sample_operator import CapitalizeLetters


def test_capitalize_letters(test_dag, caplog):
    """ Tests the CapitalizeLetters task.

        To test operators, we need three pieces (with examples used here):
        1. The dag (test_dag fixture)
        2. The task (instance of CapitalizeLetters)
        3. The task instance (ti)

        We execute the task instance and any returned values
        get stored in `result` for testing.

    """
    task = CapitalizeLetters(
        task_id="capitalize", letters="hey everyone", dag=test_dag,
    )
    ti = TaskInstance(task=task, execution_date=datetime.now())
    result = task.execute(ti.get_template_context())

    assert result == "HEY EVERYONE"
