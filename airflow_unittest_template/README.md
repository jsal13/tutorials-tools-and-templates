# Sample Airflow Structure with Testing

## Quick Start

To run these, you will have to:

1. Clone this repo,
2. Have airflow installed and be in your airflow folder,
3. Copy the cloned directories into your airflow folder,
4. Run airflow as you normally would locally.
   - Run `airflow initdb` to initialize the airflow db if you haven't,
   - Open one terminal tab and run `airflow scheduler`
   - Open another tab and run `airflow webserver -p 8080`

To test manually, go into the root directory and run `python -m pytest`.

**Note: It is not enough to run `pytest`. You must use `python -m pytest.`**

## Makefile

A makefile is provided for ease of use. There are two commands:

- `make init`: Initializes the repo and installs the pre-commit items.
- `make test`: Runs `python -m pytest`.

## Testing in Airflow

Let's note what types of tests we need for airflow.

### 1. DAG Validation

**Location:** `/tests/test_dagbag.py`

Typically called `test_dagbag` or `test_validation`, this test processes each DAG config in the `dags` folder.

**Note this does not say if your DAG will run successfully, only that there are no issues in the DAG config (typos, undefined params, etc.)**

### 2. Pipeline Tests

These tests will look at the pipeline in the DAG, eg., upstream and downstream dependencies of each task.

### 3. Unit Tests

(Most tests prefixed with `test_` are unit tests, except when otherwise noted.)

Tests at the level of custom operators, custom hooks, etc. This will take up the bulk of the testing.

### 4. Integration / End-to-End

These test the communication between tasks. These may or may not be contained in the unittests or may be external (eg, in docker-compose setups in circleci, jenkins, etc).
