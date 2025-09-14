import os
import json
from flask import Flask, request, jsonify, send_from_directory
import gspread
import pandas as pd
from datetime import datetime
import uuid

app = Flask(__name__, static_folder='public')

# --- Google Sheets との連携設定 (環境変数から読み込む) ---
# Render上で設定する環境変数から認証情報を読み込む
creds_json_str = os.environ.get('GCP_CREDENTIALS')
if creds_json_str:
    creds_dict = json.loads(creds_json_str)
    gc = gspread.service_account_from_dict(creds_dict)
else:
    # ローカルでテストする場合 (credentials.json を使う)
    gc = gspread.service_account(filename='credentials.json')

SPREADSHEET_ID = '15tejgT5aA67rR0XVQyM-tcwyQRhR9aNNjHUAMjGIXuo' # あなたのスプレッドシートIDに置き換えてください
worksheet = gc.open_by_key(SPREADSHEET_ID).sheet1

# --- 正解データをサーバーに読み込んでおく ---
correct_answers_df = pd.read_csv('quiz.csv')

# --- APIエンドポイント (/submit) ---
@app.route('/submit', methods=['POST'])
def submit_results():
    try:
        user_submission = request.json
        user_answers = user_submission.get('answers', [])
        score, total_questions = 0, len(user_answers)
        
        for answer_data in user_answers:
            question_text = answer_data.get('question')
            user_answer_text = answer_data.get('userAnswer')
            correct_row = correct_answers_df[correct_answers_df['question'] == question_text]
            if not correct_row.empty:
                if user_answer_text == correct_row.iloc[0]['answer']:
                    score += 1
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        submission_id = str(uuid.uuid4())
        worksheet.append_row([timestamp, submission_id, f"{score}/{total_questions}"])
        return jsonify({"message": "結果を正常に保存しました。"}), 200
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return jsonify({"message": "サーバーエラーが発生しました。"}), 500

# --- フロントエンドのファイルを表示するためのルート ---
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Gunicornで実行するために、この部分は不要になります
# if __name__ == '__main__':
#     app.run(debug=False)