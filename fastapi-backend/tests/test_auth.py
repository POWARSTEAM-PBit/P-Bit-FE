import sys
import os

# Add the parent directory to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest #noqa: F401
from tests.conftest import client, db_session # noqa: F401
from db.db_models import student, teacher
from routes.user import user_login

#default user data for testing
default_user = user_login(
    user_id = "lucasaponso@outlook.com",
    password = "password",
    user_type = "teacher"
)



def test_login_user(db_session):
    """
    Test creating a user via the API and verify the response.
    1. Create a user in the user table (Check that the user has been added to the DB)
    """
    response = client.post("/user/login", json=default_user.model_dump())

    assert response.status_code == 401

    does_user_exist = db_session.query(teacher).filter(teacher.email==default_user.user_id).first()
    assert does_user_exist is None