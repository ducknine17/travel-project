import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from random import random

import dotenv
import os
import util.db as db
from util.maker import idMaker

dotenv.load_dotenv("../../.env")

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
    number = str(int(random() * 1000000))
    number = (6 - len(number)) * '0' + number
    query = "INSERT INTO \"user\".validate (id, uid, is_used) VALUES (%s, %s, %s)"
    params = (id, uid, False)
    subject = "BEF 인증 이메일"
    link = f"{os.environ.get("EMAIL_LINK")}/{id}"
    content = f"<a href='https://bef-trip.my'>bef-trip.my</a> 인증 메일입니다.<br>다음의 링크에 들어가 인증을 완료하세요.<br><a href={link}>{link}</a><br>BEF 팀 드림"
    send_email(subject, content, address)
    db.executeQuery(con, query, params)