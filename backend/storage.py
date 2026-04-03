import json
from pathlib import Path


DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "tasks.json"


def load_tasks():
    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return data.get("tasks", [])


def save_tasks(tasks):
    data = {"tasks": tasks}
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
