from flask import Flask, render_template, request, redirect, url_for, flash, session
import random
import copy
import time

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = "your_secret_key_here"

# Game difficulty settings
DIFFICULTY_LEVELS = {
    "1": {"name": "Beginner", "min": 30, "max": 35},
    "2": {"name": "Easy", "min": 36, "max": 41},
    "3": {"name": "Medium", "min": 42, "max": 47},
    "4": {"name": "Hard", "min": 48, "max": 53},
    "5": {"name": "Expert", "min": 54, "max": 60},
}

solving_steps = []


@app.route("/")
def home():
    session.clear()
    solving_steps.clear()
    return render_template("levels.html")


@app.route("/game/<level>")
def new_game(level):
    if level not in DIFFICULTY_LEVELS:
        return redirect(url_for("home"))

    solved_board = generate_solved_board()
    cells_to_remove = random.randint(
        DIFFICULTY_LEVELS[level]["min"], DIFFICULTY_LEVELS[level]["max"]
    )
    puzzle = create_puzzle(solved_board, cells_to_remove)

    session["puzzle"] = puzzle
    session["solved"] = solved_board
    session["level"] = level
    session["start_time"] = time.time()
    session["hints_used"] = 0
    solving_steps.clear()

    return render_template(
        "game.html", board=puzzle, level_name=DIFFICULTY_LEVELS[level]["name"]
    )


@app.route("/check", methods=["POST"])
def check_solution():
    if "puzzle" not in session:
        return redirect(url_for("home"))

    board = []
    for i in range(9):
        row = []
        for j in range(9):
            cell = request.form.get(f"cell_{i}_{j}", "")
            if cell.isdigit():
                num = int(cell)
                row.append(num if 1 <= num <= 9 else 0)
            else:
                row.append(0)
        board.append(row)

    if is_complete(board) and board == session["solved"]:
        time_taken = int(time.time() - session["start_time"])
        return render_template(
            "congrats.html",
            time_taken=time_taken,
            hints_used=session["hints_used"],
            level_name=DIFFICULTY_LEVELS[session["level"]]["name"],
        )

    return render_template(
        "game.html",
        board=board,
        level_name=DIFFICULTY_LEVELS[session["level"]]["name"],
        message="Solution incorrect, try again",
    )


@app.route("/hint")
def get_hint():
    if "puzzle" not in session:
        return redirect(url_for("home"))

    for i in range(9):
        for j in range(9):
            if session["puzzle"][i][j] == 0:
                session["hints_used"] += 1
                return {"row": i, "col": j, "value": session["solved"][i][j]}
    return {"error": "No hints available"}


@app.route("/solve", methods=["POST"])
def solve_ai():
    if "solved" not in session:
        return redirect(url_for("home"))
    return render_template("solution.html", board=session["solved"])


@app.route("/visualize")
def visualize_solution():
    if "puzzle" not in session:
        return redirect(url_for("home"))

    solving_steps.clear()
    board = copy.deepcopy(session["puzzle"])
    solve_with_steps(board)

    return {"steps": solving_steps}


def generate_solved_board():
    board = [[0 for _ in range(9)] for _ in range(9)]
    for box in range(0, 9, 3):
        fill_diagonal_box(board, box, box)
    solve(board)
    return board


def fill_diagonal_box(board, row, col):
    nums = list(range(1, 10))
    random.shuffle(nums)
    for i in range(3):
        for j in range(3):
            board[row + i][col + j] = nums.pop()


def create_puzzle(solved_board, cells_to_remove):
    puzzle = [row.copy() for row in solved_board]
    positions = [(i, j) for i in range(9) for j in range(9)]
    random.shuffle(positions)

    for i, j in positions[:cells_to_remove]:
        puzzle[i][j] = 0
    return puzzle


def solve(board):
    empty = find_empty(board)
    if not empty:
        return True
    row, col = empty

    for num in random.sample(range(1, 10), 9):
        if is_valid(board, row, col, num):
            board[row][col] = num
            if solve(board):
                return True
            board[row][col] = 0
    return False


def solve_with_steps(board):
    empty = find_empty(board)
    if not empty:
        return True

    row, col = empty

    for num in range(1, 10):
        if is_valid(board, row, col, num):
            solving_steps.append(
                {
                    "row": row,
                    "col": col,
                    "value": num,
                    "action": "place",
                    "board": copy.deepcopy(board),
                }
            )

            board[row][col] = num

            if solve_with_steps(board):
                return True

            solving_steps.append(
                {
                    "row": row,
                    "col": col,
                    "value": 0,
                    "action": "remove",
                    "board": copy.deepcopy(board),
                }
            )

            board[row][col] = 0

    return False


def find_empty(board):
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                return (i, j)
    return None


def is_valid(board, row, col, num):
    for i in range(9):
        if board[row][i] == num or board[i][col] == num:
            return False
    box_row, box_col = row // 3 * 3, col // 3 * 3
    for i in range(3):
        for j in range(3):
            if board[box_row + i][box_col + j] == num:
                return False
    return True


def is_complete(board):
    for row in board:
        if 0 in row:
            return False
    return True


if __name__ == "__main__":
    app.run(debug=True)
