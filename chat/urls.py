# chat/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('logout/', views.logout, name='logout'),
    path("<uuid:room_id>", views.chat_room, name="chat_room"),
    path("<str:room_name>/", views.room, name="room"),
]