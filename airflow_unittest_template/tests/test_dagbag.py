from airflow.models import DagBag

# Nb: There is no need to collect or process dags after creating DagBag;
# Airflow does this in the init:
# https://airflow.readthedocs.io/en/stable/_modules/airflow/models/dagbag.html#DagBag


def test_dags_load_with_no_errors():
    """Tests if the dagbag can be loaded without error."""
    dag_bag = DagBag(include_examples=False)
    assert len(dag_bag.import_errors) == 0
