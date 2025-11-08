from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name="dashboard"),
    path('add-expense/', views.add_expense, name="add-expense"),
    path('summary/', views.summary, name="summary")

]
