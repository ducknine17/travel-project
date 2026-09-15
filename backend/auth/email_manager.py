import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from urllib.parse import urlencode

import dotenv
import os
import secrets
import util.db as db
from auth.jwt_manager import create_password_change_token
from util.maker import idMaker

dotenv.load_dotenv(Path(__file__).resolve().parents[2] / ".env")

def send_email(subject, body, to_email):
    gmail_user = os.environ.get("EMAIL_ID")
    gmail_password = os.environ.get("EMAIL_PASSWORD")

    # 이메일 구성
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = to_email
    msg['Subject'] = subject

    part = MIMEText(body, 'html')
    msg.attach(part)

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(gmail_user, gmail_password)

    text = msg.as_string()
    server.sendmail(gmail_user, to_email, text)
    server.quit()

def send_link(uid, address):
    con = db.connect()
    id = idMaker()
    query = "INSERT INTO \"user\".validate (id, uid, is_used) VALUES (%s, %s, %s)"
    params = (id, uid, False)
    subject = "BEF 인증 이메일"
    link = f"{os.environ.get('EMAIL_LINK')}/{id}"
    content = f"<a href='https://bef-trip.my'>bef-trip.my</a> 인증 메일입니다.<br>다음의 링크에 들어가 인증을 완료하세요.<br><a href={link}>{link}</a><br>BEF 팀 드림"
    send_email(subject, content, address)
    db.executeQuery(con, query, params)


def send_password_change_link(uid, address):
    verification_id = f"password-change-{secrets.token_urlsafe(32)}"
    token = create_password_change_token(uid, verification_id)
    base_link = os.environ.get(
        "PASSWORD_CHANGE_LINK",
        "https://bef-trip.my/profile/edit",
    )
    separator = "&" if "?" in base_link else "?"
    link = f"{base_link}{separator}{urlencode({'token': token})}"
    subject = "BEF 비밀번호 변경 이메일 인증"
    content = (
        "<a href='https://bef-trip.my'>bef-trip.my</a> 비밀번호 변경 인증 메일입니다.<br>"
        "아래 링크는 10분 동안 유효합니다.<br>"
        f"<a href='{link}'>비밀번호 변경 계속하기</a><br>"
        "본인이 요청하지 않았다면 이 메일을 무시하세요.<br>BEF 팀 드림"
    )
    con = db.connect()
    try:
        db.executeQuery(
            con,
            'INSERT INTO "user".validate (id, uid, is_used) VALUES (%s, %s, %s)',
            (verification_id, uid, False),
        )
    finally:
        con.close()
    send_email(subject, content, address)
