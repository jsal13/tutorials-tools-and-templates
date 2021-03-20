import pandas as pd
import numpy as np
from datetime import datetime

datetime_cols = pd.date_range(start="01/01/2018", end="12/31/2020", freq="H")
col_shape = len(datetime_cols)

# Make a bunch of different types of columns
float_cols = np.random.rand(col_shape)
int_cols = np.random.randint(low=-100, high=100, size=(col_shape))
categorical_cols = np.random.choice(
    ["Off", "Low", "Medium", "High"], size=col_shape, p=[0.2, 0.5, 0.2, 0.1]
)
bool_cols = np.random.choice([True, False], size=col_shape)

all_cols = [datetime_cols, float_cols, int_cols, categorical_cols, bool_cols]
all_cols_names = ["datetime_col", "float_col", "int_col", "categorical_col", "bool_col"]

cols_dict = dict(zip(all_cols_names, all_cols))

df = pd.DataFrame(cols_dict)

df.to_csv("./data.csv", index=False)
