from storage import load_tasks


def main():
    tasks = load_tasks()
    print("Taches chargees :")
    for task in tasks:
        print(
            f"- {task['id']}: {task['title']} "
            f"(depends_on={task.get('depends_on', [])})"
        )


if __name__ == "__main__":
    main()
