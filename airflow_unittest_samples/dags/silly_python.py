#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

"""Example DAG demonstrating the usage of the PythonOperator."""

from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.utils.dates import days_ago

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

    def my_fn():
        return "Hello"

    def my_fn2():
        return "Hello2"

    t1 = PythonOperator(task_id="hello1", python_callable=my_fn,)

    t2 = PythonOperator(task_id="hello2", python_callable=my_fn2,)

# pylint: disable=pointless-statement
t1 >> t2
