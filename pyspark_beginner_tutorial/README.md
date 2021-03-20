# Quickstart

1. Build the docker image with the following in your terminal:

```bash
docker build -t pyspark_tutorial .
```

2. After the build is complete, we'll run the Jupyter server to bring up our PySpark Jupyter notebook.

```bash
docker run -v /path/to/dir/you/save/work/to:/home/jovyan/work -p 8888:8888 pyspark_tutorial
```

3. We're going to copy the link in the terminal which will look something like this:

```bash
http://127.0.0.1:8888/?token=lotsandlotsofnumbersandletters
```

4. Navigate to the "Tutorial" notebook and enter it. Run the "Setup" section of the notebook file provided and then follow the instructions!

## Solutions

Solutions to portions of the code will be given in the "solutions.html" with their associated section number.
