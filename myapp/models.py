from django.db import models
from django.contrib.auth.models import User

# Create your models here.

import mongoengine as me


class User(me.Document):
    username = me.StringField(required=True, unique=True)

    def __str__(self):
        return self.username


class Expense(me.Document):
    description = me.StringField(required=True, max_length=200)
    amount = me.FloatField(required=True, min_value=0)
    paid_by = me.ReferenceField(User, required=True, reverse_delete_rule=me.CASCADE)
    participants = me.ListField(me.ReferenceField(User))
    date = me.DateTimeField(required=True)

    meta = {
        "collection": "expenses",   # MongoDB collection name
        "ordering": ["-date"]       # Default ordering
    }

    def __str__(self):
        return f"{self.description} - ${self.amount}"