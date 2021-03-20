from typing import Optional

from pydantic import BaseModel  # pylint: disable=no-name-in-module
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://0.0.0.0",
    "http://0.0.0.0:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


class TestData(BaseModel):
    num: int


@app.post("/test")
async def read_item(data: TestData):
    return {"data": data.num + 133}
